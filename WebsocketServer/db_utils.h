
#ifndef DB_UTILS_H
#define DB_UTILS_H

#include <mysql/mysql.h>

MYSQL *connect_db();
void fetch_users(MYSQL *conn);
char** fetch_group_members(MYSQL *conn,int,int*);
void close_db(MYSQL *conn);

#endif // DB_UTILS_H
