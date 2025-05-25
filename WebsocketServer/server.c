#include<stdio.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/ip.h>
#include <string.h>
#include <errno.h>
#include <unistd.h>
#include <openssl/sha.h>
#include <openssl/bio.h>
#include <openssl/evp.h>
#include <openssl/buffer.h>
#include "hashmap.c"
#include <stdbool.h>
#include <sys/select.h>
#include <sys/time.h>
#include "db_utils.h"

#define WS_FIN 0x80
#define WS_OP_TEXT 0x1
#define WS_MASK 0x0

#define MAX_CLIENTS 30
#define BUFFER_LENGTH 4000

struct websocket_frame {
  uint8_t fin;
  uint8_t opcode;
  uint64_t payload_len;
  uint8_t mask_flag;
  uint8_t mask[4];
  char *payload_data;
};

struct user {
  char *name;
  int socketId;
};

typedef struct {
  int socketFd;
  char buffer[BUFFER_LENGTH];
  int currentBufferLen;
  int expectedLen;
  bool isLoggedIn;
} Client;

struct hashmap *map;
char* get_iso8601_timestamp_utc() {
  struct timeval tv;
  gettimeofday(&tv, NULL);

  struct tm* tm_info = gmtime(&tv.tv_sec);  // convert to UTC

  char* buffer = malloc(32);  // YYYY-MM-DDTHH:MM:SS.mmmZ = 24+1
  if (!buffer) return NULL;

  // Format time without milliseconds
  strftime(buffer, 21, "%Y-%m-%dT%H:%M:%S", tm_info);

  // Append milliseconds and 'Z'
  snprintf(buffer + 19, 13, ".%03ldZ", tv.tv_usec / 1000);

  return buffer;  // Caller must free()
}

int user_compare(const void *a, const void *b, void *udata) {
  const struct user *ua = a;
  const struct user *ub = b;
  return strcmp(ua->name, ub->name);
}

bool user_iter(const void *item, void *udata) {
  const struct user *user = item;
  printf("%s (socketId=%d)\n", user->name, user->socketId);
  return true;
}

uint64_t user_hash(const void *item, uint64_t seed0, uint64_t seed1) {
  const struct user *user = item;
  return hashmap_sip(user->name, strlen(user->name), seed0, seed1);
}

void create_websocket_frame(const char *message, uint8_t *frame, size_t *frame_len) {
  size_t payloadLength = strlen(message);
  size_t index = 0;

  frame[index++] = WS_FIN | WS_OP_TEXT;

  if (payloadLength <= 125) {
    frame[index++] = payloadLength | WS_MASK;
  } else if (payloadLength <= 65535) {
    frame[index++] = 126 | WS_MASK;
    frame[index++] = (payloadLength >> 8) & 0xFF;
    frame[index++] = payloadLength & 0xFF;
  } else {
    frame[index++] = 127 | WS_MASK;
    // Handle 64-bit length encoding here if needed
  }

  for (size_t i = 0; i < payloadLength; ++i) {
    frame[index++] = message[i];
  }

  *frame_len = index;
}

char *extractSocketKey(char *response) {
  char *s;
  char *key = NULL;

  s = strtok(response, "\r\n");
  while (s != NULL) {
    if (s[strlen(s) - 1] == '=') {
      strtok(s, " ");
      key = strtok(NULL, " ");
      return key;
    }
    s = strtok(NULL, "\r\n");
  }
  return NULL;
}

char *base64_encode(const unsigned char *input, int length) {
  BIO *bmem, *b64;
  BUF_MEM *bptr;

  b64 = BIO_new(BIO_f_base64());
  bmem = BIO_new(BIO_s_mem());
  b64 = BIO_push(b64, bmem);

  BIO_write(b64, input, length);
  BIO_flush(b64);
  BIO_get_mem_ptr(b64, &bptr);

  char *buff = (char *)malloc(bptr->length + 1);
  memcpy(buff, bptr->data, bptr->length);
  buff[bptr->length] = '\0';

  BIO_free_all(b64);

  return buff;
}

int getIdByUsername(char *recieverName)
{
    if (!recieverName) {
        // fprintf(stderr, "recieverName is NULL\n");
        return -1;
    }
    size_t iter = 0;
    void *item;
    while (hashmap_iter(map, &iter, &item)) {
        const struct user *user = item;
        if (!user || !user->name) {
            continue;
        }
        if (strcmp(recieverName, user->name) == 0) {
            return user->socketId;
        }
    }
    return -1;
}

char *getUsernameById(int senderId)
{
  char *senderName = NULL;
  size_t iter = 0;
  void *item;
  while (hashmap_iter(map, &iter, &item)) {
    const struct user *user = item;
    if (user->socketId == senderId) {
      senderName = user->name;
      break;
    }
  }
  return senderName;
}

char *readUntilWhiteChar(char *string, int *pointer) {
  if (string[*pointer] == '\0') return NULL;

  char *newString = malloc(100);
  if (!newString) return NULL; // Provera alokacije memorije

  int i = *pointer, j = 0;

  // Korišćenje && umesto || da bi se pravilno prekinula petlja
  while (string[i] != ' ' && string[i] != '\n' && string[i] != '\0') {
    newString[j++] = string[i++];
  }

  newString[j] = '\0'; // Završavanje stringa

  if (string[i] != '\0') i++; // Preskoči razmak ako postoji

  *pointer = i; // Ažuriraj pokazivač

  return newString;
} 

struct websocket_frame *decryptWebsocketMessage(char *response){
  struct websocket_frame *wb = malloc(sizeof(struct websocket_frame));
  wb->fin = (response[0] & 0x80) >> 7;
  wb->opcode = response[0] & 0x0F;
  wb->mask_flag = (response[1] & 0x80) >> 7;
  wb->payload_len = response[1] & 0x7F;

  if (wb->payload_len == 126) {
    uint16_t x = response[2] << 8;
    wb->payload_len = (x | response[3]);
  } else if (wb->payload_len == 127) {
    // Handling for extended payloads (over 65535 bytes) can be added here
    // index = 10;  // Starting index for the extended payload length
  } 

  int index=2;
  wb->mask[0] = response[index++];
  wb->mask[1] = response[index++];
  wb->mask[2] = response[index++];
  wb->mask[3] = response[index++];

  // Allocate memory for payload data and unmask it
  wb->payload_data = malloc(wb->payload_len + 1);
  for (int i = 0, j = 0; i < wb->payload_len; i++) {
    wb->payload_data[i] = response[index + i] ^ wb->mask[j++ % 4];
  }
  wb->payload_data[wb->payload_len] = '\0'; 
  return wb;
}

void handleSeen(int sd,struct websocket_frame *wb)
{
  int i=0;
  readUntilWhiteChar(wb->payload_data,&i);
  char *recieverName = readUntilWhiteChar(wb->payload_data,&i);
  char *messageId = readUntilWhiteChar(wb->payload_data,&i);
  char *senderName=getUsernameById(sd);

  char *seenConfirmation=malloc(strlen(senderName)+strlen(messageId)+4);
  sprintf(seenConfirmation, "6: %s %s", senderName, messageId);
  printf("Seenconfirmation:%s\n",seenConfirmation);

  int recieverId=getIdByUsername(recieverName);
  uint8_t frame[256] = {0};
  size_t frameLength;
  create_websocket_frame(seenConfirmation, frame, &frameLength);
  send(recieverId, frame, frameLength, 0);
}

void handleUpgradeRequest(int sd,char *response){
  char *guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
  char *socketKey = extractSocketKey(response);
  if (socketKey) {
    size_t total_len = strlen(socketKey) + strlen(guid) + 1;
    char *concatenatedKey = (char *)malloc(total_len);
    if (!concatenatedKey) {
      printf("Memory allocation failed\n");
      close(sd);
      return;
    }

    strcpy(concatenatedKey, socketKey);
    strcat(concatenatedKey, guid);

    unsigned char hash[SHA_DIGEST_LENGTH];
    SHA1((unsigned char *)concatenatedKey, strlen(concatenatedKey), hash);

    char *encoded_hash = base64_encode(hash, SHA_DIGEST_LENGTH);
    encoded_hash[strlen(encoded_hash)-1]='\0';
    char *confirmation = (char *)malloc(4000);
    if (!confirmation) {
      printf("Memory allocation failed\n");
      free(concatenatedKey); 
      close(sd);
      return;
    }

    strcpy(confirmation, "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ");
    strcat(confirmation, encoded_hash);
    strcat(confirmation, "\r\nSec-WebSocket-Protocol: protocol1\r\n\r\n");

    send(sd, confirmation, strlen(confirmation), 0);

    free(confirmation);
    free(concatenatedKey);
    free(encoded_hash);
  }
}

void handleDirectMessage(int sd,struct websocket_frame *wb){
  int i = 0;
  readUntilWhiteChar(wb->payload_data,&i);
  char *recieverName=readUntilWhiteChar(wb->payload_data,&i);
  char *messageId= readUntilWhiteChar(wb->payload_data,&i);

  int recieverId, senderId = sd;
  size_t iter = 0;
  void *item;

  recieverId=getIdByUsername(recieverName);
  if (recieverId != 0) {
    char *senderName = getUsernameById(senderId);
    char *messageContent = readUntilWhiteChar(wb->payload_data,&i);
    char *pfp=readUntilWhiteChar(wb->payload_data,&i);
    char *timestamp=get_iso8601_timestamp_utc();

    char *fullMessage = malloc(strlen(senderName) + strlen(messageContent)+strlen(messageId)+strlen(pfp)+strlen(timestamp)+ 10);  
    sprintf(fullMessage, "2: %s %s %s %s %s", senderName,messageId, messageContent,pfp,timestamp);

    uint8_t frame[256] = {0};
    size_t frameLength;
    create_websocket_frame(fullMessage, frame, &frameLength);
    send(recieverId, frame, frameLength, 0);

    if(senderId>0)
    {
      char *sentMessageConfirmation=malloc(strlen(messageId)+4);
      sprintf(sentMessageConfirmation, "8: %s %s", recieverName,messageId);
      create_websocket_frame(sentMessageConfirmation, frame, &frameLength);
      send(senderId, frame, frameLength, 0);
    }

    free(messageContent);
    free(fullMessage);
  }
}

void handleGroupMessage(int sd,struct websocket_frame *wb,MYSQL *conn){
  int i=0;
  readUntilWhiteChar(wb->payload_data,&i);
  char *groupIdString = readUntilWhiteChar(wb->payload_data,&i);
  char *messageId = readUntilWhiteChar(wb->payload_data,&i);
  char *messageContent = readUntilWhiteChar(wb->payload_data,&i);
  char *pfp=readUntilWhiteChar(wb->payload_data,&i);
  char *username=readUntilWhiteChar(wb->payload_data,&i);
  char *timestamp=get_iso8601_timestamp_utc();
  char groupId=atoi(groupIdString);
  int numberOfMembers;
  char **groupMembers=fetch_group_members(conn,groupId,&numberOfMembers);
  char *fullMessage = malloc(strlen(groupIdString) + strlen(messageContent)+strlen(messageId)+strlen(pfp)+strlen(username) + strlen(timestamp) +10);  

  for(i=0;i<numberOfMembers;i++)
  {
    if(strcmp(groupMembers[i],username)!=0){
      sprintf(fullMessage, "7: %s %s %s %s %s %s", groupIdString,messageId,messageContent,pfp,timestamp,username);
      uint8_t frame[256] = {0};
      size_t frameLength;
      create_websocket_frame(fullMessage, frame, &frameLength);
      send(getIdByUsername(groupMembers[i]), frame, frameLength, 0);
    }
  }
  uint8_t frame[256] = {0};
  size_t frameLength;
  char *sentMessageConfirmation=malloc(strlen(messageId)+4);
  sprintf(sentMessageConfirmation, "8: %s %s", groupIdString,messageId);
  create_websocket_frame(sentMessageConfirmation, frame, &frameLength);
  send(sd, frame, frameLength, 0);
}

void handleFriendUpdate(int sd,struct websocket_frame *wb)
{
  int i=0;
  readUntilWhiteChar(wb->payload_data,&i);
  char *username = readUntilWhiteChar(wb->payload_data,&i);
  char *friendName = readUntilWhiteChar(wb->payload_data,&i);
  int friendId;
  if((friendId=getIdByUsername(friendName))==-1) return;
  char *fullMessage=malloc(strlen(username)+strlen(friendName)+10);
  sprintf(fullMessage, "3: %s", username);
  uint8_t frame[256] = {0};
  size_t frameLength;
  create_websocket_frame(fullMessage, frame, &frameLength);
  send(friendId, frame, frameLength, 0);
}

void handleGroupEdit(int sd,struct websocket_frame *wb,MYSQL *conn)
{
  int i=0;
  readUntilWhiteChar(wb->payload_data,&i);
  char *groupId = readUntilWhiteChar(wb->payload_data,&i);
  char *removedUsername = readUntilWhiteChar(wb->payload_data,&i);
  char *username;
  while((username=readUntilWhiteChar(wb->payload_data,&i))!=NULL){
    char *fullMessage=malloc(strlen(removedUsername)+strlen(groupId)+10);
    sprintf(fullMessage, "4: %s %s",groupId, removedUsername);
    uint8_t frame[256] = {0};
    size_t frameLength;
    create_websocket_frame(fullMessage, frame, &frameLength);
    send(getIdByUsername(username), frame, frameLength, 0);
  }
}

void handleGroupCreationAndDeletion(int sd,struct websocket_frame *wb,MYSQL *conn)
{
  int i=0;
  readUntilWhiteChar(wb->payload_data,&i);
  char *groupId = readUntilWhiteChar(wb->payload_data,&i);
  char *createOrDelete = readUntilWhiteChar(wb->payload_data,&i);
  char *username;
  while((username=readUntilWhiteChar(wb->payload_data,&i))!=NULL){
    char *fullMessage=malloc(strlen(createOrDelete)+strlen(groupId)+10);
    sprintf(fullMessage, "5: %s %s",groupId, createOrDelete);
    uint8_t frame[256] = {0};
    size_t frameLength;
    create_websocket_frame(fullMessage, frame, &frameLength);
    send(getIdByUsername(username), frame, frameLength, 0);
  }
}

void bufferTheMessage(int sd, Client clients[],int client_sockets[],int i,MYSQL *conn) {
  Client *client = &clients[sd];

  int bytes_received = recv(sd, client->buffer + client->currentBufferLen, BUFFER_LENGTH - client->currentBufferLen, 0);

  if (bytes_received <= 0) {
    close(sd);
    client_sockets[i] = 0;
    memset(&clients[sd], 0, sizeof(Client));
    return;
  }

  client->currentBufferLen += bytes_received;
  client->buffer[client->currentBufferLen] = '\0'; 

  if (!client->isLoggedIn) {
    char *end_of_headers = strstr(client->buffer, "\r\n\r\n");
    if (end_of_headers) {
      if (strncmp(client->buffer, "GET", 3) == 0) {
        int header_len = (end_of_headers - client->buffer)+4;
        int remaining = client->currentBufferLen - header_len;
        char *upgradeString=malloc(header_len+1);
        memmove(upgradeString, client->buffer , header_len);
        upgradeString[header_len]='\0';
        handleUpgradeRequest(sd,upgradeString);
        if (remaining > 0) {
          memmove(client->buffer, client->buffer + header_len, remaining);
        }
        client->currentBufferLen = remaining;
        client->buffer[client->currentBufferLen] = '\0';

        client->isLoggedIn = true;
      } else {
        printf("Nepoznat zahtev: %s\n", client->buffer);
      }
    }
  } else {
    if(client->expectedLen==0 && client->currentBufferLen>=2){
      int websocketLength=(client->buffer[1]&0x7F)+6;
      while(client->currentBufferLen>=websocketLength){
        int remaining = client->currentBufferLen - websocketLength;
        char *websocketResponse=malloc(websocketLength);
        memmove(websocketResponse, client->buffer , websocketLength);
        websocketResponse[websocketLength]='\0';
        memmove(client->buffer, client->buffer + websocketLength, remaining);
        client->currentBufferLen = remaining;
        client->buffer[client->currentBufferLen] = '\0';
        struct websocket_frame *wf=decryptWebsocketMessage(websocketResponse);

        if(wf->payload_data[0]=='1'){
          char *name = malloc(50);
          int j = 0;
          for (int i = 0, isSpace = 0; wf->payload_data[i] != '\0'; i++) {
            if (wf->payload_data[i] == ' ')
              isSpace = 1;
            else if (isSpace)
              name[j++] = wf->payload_data[i];
          }
          name[j] = '\0';  
          hashmap_set(map, &(struct user){.name = name, .socketId =sd});
          uint8_t frame[256] = {0};
          size_t frameLength;
          create_websocket_frame("Uspesna prijava", frame, &frameLength);
          send(sd, frame, frameLength, 0);
        }
        else if(wf->payload_data[0]=='2')
          handleDirectMessage(sd,wf);
        else if(wf->payload_data[0]=='3')
          handleFriendUpdate(sd,wf);
        else if(wf->payload_data[0]=='4')
          handleGroupEdit(sd,wf,conn);
        else if(wf->payload_data[0]=='5')
          handleGroupCreationAndDeletion(sd,wf,conn);
        else if(wf->payload_data[0]=='6')
          handleSeen(sd,wf);
        else if(wf->payload_data[0]=='7')
          handleGroupMessage(sd,wf,conn);
      }
    }
  }
  // printf("Buffer:%s\n",client->buffer);
  // size_t iter = 0;
  // void *item;
  // while (hashmap_iter(map, &iter, &item)) {
  //   const struct user *user = item;
  //   printf("%s (socketId=%d)\n", user->name, user->socketId);
  // }
}


int main() {
  Client clients[MAX_CLIENTS];
  MYSQL *conn = connect_db();
  if (!conn) return EXIT_FAILURE;

  // fetch_users(conn);
  map = hashmap_new(sizeof(struct user), 0, 0, 0,
                    user_hash, user_compare, NULL, NULL);

  char *guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
  setbuf(stdout, NULL);
  setbuf(stderr, NULL);

  printf("Server is starting...\n");

  int server_fd = socket(AF_INET, SOCK_STREAM, 0);
  if (server_fd == -1) {
    printf("Socket creation failed: %s...\n", strerror(errno));
    return 1;
  }

  int reuse = 1;
  if (setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &reuse, sizeof(reuse)) < 0) {
    printf("SO_REUSEADDR failed: %s \n", strerror(errno));
    return 1;
  }

  struct sockaddr_in serv_addr = {
    .sin_family = AF_INET,
    .sin_port = htons(4221),
    .sin_addr = { htonl(INADDR_ANY) }
  };

  if (bind(server_fd, (struct sockaddr *) &serv_addr, sizeof(serv_addr)) != 0) {
    printf("Bind failed: %s \n", strerror(errno));
    close(server_fd);
    return 1;
  }

  if (listen(server_fd, 5) != 0) {
    printf("Listen failed: %s \n", strerror(errno));
    close(server_fd);
    return 1;
  }

  printf("Waiting for a client to connect...\n");

  fd_set read_fds;
  int client_sockets[MAX_CLIENTS] = {0};  
  int max_sd, new_socket, activity, sd;

  while (1) {
    FD_ZERO(&read_fds);
    FD_SET(server_fd, &read_fds);
    max_sd = server_fd;

    for (int i = 0; i < MAX_CLIENTS; i++) {
      sd = client_sockets[i];
      if (sd > 0)
        FD_SET(sd, &read_fds);
      if (sd > max_sd)
        max_sd = sd;
    }

    activity = select(max_sd + 1, &read_fds, NULL, NULL, NULL);

    if (FD_ISSET(server_fd, &read_fds)) {
      new_socket = accept(server_fd, NULL, NULL);
      printf("Client connected!\n");

      for (int i = 0; i < MAX_CLIENTS; i++) {
        if (client_sockets[i] == 0) {
          client_sockets[i] = new_socket;
          break;
        }
      }
    }

    for (int i = 0; i < MAX_CLIENTS; i++) {
      sd = client_sockets[i];

      if (FD_ISSET(sd, &read_fds)) {
        char response[10000];
        int bytes_received=0;
        bufferTheMessage(sd,clients,client_sockets,i,conn);
      }
    }
  }
  close_db(conn);
  close(server_fd);
  return 0;
}
