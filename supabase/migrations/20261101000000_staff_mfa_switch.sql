-- One switch for staff two-step verification (MFA).
-- Turned OFF for the launch period, until real staff emails are in place.
-- To turn it back on:
--   update public.app_settings set staff_mfa_required = true where id = true;
-- Every staff check (is_staff, is_admin, my_doctor_id, ...) goes through has_mfa(),
-- and the staff portal reads the same switch through staff_mfa_required().

create table public.app_settings (
  id                 boolean primary key default true check (id),
  staff_mfa_required boolean not null default true,
  updated_at         timestamptz not null default now()
);
alter table public.app_settings enable row level security;
-- No policies: only SECURITY DEFINER functions and the service role read it.

insert into public.app_settings (id, staff_mfa_required) values (true, false);

create or replace function public.staff_mfa_required()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select staff_mfa_required from public.app_settings where id), true);
$$;
-- anon too: public policies call is_staff() -> has_mfa() for visitors.
grant execute on function public.staff_mfa_required() to anon, authenticated;

create or replace function public.has_mfa()
returns boolean
language sql
stable
set search_path = ''
as $$
  select not public.staff_mfa_required()
         or coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;
