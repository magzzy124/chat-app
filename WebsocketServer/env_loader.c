#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void trim(char *str) {
    char *end;
    while (*str == ' ' || *str == '\t') str++;
    end = str + strlen(str) - 1;
    while (end > str && (*end == ' ' || *end == '\t' || *end == '\r' || *end == '\n')) end--;
    *(end + 1) = '\0';
}

void load_env_file(const char *filepath) {
    FILE *file = fopen(filepath, "r");
    if (!file) {
        perror("Unable to open .env file");
        return;
    }

    char line[256];
    while (fgets(line, sizeof(line), file)) {
        if (line[0] == '#' || strchr(line, '=') == NULL) continue;

        char *eq = strchr(line, '=');
        *eq = '\0';

        char *key = line;
        char *value = eq + 1;

        trim(key);
        trim(value);

#ifdef _WIN32
    _putenv_s(key, value);
#else
    setenv(key, value, 1);
#endif
    }

    fclose(file);
}
