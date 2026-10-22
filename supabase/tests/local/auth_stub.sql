-- Minimal stand-in for the parts of Supabase's auth schema the migrations use,
-- so the schema and its RLS policies can be tested on plain PostgreSQL.
-- NEVER run this against a real Supabase project.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

create table auth.users (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  phone               text,
  phone_confirmed_at  timestamptz,
  raw_user_meta_data  jsonb not null default '{}'::jsonb
);

create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

create function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid;
$$;

grant execute on function auth.jwt(), auth.uid() to anon, authenticated, service_role;
