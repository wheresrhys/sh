#!/bin/bash -ev

DB_FILE=./db.sqlite3
rm -f $DB_FILE
find ../migrations -type f | xargs -I{} -n1 sqlite3 $DB_FILE ".read {}"
sqlite3 $DB_FILE ".read ./initial_data.sql"
