#include "db_utils.h"
#include <stdio.h>
#include <stdlib.h>
#include<string.h>

char *strdup(const char *s) {
    size_t len = strlen(s) + 1;
    char *copy = malloc(len);
    if (copy) {
        memcpy(copy, s, len);
    }
    return copy;
}

int delete_group(MYSQL *conn, int groupId) {
  char query[128];
  snprintf(query, sizeof(query), "DELETE FROM grupe WHERE groupId = %d", groupId);

  if (mysql_query(conn, query)) {
    fprintf(stderr, "Delete query failed: %s\n", mysql_error(conn));
    return 0;  // Indicate failure
  }

  if (mysql_affected_rows(conn) == 0) {
    printf("No group deleted (groupId may not exist).\n");
    return 0;  // No rows affected
  }

  printf("Group with ID %d deleted successfully.\n", groupId);
  return 1;  // Success
}

MYSQL *connect_db() {
  MYSQL *conn = mysql_init(NULL);
  if (conn == NULL) {
    fprintf(stderr, "MariaDB initialization failed\n");
    return NULL;
  }
  if (mysql_real_connect(conn, HOST, USER, PASS, DBNAME, PORT, NULL, 0) == NULL) {
    fprintf(stderr, "Connection failed: %s\n", mysql_error(conn));
    mysql_close(conn);
    return NULL;
  }
  printf("Connected to MariaDB database successfully!\n");
  return conn;
}

char **fetch_group_members(MYSQL *conn, int groupId, int *count) {
  char query[256];
  snprintf(query, sizeof(query), "SELECT username FROM group_members WHERE groupId = %d", groupId);

  if (mysql_query(conn, query)) {
    fprintf(stderr, "Query failed: %s\n", mysql_error(conn));
    return NULL;
  }


  MYSQL_RES *res = mysql_store_result(conn);
  if (res == NULL) {
    fprintf(stderr, "Failed to store result: %s\n", mysql_error(conn));
    return NULL;
  }

  int num_rows = mysql_num_rows(res);
  *count = num_rows;
  char **usernames = malloc(num_rows * sizeof(char*));
  if (!usernames) {
    fprintf(stderr, "Memory allocation failed\n");
    mysql_free_result(res);
    return NULL;
  }

  MYSQL_ROW row;
  int i = 0;
  while ((row = mysql_fetch_row(res))) {
    usernames[i] = strdup(row[0] ? row[0] : "");
    i++;
  }

  mysql_free_result(res);
  return usernames;
}

void fetch_users(MYSQL *conn) {
  if (mysql_query(conn, "SELECT * FROM users")) {
    fprintf(stderr, "Query failed: %s\n", mysql_error(conn));
    return;
  }
  MYSQL_RES *res = mysql_store_result(conn);
  if (res == NULL) {
    fprintf(stderr, "Failed to store result: %s\n", mysql_error(conn));
    return;
  }
  int num_fields = mysql_num_fields(res);
  MYSQL_ROW row;
  while ((row = mysql_fetch_row(res))) {
    for (int i = 0; i < num_fields; i++) {
      printf("%s ", row[i] ? row[i] : "NULL");
    }
    printf("\n");
  }
  mysql_free_result(res);
}

void close_db(MYSQL *conn) {
  mysql_close(conn);
  printf("Disconnected from MariaDB.\n");
}

// int main() {
//   MYSQL *conn = connect_db();
//   if (!conn) return EXIT_FAILURE;
//
//   int count;
//   char **groupMembers=fetch_group_members(conn,1,&count);
//   printf("Count:%d\n",count);
//   for (int j=0;j<count;j++) {
//     printf("Username:%s\n",groupMembers[j]);
//   }
//   close_db(conn);
//
//   return EXIT_SUCCESS;
// }
