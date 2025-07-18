#!/bin/bash

# Konfigurasi dari DATABASE_URL
HOST="ep-royal-unit-a1wr6l5c-pooler.ap-southeast-1.aws.neon.tech"
PORT="5432"
USER="neondb_owner"
PASSWORD="npg_qPZmwNRc12ph"
DATABASE="neondb"
OUTPUT_FILE="neondb_backup.sql"

# Ekspor database dengan pg_dump
echo "Mulai mengekspor database $DATABASE ke file $OUTPUT_FILE ..."

# Set password environment agar tidak diminta saat pg_dump
PGPASSWORD=$PASSWORD pg_dump \
  --host=$HOST \
  --port=$PORT \
  --username=$USER \
  --dbname=$DATABASE \
  --format=plain \
  --file=$OUTPUT_FILE \
  --no-owner \
  --no-privileges \
  --verbose \
  --quote-all-identifiers \
  --encoding=UTF8 \
  --clean \
  --if-exists \
  --create

echo "Export selesai. File backup ada di: $OUTPUT_FILE"
