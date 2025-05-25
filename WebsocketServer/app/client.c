#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>  // For inet_addr
#include <string.h>
#include <errno.h>
#include <unistd.h>

#define BUFFER_SIZE 4096

int main() {
  setbuf(stdout, NULL);
  setbuf(stderr, NULL);

  // Create socket
  int client_fd = socket(AF_INET, SOCK_STREAM, 0);
  if (client_fd == -1) {
    printf("Socket creation failed: %s...\n", strerror(errno));
    return 1;
  }

  // Server address
  struct sockaddr_in serv_addr;
  serv_addr.sin_family = AF_INET;
  serv_addr.sin_port = htons(4221);
  serv_addr.sin_addr.s_addr = inet_addr("127.0.0.1");  // Localhost

  // Connect
  if (connect(client_fd, (struct sockaddr*)&serv_addr, sizeof(serv_addr)) < 0) {
    printf("Connection to server failed: %s\n", strerror(errno));
    close(client_fd);
    return 1;
  }

  printf("Connected to server\n");

  const char *request = 
    "GET /echo/abc HTTP/1.1\r\n"
    "Host: localhost:4221\r\n"
    "User-Agent: client-c/1.0\r\n"
    "Accept: */*\r\n"
    "\r\n";

  if (send(client_fd, request, strlen(request), 0) == -1) {
    printf("Failed to send initial request: %s\n", strerror(errno));
    close(client_fd);
    return 1;
  }

  // Receive response
  // char buffer[BUFFER_SIZE];
  // int bytes_received = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
  // if (bytes_received > 0) {
  //   buffer[bytes_received] = '\0';
  //   printf("Initial server response:\n%s\n", buffer);
  // }

  // Interactive message sending
  char message[BUFFER_SIZE];
  printf("123123214\n");
  printf("123123214\n");
  printf("123123214\n");
  while (1) {
    printf("\nEnter message (or 'exit' to quit): ");
    if (fgets(message, sizeof(message), stdin) == NULL) break;
    printf("Message:%s\n",message);

    if (send(client_fd, message, strlen(message), 0) == -1) {
      printf("Failed to send message: %s\n", strerror(errno));
      break;
    }

    // int bytes = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
    // if (bytes > 0) {
    //   buffer[bytes] = '\0';
    //   printf("Server: %s\n", buffer);
    // } else {
    //   printf("Disconnected or error: %s\n", strerror(errno));
    //   break;
    // }
  }

  close(client_fd);
  printf("Disconnected.\n");
  return 0;
}
