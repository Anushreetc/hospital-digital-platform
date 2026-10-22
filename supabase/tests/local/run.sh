#!/usr/bin/env bash
# Applies the migrations and seed to a throwaway database on a local
# PostgreSQL server and runs the RLS/booking tests. No Docker or Supabase CLI
# needed. Usage: supabase/tests/local/run.sh [psql connection options]
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
db="hospital_rls_test_$$"

psql_cmd=(psql -X -q -v ON_ERROR_STOP=1 "$@")

"${psql_cmd[@]}" -d postgres -c "create database $db" >/dev/null
trap '"${psql_cmd[@]}" -d postgres -c "drop database if exists $db" >/dev/null' EXIT

# Roles are cluster-wide; create them once if missing.
"${psql_cmd[@]}" -d "$db" -c "do \$\$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    execute (select string_agg(l, ';') from (select unnest(array[
      'create role anon nologin', 'create role authenticated nologin',
      'create role service_role nologin bypassrls']) l) s);
  end if; end \$\$" >/dev/null

sed '/^create role /d' "$here/auth_stub.sql" | "${psql_cmd[@]}" -d "$db" >/dev/null
for f in "$root"/migrations/*.sql; do
  "${psql_cmd[@]}" -d "$db" -f "$f" >/dev/null
done
"${psql_cmd[@]}" -d "$db" -f "$root/seed.sql" >/dev/null
"${psql_cmd[@]}" -d "$db" -o /dev/null -f "$here/rls_test.sql"
