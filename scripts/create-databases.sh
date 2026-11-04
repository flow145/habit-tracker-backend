#!/usr/bin/env bash

set -eu

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE DATABASE habit_tracker;
  CREATE DATABASE habit_tracker_test;
EOSQL
