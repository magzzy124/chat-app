// db_utils.h
#ifndef DB_UTILS_H
#define DB_UTILS_H

#include <mysql/mysql.h>

#define HOST "127.0.0.1"
#define USER "root"
#define PASS "root"
#define DBNAME "chatusers"
#define PORT 3306

MYSQL *connect_db();
void fetch_users(MYSQL *conn);
char** fetch_group_members(MYSQL *conn,int,int*);
void close_db(MYSQL *conn);

#endif // DB_UTILS_H
