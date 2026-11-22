#!/bin/sh
# PostgreSQL konteyneri ilk açıldığında rolleri kurar (docker-entrypoint-initdb.d).
set -e
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v migrator_password="$MV_MIGRATOR_PASSWORD" -v api_password="$MV_API_PASSWORD" \
  -f /mv/roles.sql
