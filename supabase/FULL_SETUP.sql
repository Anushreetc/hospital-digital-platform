-- =============================================================================
-- WE CARE HOSPITAL DIGITAL PLATFORM: COMPLETE ALL-IN-ONE SETUP SCRIPT
-- Paste and run this entire script in Supabase Dashboard -> SQL Editor
-- =============================================================================

-- Clean up any conflicting pre-existing schema if needed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.doctor_schedules CASCADE;
DROP TABLE IF EXISTS public.doctors CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.hospital_info CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.voice_calls CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;
DROP TYPE IF EXISTS public.appointment_status CASCADE;
DROP TYPE IF EXISTS public.appointment_source CASCADE;
DROP TYPE IF EXISTS public.voice_case_status CASCADE;

-- =============================================================================
-- We Care Hospital Digital Platform: initial schema
--
-- Security model
--   * Every table has Row Level Security enabled. The browser only ever holds
--     the publishable (anon) key, so these policies ARE the access control.
--   * A user's role lives in public.profiles.role and can only be changed by an
--     administrator through public.set_user_role(). Users cannot edit it.
--   * Staff and doctors must sign in with MFA (JWT aal = 'aal2') before any
--     staff policy or function grants them access.
--   * Appointments are never written directly from the client. All writes go
--     through SECURITY DEFINER functions that validate input, enforce slot
--     capacity and record an audit log entry.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN');
create type public.appointment_status as enum ('NEW', 'CONTACTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
create type public.appointment_source as enum ('WEBSITE', 'PATIENT_PORTAL', 'FRONT_DESK', 'PHONE', 'VOICE_AI');
create type public.voice_case_status as enum ('NEW', 'UNDER_REVIEW', 'ACTION_TAKEN', 'CLOSED');

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        public.app_role not null default 'PATIENT',
  full_name   text check (char_length(full_name) <= 120),
  email       text,
  phone       text,
  dob         date,
  gender      text check (gender in ('MALE', 'FEMALE', 'OTHER')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Single-row table holding the editable public site content (contact details,
-- tariffs, visiting hours, insurance info...). Shape matches HospitalInfo in
-- frontend/src/types.ts.
create table public.hospital_info (
  id          smallint primary key default 1 check (id = 1),
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table public.departments (
  id             text primary key,
  name           text not null,
  code           text not null unique,
  description    text not null default '',
  icon_name      text not null default 'Stethoscope',
  display_order  int not null default 0,
  active         boolean not null default true
);

create table public.doctors (
  id                   text primary key default ('doc-' || substr(md5(gen_random_uuid()::text), 1, 8)),
  user_id              uuid unique references public.profiles (id) on delete set null,
  name                 text not null,
  photo_url            text not null default '',
  qualification        text not null default '',
  designation          text not null default '',
  specialization       text not null default '',
  department_id        text not null references public.departments (id),
  experience_years     int not null default 0 check (experience_years >= 0),
  registration_number  text,
  bio                  text not null default '',
  languages            text[] not null default '{}',
  consultation_fee     int check (consultation_fee >= 0),
  display_order        int not null default 0,
  active               boolean not null default true
);
create index doctors_department_idx on public.doctors (department_id);

-- Weekly OPD sessions. A session is split into slots of slot_minutes, each of
-- which accepts up to capacity_per_slot bookings.
create table public.doctor_schedules (
  id                 uuid primary key default gen_random_uuid(),
  doctor_id          text not null references public.doctors (id) on delete cascade,
  day_of_week        smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time         time not null,
  end_time           time not null,
  slot_minutes       smallint not null default 30 check (slot_minutes between 5 and 240),
  capacity_per_slot  smallint not null default 4 check (capacity_per_slot between 1 and 100),
  check (end_time > start_time)
);
create index doctor_schedules_doctor_idx on public.doctor_schedules (doctor_id, day_of_week);

create table public.doctor_leaves (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   text not null references public.doctors (id) on delete cascade,
  leave_date  date not null,
  reason      text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (doctor_id, leave_date)
);

create table public.services (
  id                 text primary key,
  name               text not null,
  short_description  text not null default '',
  full_description   text not null default '',
  icon_name          text not null default 'Activity',
  display_order      int not null default 0,
  active             boolean not null default true
);

create table public.facilities (
  id             text primary key,
  name           text not null,
  description    text not null default '',
  image_url      text not null default '',
  display_order  int not null default 0,
  active         boolean not null default true
);

create table public.appointments (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  patient_id          uuid references public.profiles (id) on delete set null,
  patient_name        text not null,
  patient_phone       text not null,
  patient_email       text,
  doctor_id           text not null references public.doctors (id),
  department_id       text not null references public.departments (id),
  appointment_date    date not null,
  slot_time           time not null,
  token_number        int not null,
  reason              text not null,
  additional_message  text,
  source              public.appointment_source not null,
  language            text check (language in ('EN', 'KN')),
  status              public.appointment_status not null default 'NEW',
  notes               jsonb not null default '[]'::jsonb,
  idempotency_key     text unique,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index appointments_doctor_date_idx on public.appointments (doctor_id, appointment_date, slot_time);
create index appointments_patient_idx on public.appointments (patient_id);
create index appointments_phone_idx on public.appointments (patient_phone);
-- One active booking per phone number, per doctor, per day.
create unique index appointments_no_duplicate_idx
  on public.appointments (doctor_id, appointment_date, patient_phone)
  where status not in ('CANCELLED', 'NO_SHOW');

-- Calls handled by the AI voice receptionist. Written by the backend with the
-- service role key; worked by the front desk in the staff app.
create table public.voice_calls (
  id                     uuid primary key default gen_random_uuid(),
  call_id                text not null unique,
  caller_name            text,
  phone_number           text not null,
  started_at             timestamptz not null default now(),
  ended_at               timestamptz,
  duration_seconds       int,
  language               text,
  status                 text not null default 'COMPLETED',
  intent                 text,
  outcome                text,
  summary                text,
  transcript             text,
  dialogue_turns         jsonb not null default '[]'::jsonb,
  appointment_id         uuid references public.appointments (id) on delete set null,
  case_status            public.voice_case_status not null default 'NEW',
  assigned_receptionist  text,
  receptionist_notes     text,
  closed_at              timestamptz,
  closed_by              text,
  created_at             timestamptz not null default now()
);
create index voice_calls_case_status_idx on public.voice_calls (case_status, created_at desc);

create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  actor_role  public.app_role,
  action      text not null,
  entity      text not null,
  entity_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- -----------------------------------------------------------------------------
-- Role helpers (used by policies and functions)
-- -----------------------------------------------------------------------------
create function public.has_mfa()
returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

create function public.my_role()
returns public.app_role
language sql stable security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.active;
$$;

create function public.is_staff()
returns boolean
language sql stable
set search_path = ''
as $$
  select public.has_mfa()
     and coalesce(public.my_role() in ('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'), false);
$$;

create function public.is_admin()
returns boolean
language sql stable
set search_path = ''
as $$
  select public.has_mfa()
     and coalesce(public.my_role() in ('HOSPITAL_ADMIN', 'SUPER_ADMIN'), false);
$$;

create function public.is_super_admin()
returns boolean
language sql stable
set search_path = ''
as $$
  select public.has_mfa() and coalesce(public.my_role() = 'SUPER_ADMIN', false);
$$;

-- The doctors.id linked to the signed-in doctor (MFA required), else null.
create function public.my_doctor_id()
returns text
language sql stable security definer
set search_path = ''
as $$
  select d.id
  from public.doctors d
  join public.profiles p on p.id = d.user_id
  where d.user_id = auth.uid() and p.role = 'DOCTOR' and p.active and public.has_mfa();
$$;

create function public.write_audit(p_action text, p_entity text, p_entity_id text, p_details jsonb)
returns void
language sql security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, actor_role, action, entity, entity_id, details)
  values (auth.uid(), public.my_role(), p_action, p_entity, p_entity_id, p_details);
$$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger appointments_touch before update on public.appointments
  for each row execute function public.touch_updated_at();
create trigger hospital_info_touch before update on public.hospital_info
  for each row execute function public.touch_updated_at();

-- Every new auth user gets a PATIENT profile. Staff roles are granted later by
-- an administrator; nothing the user sends at sign-up can set a role.
create function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    nullif(new.phone, ''),
    left(nullif(new.raw_user_meta_data ->> 'full_name', ''), 120)
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Audit every change to admin-managed content.
create function public.audit_content_change()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
begin
  perform public.write_audit(
    tg_op,
    tg_table_name,
    v_row ->> 'id',
    case when tg_op = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)) else v_row end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_hospital_info after insert or update or delete on public.hospital_info
  for each row execute function public.audit_content_change();
create trigger audit_departments after insert or update or delete on public.departments
  for each row execute function public.audit_content_change();
create trigger audit_doctors after insert or update or delete on public.doctors
  for each row execute function public.audit_content_change();
create trigger audit_doctor_schedules after insert or update or delete on public.doctor_schedules
  for each row execute function public.audit_content_change();
create trigger audit_doctor_leaves after insert or update or delete on public.doctor_leaves
  for each row execute function public.audit_content_change();
create trigger audit_services after insert or update or delete on public.services
  for each row execute function public.audit_content_change();
create trigger audit_facilities after insert or update or delete on public.facilities
  for each row execute function public.audit_content_change();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.hospital_info     enable row level security;
alter table public.departments       enable row level security;
alter table public.doctors           enable row level security;
alter table public.doctor_schedules  enable row level security;
alter table public.doctor_leaves     enable row level security;
alter table public.services          enable row level security;
alter table public.facilities        enable row level security;
alter table public.appointments      enable row level security;
alter table public.voice_calls       enable row level security;
alter table public.audit_logs        enable row level security;

-- Start from nothing and grant only what each role needs. RLS then narrows
-- the rows.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Profiles: users see and edit their own basic details; staff can look people
-- up. Role and active flag are not client-writable (see set_user_role).
grant select on public.profiles to authenticated;
grant update (full_name, dob, gender) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Public site content: readable by everyone, editable by admins.
grant select on public.hospital_info, public.departments, public.doctors,
  public.doctor_schedules, public.services, public.facilities to anon, authenticated;
grant insert, update, delete on public.hospital_info, public.departments, public.doctors,
  public.doctor_schedules, public.services, public.facilities to authenticated;

create policy hospital_info_read on public.hospital_info for select to anon, authenticated using (true);
create policy hospital_info_admin on public.hospital_info for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy departments_read on public.departments for select to anon, authenticated
  using (active or public.is_staff());
create policy departments_admin on public.departments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy doctors_read on public.doctors for select to anon, authenticated
  using (active or public.is_staff() or user_id = auth.uid());
create policy doctors_admin on public.doctors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy doctor_schedules_read on public.doctor_schedules for select to anon, authenticated using (true);
create policy doctor_schedules_admin on public.doctor_schedules for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy services_read on public.services for select to anon, authenticated
  using (active or public.is_staff());
create policy services_admin on public.services for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy facilities_read on public.facilities for select to anon, authenticated
  using (active or public.is_staff());
create policy facilities_admin on public.facilities for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Doctor leave: doctors manage their own days off, staff see all, admins manage all.
grant select, insert, delete on public.doctor_leaves to authenticated;
create policy doctor_leaves_read on public.doctor_leaves for select to authenticated
  using (public.is_staff() or doctor_id = public.my_doctor_id());
create policy doctor_leaves_insert on public.doctor_leaves for insert to authenticated
  with check (public.is_admin() or doctor_id = public.my_doctor_id());
create policy doctor_leaves_delete on public.doctor_leaves for delete to authenticated
  using (public.is_admin() or doctor_id = public.my_doctor_id());

-- Appointments: read-only from the client. Patients see their own, doctors see
-- their own list, staff see everything. Writes go through the functions below.
grant select on public.appointments to authenticated;
create policy appointments_read on public.appointments for select to authenticated
  using (
    patient_id = auth.uid()
    or doctor_id = public.my_doctor_id()
    or public.is_staff()
  );

-- Voice calls: front desk only.
grant select on public.voice_calls to authenticated;
grant update (case_status, assigned_receptionist, receptionist_notes, closed_at, closed_by)
  on public.voice_calls to authenticated;
create policy voice_calls_read on public.voice_calls for select to authenticated using (public.is_staff());
create policy voice_calls_update on public.voice_calls for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Audit log: super admins only, read-only.
grant select on public.audit_logs to authenticated;
create policy audit_logs_read on public.audit_logs for select to authenticated using (public.is_super_admin());

-- -----------------------------------------------------------------------------
-- Booking
-- -----------------------------------------------------------------------------
create function public.hospital_today()
returns date
language sql stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Kolkata')::date;
$$;

-- Slots for one doctor on one date, with remaining capacity. Safe for anyone
-- to call: it exposes counts only, never patient details.
create function public.get_available_slots(p_doctor_id text, p_date date)
returns table (slot_time time, capacity int, booked int, available int)
language sql stable security definer
set search_path = ''
as $$
  with sessions as (
    select s.start_time, s.end_time, s.slot_minutes, s.capacity_per_slot
    from public.doctor_schedules s
    join public.doctors d on d.id = s.doctor_id and d.active
    where s.doctor_id = p_doctor_id
      and s.day_of_week = extract(dow from p_date)::smallint
      and p_date between public.hospital_today() and public.hospital_today() + 60
      and not exists (
        select 1 from public.doctor_leaves l where l.doctor_id = p_doctor_id and l.leave_date = p_date
      )
  ),
  slots as (
    select (gs)::time as slot_time, se.capacity_per_slot as capacity
    from sessions se,
      generate_series(
        p_date + se.start_time,
        p_date + se.end_time - make_interval(mins => se.slot_minutes),
        make_interval(mins => se.slot_minutes)
      ) gs
  )
  select sl.slot_time,
         sl.capacity::int,
         count(a.id)::int as booked,
         greatest(sl.capacity - count(a.id), 0)::int as available
  from slots sl
  left join public.appointments a
    on a.doctor_id = p_doctor_id
   and a.appointment_date = p_date
   and a.slot_time = sl.slot_time
   and a.status not in ('CANCELLED', 'NO_SHOW')
  where p_date > public.hospital_today()
     or sl.slot_time > (now() at time zone 'Asia/Kolkata')::time
  group by sl.slot_time, sl.capacity
  order by sl.slot_time;
$$;

-- Books an appointment. Callable by guests (website form), signed-in patients
-- and staff (front desk). Validates everything server-side.
create function public.book_appointment(
  p_doctor_id           text,
  p_date                date,
  p_slot_time           time,
  p_patient_name        text,
  p_patient_phone       text,
  p_reason              text,
  p_additional_message  text default null,
  p_patient_email       text default null,
  p_source              public.appointment_source default null,
  p_language            text default null,
  p_idempotency_key     text default null
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_staff     boolean := public.is_staff();
  v_role      public.app_role := public.my_role();
  v_phone     text := right(regexp_replace(coalesce(p_patient_phone, ''), '\D', '', 'g'), 10);
  v_name      text := btrim(coalesce(p_patient_name, ''));
  v_reason    text := btrim(coalesce(p_reason, ''));
  v_source    public.appointment_source;
  v_status    public.appointment_status;
  v_patient   uuid;
  v_doctor    public.doctors%rowtype;
  v_slot      record;
  v_token     int;
  v_code      text;
  v_appt      public.appointments%rowtype;
begin
  -- Idempotent retry: return the booking already made with this key.
  if p_idempotency_key is not null then
    select * into v_appt from public.appointments where idempotency_key = p_idempotency_key;
    if found then
      return public.appointment_summary(v_appt.id);
    end if;
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'Please enter the patient''s full name.' using errcode = '22023';
  end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'Please enter a valid 10-digit Indian mobile number.' using errcode = '22023';
  end if;
  if char_length(v_reason) < 2 or char_length(v_reason) > 500 then
    raise exception 'Please describe the reason for the visit (up to 500 characters).' using errcode = '22023';
  end if;
  if char_length(coalesce(p_additional_message, '')) > 1000 then
    raise exception 'Additional message is too long.' using errcode = '22023';
  end if;

  select * into v_doctor from public.doctors where id = p_doctor_id and active;
  if not found then
    raise exception 'Selected doctor is not available for booking.' using errcode = '22023';
  end if;

  -- Who is booking decides the channel and the initial status. Guest bookings
  -- are unverified, so the front desk confirms them by phone.
  if v_staff then
    v_source  := coalesce(p_source, 'FRONT_DESK');
    v_status  := 'CONFIRMED';
    v_patient := null;
  elsif v_uid is not null and v_role = 'PATIENT' then
    v_source  := 'PATIENT_PORTAL';
    v_status  := 'CONFIRMED';
    v_patient := v_uid;
  else
    v_source  := 'WEBSITE';
    v_status  := 'NEW';
    v_patient := null;
  end if;

  -- Serialise bookings for this doctor/day so capacity checks cannot race.
  perform pg_advisory_xact_lock(hashtext(p_doctor_id || '|' || p_date::text));

  select * into v_slot from public.get_available_slots(p_doctor_id, p_date) s where s.slot_time = p_slot_time;
  if not found then
    raise exception 'That time is not an available OPD slot for this doctor.' using errcode = '22023';
  end if;
  if v_slot.available <= 0 then
    raise exception 'That slot is fully booked. Please choose another time.' using errcode = '23P01';
  end if;

  if exists (
    select 1 from public.appointments
    where doctor_id = p_doctor_id and appointment_date = p_date and patient_phone = v_phone
      and status not in ('CANCELLED', 'NO_SHOW')
  ) then
    raise exception 'This mobile number already has a booking with this doctor on that day.' using errcode = '23505';
  end if;

  -- Limit unverified spam: at most 3 upcoming active bookings per phone number.
  if not v_staff and (
    select count(*) from public.appointments
    where patient_phone = v_phone and appointment_date >= public.hospital_today()
      and status not in ('CANCELLED', 'NO_SHOW', 'COMPLETED')
  ) >= 3 then
    raise exception 'This mobile number already has 3 upcoming bookings. Please call the hospital to book more.' using errcode = '22023';
  end if;

  select coalesce(max(token_number), 0) + 1 into v_token
  from public.appointments where doctor_id = p_doctor_id and appointment_date = p_date;

  loop
    v_code := 'APT-' || to_char(p_date, 'YYYYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 5));
    exit when not exists (select 1 from public.appointments where code = v_code);
  end loop;

  insert into public.appointments (
    code, patient_id, patient_name, patient_phone, patient_email, doctor_id, department_id,
    appointment_date, slot_time, token_number, reason, additional_message, source, language,
    status, idempotency_key, created_by
  ) values (
    v_code, v_patient, v_name, v_phone, nullif(btrim(coalesce(p_patient_email, '')), ''), p_doctor_id,
    v_doctor.department_id, p_date, p_slot_time, v_token, v_reason,
    nullif(btrim(coalesce(p_additional_message, '')), ''), v_source,
    case when p_language in ('EN', 'KN') then p_language end,
    v_status, p_idempotency_key, v_uid
  ) returning * into v_appt;

  perform public.write_audit('APPOINTMENT_CREATED', 'appointments', v_appt.id::text,
    jsonb_build_object('code', v_appt.code, 'source', v_appt.source, 'status', v_appt.status));

  return public.appointment_summary(v_appt.id);
end;
$$;

-- What a booker is allowed to see about the booking they just made.
create function public.appointment_summary(p_id uuid)
returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', a.id,
    'code', a.code,
    'token_number', a.token_number,
    'status', a.status,
    'patient_name', a.patient_name,
    'patient_phone', a.patient_phone,
    'doctor_id', a.doctor_id,
    'doctor_name', d.name,
    'department_id', a.department_id,
    'department_name', dep.name,
    'appointment_date', a.appointment_date,
    'slot_time', a.slot_time,
    'reason', a.reason,
    'source', a.source,
    'created_at', a.created_at
  )
  from public.appointments a
  join public.doctors d on d.id = a.doctor_id
  join public.departments dep on dep.id = a.department_id
  where a.id = p_id;
$$;

-- Status changes, with who-may-do-what rules:
--   staff   : any valid transition
--   doctor  : own appointments, CONFIRMED -> COMPLETED / NO_SHOW
--   patient : own appointments, NEW/CONFIRMED -> CANCELLED, before the visit date
create function public.update_appointment_status(
  p_id      uuid,
  p_status  public.appointment_status,
  p_note    text default null
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_appt    public.appointments%rowtype;
  v_allowed boolean;
begin
  select * into v_appt from public.appointments where id = p_id for update;
  if not found then
    raise exception 'Appointment not found.' using errcode = 'P0002';
  end if;

  v_allowed := case v_appt.status
    when 'NEW'       then p_status in ('CONTACTED', 'CONFIRMED', 'CANCELLED')
    when 'CONTACTED' then p_status in ('CONFIRMED', 'CANCELLED')
    when 'CONFIRMED' then p_status in ('COMPLETED', 'NO_SHOW', 'CANCELLED')
    else false
  end;
  if not v_allowed then
    raise exception 'Cannot change an appointment from % to %.', v_appt.status, p_status using errcode = '22023';
  end if;

  if public.is_staff() then
    null;
  elsif v_appt.doctor_id = public.my_doctor_id() then
    if p_status not in ('COMPLETED', 'NO_SHOW') then
      raise exception 'Doctors can only mark appointments as completed or no-show.' using errcode = '42501';
    end if;
  elsif v_appt.patient_id = auth.uid() and auth.uid() is not null then
    if p_status <> 'CANCELLED' or v_appt.appointment_date < public.hospital_today() then
      raise exception 'You can only cancel upcoming appointments.' using errcode = '42501';
    end if;
  else
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  update public.appointments
  set status = p_status,
      notes = case when nullif(btrim(coalesce(p_note, '')), '') is null then notes
                   else notes || jsonb_build_array(jsonb_build_object(
                     'text', left(btrim(p_note), 1000), 'by', auth.uid(), 'role', public.my_role(), 'at', now()))
              end
  where id = p_id;

  perform public.write_audit('APPOINTMENT_STATUS_CHANGED', 'appointments', p_id::text,
    jsonb_build_object('code', v_appt.code, 'from', v_appt.status, 'to', p_status));

  return public.appointment_summary(p_id);
end;
$$;

create function public.add_appointment_note(p_id uuid, p_text text)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_doctor text;
begin
  if nullif(btrim(coalesce(p_text, '')), '') is null then
    raise exception 'Note is empty.' using errcode = '22023';
  end if;
  select doctor_id into v_doctor from public.appointments where id = p_id;
  if not found then
    raise exception 'Appointment not found.' using errcode = 'P0002';
  end if;
  if not (public.is_staff() or v_doctor = public.my_doctor_id()) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;
  update public.appointments
  set notes = notes || jsonb_build_array(jsonb_build_object(
    'text', left(btrim(p_text), 1000), 'by', auth.uid(), 'role', public.my_role(), 'at', now()))
  where id = p_id;
end;
$$;

-- Links bookings made as a guest to the patient's account once they sign in
-- with the same (verified) mobile number. Returns how many were linked.
create function public.claim_guest_bookings()
returns int
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_phone text;
  v_count int;
begin
  if auth.uid() is null or public.my_role() is distinct from 'PATIENT' then
    return 0;
  end if;
  select right(regexp_replace(u.phone, '\D', '', 'g'), 10) into v_phone
  from auth.users u
  where u.id = auth.uid() and u.phone_confirmed_at is not null and coalesce(u.phone, '') <> '';
  if v_phone is null then
    return 0;
  end if;
  update public.appointments
  set patient_id = auth.uid()
  where patient_id is null and patient_phone = v_phone;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- -----------------------------------------------------------------------------
-- Administration
-- -----------------------------------------------------------------------------
-- Role changes. Super admins can assign any role; hospital admins can manage
-- doctors, receptionists and patients but cannot create or demote admins.
create function public.set_user_role(p_user_id uuid, p_role public.app_role, p_active boolean default true)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_current public.app_role;
begin
  select role into v_current from public.profiles where id = p_user_id;
  if not found then
    raise exception 'User not found.' using errcode = 'P0002';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own role.' using errcode = '42501';
  end if;
  if public.is_super_admin() then
    null;
  elsif public.is_admin()
    and v_current in ('PATIENT', 'DOCTOR', 'RECEPTIONIST')
    and p_role in ('PATIENT', 'DOCTOR', 'RECEPTIONIST') then
    null;
  else
    raise exception 'Not allowed.' using errcode = '42501';
  end if;

  update public.profiles set role = p_role, active = p_active where id = p_user_id;
  perform public.write_audit('ROLE_CHANGED', 'profiles', p_user_id::text,
    jsonb_build_object('from', v_current, 'to', p_role, 'active', p_active));
end;
$$;

create function public.list_staff()
returns table (id uuid, full_name text, email text, phone text, role public.app_role, active boolean, created_at timestamptz)
language sql stable security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.email, p.phone, p.role, p.active, p.created_at
  from public.profiles p
  where public.is_admin() and p.role <> 'PATIENT'
  order by p.role, p.full_name;
$$;

create function public.get_dashboard_stats()
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  v_today date := public.hospital_today();
begin
  if not public.is_staff() then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'todayAppointments',     (select count(*) from public.appointments where appointment_date = v_today and status <> 'CANCELLED'),
    'yesterdayAppointments', (select count(*) from public.appointments where appointment_date = v_today - 1 and status <> 'CANCELLED'),
    'upcomingAppointments',  (select count(*) from public.appointments where appointment_date >= v_today and status in ('NEW', 'CONTACTED', 'CONFIRMED')),
    'pendingConfirmation',   (select count(*) from public.appointments where appointment_date >= v_today and status in ('NEW', 'CONTACTED')),
    'activeDoctors',         (select count(*) from public.doctors where active),
    'activeDepartments',     (select count(*) from public.departments where active),
    'registeredPatients',    (select count(*) from public.profiles where role = 'PATIENT'),
    'voiceCalls',            (select count(*) from public.voice_calls),
    'voiceBookings',         (select count(*) from public.appointments where source = 'VOICE_AI'),
    'openVoiceCases',        (select count(*) from public.voice_calls where case_status <> 'CLOSED'),
    'voiceMinutes',          (select coalesce(round(sum(duration_seconds) / 60.0), 0) from public.voice_calls),
    'avgCallSeconds',        (select coalesce(round(avg(duration_seconds)), 0) from public.voice_calls)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Function privileges: nothing is callable unless granted here.
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.hospital_today() to anon, authenticated;
grant execute on function public.get_available_slots(text, date) to anon, authenticated;
grant execute on function public.book_appointment(text, date, time, text, text, text, text, text, public.appointment_source, text, text) to anon, authenticated;
grant execute on function public.update_appointment_status(uuid, public.appointment_status, text) to authenticated;
grant execute on function public.add_appointment_note(uuid, text) to authenticated;
grant execute on function public.claim_guest_bookings() to authenticated;
grant execute on function public.set_user_role(uuid, public.app_role, boolean) to authenticated;
grant execute on function public.list_staff() to authenticated;
grant execute on function public.get_dashboard_stats() to authenticated;

-- Helpers referenced inside RLS policies run as the calling role.
grant execute on function public.has_mfa(), public.my_role(), public.my_doctor_id(),
  public.is_staff(), public.is_admin(), public.is_super_admin()
  to anon, authenticated;

alter default privileges in schema public revoke execute on functions from public, anon, authenticated;


-- Fail closed on NULL role/doctor comparisons. SQL NOT NULL is NULL, not TRUE.
create or replace function public.add_appointment_note(p_id uuid, p_text text)
returns void
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_doctor text;
begin
  if nullif(btrim(coalesce(p_text, '')), '') is null then
    raise exception 'Note is empty.' using errcode = '22023';
  end if;
  select doctor_id into v_doctor from public.appointments where id = p_id;
  if not found then
    raise exception 'Appointment not found.' using errcode = 'P0002';
  end if;
  if not coalesce(public.is_staff() or v_doctor = public.my_doctor_id(), false) then
    raise exception 'Not allowed.' using errcode = '42501';
  end if;
  update public.appointments
  set notes = notes || jsonb_build_array(jsonb_build_object(
    'text', left(btrim(p_text), 1000), 'by', auth.uid(), 'role', public.my_role(), 'at', now()))
  where id = p_id;
end;
$$;

drop policy appointments_read on public.appointments;
create policy appointments_read on public.appointments for select to authenticated
using ((patient_id = auth.uid() and public.my_role() = 'PATIENT') or doctor_id = public.my_doctor_id() or public.is_staff());


-- Keep voice requests in the same reception queue with the language recorded.
create or replace function public.book_appointment(
  p_doctor_id           text,
  p_date                date,
  p_slot_time           time,
  p_patient_name        text,
  p_patient_phone       text,
  p_reason              text,
  p_additional_message  text default null,
  p_patient_email       text default null,
  p_source              public.appointment_source default null,
  p_language            text default null,
  p_idempotency_key     text default null
)
returns jsonb
language plpgsql volatile security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_staff     boolean := public.is_staff();
  v_role      public.app_role := public.my_role();
  v_phone     text := right(regexp_replace(coalesce(p_patient_phone, ''), '\D', '', 'g'), 10);
  v_name      text := btrim(coalesce(p_patient_name, ''));
  v_reason    text := btrim(coalesce(p_reason, ''));
  v_source    public.appointment_source;
  v_status    public.appointment_status;
  v_patient   uuid;
  v_doctor    public.doctors%rowtype;
  v_slot      record;
  v_token     int;
  v_code      text;
  v_appt      public.appointments%rowtype;
begin
  -- Idempotent retry: return the booking already made with this key.
  if p_idempotency_key is not null then
    select * into v_appt from public.appointments where idempotency_key = p_idempotency_key;
    if found then
      return public.appointment_summary(v_appt.id);
    end if;
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'Please enter the patient''s full name.' using errcode = '22023';
  end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then
    raise exception 'Please enter a valid 10-digit Indian mobile number.' using errcode = '22023';
  end if;
  if char_length(v_reason) < 2 or char_length(v_reason) > 500 then
    raise exception 'Please describe the reason for the visit (up to 500 characters).' using errcode = '22023';
  end if;
  if char_length(coalesce(p_additional_message, '')) > 1000 then
    raise exception 'Additional message is too long.' using errcode = '22023';
  end if;

  select * into v_doctor from public.doctors where id = p_doctor_id and active;
  if not found then
    raise exception 'Selected doctor is not available for booking.' using errcode = '22023';
  end if;

  -- Who is booking decides the channel and the initial status. Guest bookings
  -- are unverified, so the front desk confirms them by phone.
  if v_staff then
    v_source  := coalesce(p_source, 'FRONT_DESK');
    v_status  := 'CONFIRMED';
    v_patient := null;
  elsif v_uid is not null and v_role = 'PATIENT' then
    v_source  := case when p_source = 'VOICE_AI' then 'VOICE_AI'::public.appointment_source else 'PATIENT_PORTAL'::public.appointment_source end;
    v_status  := case when p_source = 'VOICE_AI' then 'NEW'::public.appointment_status else 'CONFIRMED'::public.appointment_status end;
    v_patient := v_uid;
  else
    v_source  := case when p_source = 'VOICE_AI' then 'VOICE_AI'::public.appointment_source else 'WEBSITE'::public.appointment_source end;
    v_status  := 'NEW';
    v_patient := null;
  end if;

  -- Serialise bookings for this doctor/day so capacity checks cannot race.
  perform pg_advisory_xact_lock(hashtext(p_doctor_id || '|' || p_date::text));

  select * into v_slot from public.get_available_slots(p_doctor_id, p_date) s where s.slot_time = p_slot_time;
  if not found then
    raise exception 'That time is not an available OPD slot for this doctor.' using errcode = '22023';
  end if;
  if v_slot.available <= 0 then
    raise exception 'That slot is fully booked. Please choose another time.' using errcode = '23P01';
  end if;

  if exists (
    select 1 from public.appointments
    where doctor_id = p_doctor_id and appointment_date = p_date and patient_phone = v_phone
      and status not in ('CANCELLED', 'NO_SHOW')
  ) then
    raise exception 'This mobile number already has a booking with this doctor on that day.' using errcode = '23505';
  end if;

  -- Limit unverified spam: at most 3 upcoming active bookings per phone number.
  if not v_staff and (
    select count(*) from public.appointments
    where patient_phone = v_phone and appointment_date >= public.hospital_today()
      and status not in ('CANCELLED', 'NO_SHOW', 'COMPLETED')
  ) >= 3 then
    raise exception 'This mobile number already has 3 upcoming bookings. Please call the hospital to book more.' using errcode = '22023';
  end if;

  select coalesce(max(token_number), 0) + 1 into v_token
  from public.appointments where doctor_id = p_doctor_id and appointment_date = p_date;

  loop
    v_code := 'APT-' || to_char(p_date, 'YYYYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 5));
    exit when not exists (select 1 from public.appointments where code = v_code);
  end loop;

  insert into public.appointments (
    code, patient_id, patient_name, patient_phone, patient_email, doctor_id, department_id,
    appointment_date, slot_time, token_number, reason, additional_message, source, language,
    status, idempotency_key, created_by
  ) values (
    v_code, v_patient, v_name, v_phone, nullif(btrim(coalesce(p_patient_email, '')), ''), p_doctor_id,
    v_doctor.department_id, p_date, p_slot_time, v_token, v_reason,
    nullif(btrim(coalesce(p_additional_message, '')), ''), v_source,
    case when p_language in ('EN', 'KN') then p_language end,
    v_status, p_idempotency_key, v_uid
  ) returning * into v_appt;

  perform public.write_audit('APPOINTMENT_CREATED', 'appointments', v_appt.id::text,
    jsonb_build_object('code', v_appt.code, 'source', v_appt.source, 'status', v_appt.status));

  return public.appointment_summary(v_appt.id);
end;
$$;


-- Only the Edge Function service role can consume the assistant quota.
create table if not exists public.assistant_rate_limits (
 bucket text primary key,
 window_start timestamptz not null default now(),
 requests integer not null default 1
);
alter table public.assistant_rate_limits enable row level security;
revoke all on public.assistant_rate_limits from anon, authenticated;
create or replace function public.consume_assistant_request(p_bucket text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
 if p_bucket !~ '^[a-f0-9]{64}$' then return false; end if;
 insert into public.assistant_rate_limits as limits(bucket) values(p_bucket)
 on conflict(bucket) do update set
 requests=case when limits.window_start < now()-interval '10 minutes' then 1 else limits.requests+1 end,
 window_start=case when limits.window_start < now()-interval '10 minutes' then now() else limits.window_start end
 returning requests into v_count;
 delete from public.assistant_rate_limits where window_start < now()-interval '1 day';
 return v_count <= 40;
end;
$$;
revoke all on function public.consume_assistant_request(text) from public, anon, authenticated;
grant execute on function public.consume_assistant_request(text) to service_role;

-- Reception subscribes under its authenticated RLS policy; public users cannot read appointments.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='appointments') then
  alter publication supabase_realtime add table public.appointments;
 end if;
end $$;


-- Initial public content, generated from backend/src/utils/seedData.ts.
-- OPD schedules below are placeholders: set each doctor's real hours in the staff app.

insert into public.hospital_info (id, data) values (1, '{"name":"We Care Multispeciality Hospital and ICU Doddaballapura","tagline":"24/7 Emergency, ICU & Multi-Specialty Care in Doddaballapura","address":"We Care Multispeciality Hospital and ICU, D Cross main Rd, near Federal Bank, Doddaballapura, Karnataka - 561203","phone":"+91 88677 55541","emergencyPhone":"+91 88677 55541","ambulancePhone":"+91 93530 61993","email":"nandiwecare0@gmail.com","operatingHours":"24/7 Open (Round-the-clock Emergency, ICU & Pharmacy)","mapEmbedUrl":"https://maps.google.com/maps?q=We+Care+Multispeciality+Hospital+and+ICU+Doddaballapura&t=&z=16&ie=UTF8&iwloc=&output=embed","whatsAppNumber":"+91 88677 55541","certifications":["24/7 Availability of Doctors","24/7 Emergency & ICU Care","Karnataka-Wide 24/7 Ambulance Fleet","Friendly & Caring Medical Staff"],"statistics":[{"label":"Medical Disciplines","value":"12"},{"label":"Specialist Doctors","value":"13+"},{"label":"Hospital Bed Capacity","value":"28"},{"label":"Doctor & ICU Care","value":"24/7"}],"socials":{"facebook":"https://facebook.com/nandiwecare","twitter":"https://twitter.com/nandiwecare","instagram":"https://instagram.com/nandiwecare","linkedin":"https://linkedin.com/company/nandiwecare"},"establishedYear":2023,"totalBeds":28,"directorName":"Mr. Vishnuvardhan (Director)","supportedLanguages":["English","Kannada (ಕನ್ನಡ)","Hindi (हिंदी)","Tamil (தமிழ்)","Telugu (తెలుగు)","Malayalam (മലയാളം)","Urdu (اردو)"],"roomTariffs":[{"category":"General Ward","pricePerDay":2500,"description":"Comfortable and hygienic inpatient ward with round-the-clock nursing supervision.","features":["24/7 Nursing Care","Patient Bed & Bedside Locker","Shared Washroom","Vital Monitoring"]},{"category":"Semi-Private Room","pricePerDay":3500,"description":"Twin-sharing air-conditioned room with attendant accommodation.","features":["Air Conditioning (AC)","Dedicated Attendant Bed","Curtained Privacy","Regular Doctor Rounds"]},{"category":"Private Room","pricePerDay":4000,"description":"Independent air-conditioned private suite with dedicated patient amenities.","features":["Air Conditioning (AC)","Attendant Bed","Private Attached Bathroom","Television & Nurse Call"]},{"category":"Intensive Care Unit (ICU)","pricePerDay":6000,"description":"Advanced critical care unit managed by multidisciplinary intensivists and high nurse-to-patient ratio.","features":["Air Conditioning (AC)","Multidisciplinary Critical Care Team","Advanced Continuous Hemodynamic Monitoring","High Staff-to-Patient Ratio"]}],"visitingHours":{"general":"9:00 AM – 11:00 AM & 6:00 PM – 7:00 PM","icu":"5:00 PM – 6:00 PM","maxVisitors":2,"restrictions":["Visitors above 12 years only permitted in inpatient areas","Electric gadgets and flammable items are strictly restricted","All visitors must maintain strict hospital hygiene protocols","Maximum of 2 visitors permitted per patient at any time"]},"insuranceInfo":{"acceptedTPAs":["MD India Health Insurance TPA","Cashless Hospitalization Network"],"cashlessAvailable":true,"preAuthRequired":true,"documentsRequired":["Identity Proof (Aadhaar Card, Voter ID, Passport)","Address Proof","Age Proof","Previous Medical Records & Doctor Prescription","Passport Size Photographs","Duly Filled Insurance Pre-Authorization / Proposal Form"],"paymentMethods":["Cash","UPI (GPay / PhonePe / Paytm)","Debit Card","Credit Card","Net Banking"]}}'::jsonb)
  on conflict (id) do update set data = excluded.data;

insert into public.departments (id, name, code, description, icon_name, display_order, active) values
  ('dept-ortho', 'Department of Orthopaedics', 'ORTH', 'Expert care for bone fractures, joint pain, arthritis, spinal care, and orthopedic surgical interventions.', 'Bone', 1, true),
  ('dept-gynaec', 'Department of Gynaecology & Obstetrics', 'GYNA', 'Comprehensive maternity services, antenatal & postnatal care, normal deliveries, and women''s wellness.', 'UserPlus', 2, true),
  ('dept-pulmo', 'Department of Pulmonology', 'PULM', 'Specialized treatment for asthma, COPD, chronic cough, respiratory infections, and lung conditions.', 'Wind', 3, true),
  ('dept-gastro', 'Department of Gastroenterology', 'GAST', 'Digestive health, liver disease management, abdominal pain, gastrointestinal disorders, and endoscopy evaluations.', 'Activity', 4, true),
  ('dept-pedia', 'Department of Pediatrics', 'PEDI', 'Dedicated child healthcare, pediatric illness management, newborn follow-up, and routine vaccination schedules.', 'Baby', 5, true),
  ('dept-nephro', 'Department of Nephrology', 'NEPH', 'Kidney disease management, renal assessments, hypertension-related kidney disorders, and clinical nephrology.', 'Shield', 6, true),
  ('dept-ent', 'Department of ENT', 'ENT', 'Diagnosis and treatments for ear infections, hearing problems, nasal blockage, sinusitis, and throat conditions.', 'Headphones', 7, true),
  ('dept-neuro', 'Department of Neurology & Neurosurgery', 'NEUR', 'Advanced management for stroke, headache, epilepsy, neuropathy, spine disorders, and neurosurgical emergencies.', 'Brain', 8, true),
  ('dept-gensurg', 'Department of General Surgery', 'GSUR', 'General and emergency surgical care, hernia repair, appendicitis, trauma care, and wound management.', 'Scissors', 9, true),
  ('dept-genmed', 'Department of General Medicine', 'GMED', 'Comprehensive primary and internal medicine, fevers, diabetes, hypertension, and preventive health screenings.', 'Stethoscope', 10, true),
  ('dept-uro', 'Department of Urology', 'UROL', 'Urinary tract infections, kidney stones, prostate disorders, bladder issues, and urological surgical care.', 'Droplets', 11, true),
  ('dept-derm', 'Department of Dermatology', 'DERM', 'Clinical skin condition management, acne, psoriasis, allergies, fungal infections, hair, and nail treatments.', 'Sparkles', 12, true)
on conflict (id) do nothing;

insert into public.doctors (id, name, photo_url, qualification, designation, specialization, department_id, experience_years, registration_number, bio, languages, consultation_fee, display_order, active) values
  ('doc-101', 'Dr. Chiranjeevi Ks', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400', 'MBBS, DNB', 'Consultant Physician', 'General Medicine & Internal Care', 'dept-genmed', 10, null, 'Dr. Chiranjeevi Ks brings extensive clinical experience in general medicine, acute fevers, metabolic care, and adult primary care.', array['Kannada', 'English', 'Hindi']::text[], 400, 1, true),
  ('doc-102', 'Dr. Rameshwari', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400', 'MBBS, DCH, DNB, PGPN', 'Consultant Pediatrician', 'Pediatric Care & Child Nutrition', 'dept-pedia', 12, null, 'Specialist in pediatric developmental health, infant nutrition, pediatric infectious diseases, and childhood immunization.', array['Kannada', 'English', 'Telugu']::text[], 450, 2, true),
  ('doc-103', 'Dr. Rajeev', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400', 'MBBS, MS (Ortho)', 'Consultant Orthopedic Surgeon', 'Orthopedic Surgery & Trauma Care', 'dept-ortho', 14, null, 'Experienced orthopedic surgeon specializing in trauma fracture management, joint care, and musculoskeletal emergencies.', array['Kannada', 'English', 'Hindi']::text[], 500, 3, true),
  ('doc-104', 'Dr. Sri Harsha', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=400', 'MBBS, MS, DNB', 'Consultant General & Laparoscopic Surgeon', 'General & Laparoscopic Surgery', 'dept-gensurg', 11, null, 'Specializes in abdominal surgical interventions, hernia repair, appendectomy, emergency surgery, and wound management.', array['Kannada', 'English', 'Telugu']::text[], 500, 4, true),
  ('doc-105', 'Dr. Manasa', 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=400', 'MBBS, DGO / MS (OBG)', 'Consultant Gynaecologist & Obstetrician', 'Obstetrics, Maternity & Women''s Health', 'dept-gynaec', 9, null, 'Devoted to high-quality antenatal care, normal delivery assistance, reproductive wellness, and adolescent gynecological care.', array['Kannada', 'English', 'Hindi']::text[], 450, 5, true),
  ('doc-106', 'Dr. Swarag', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400', 'MBBS, MS (ENT)', 'Consultant ENT Surgeon', 'Ear, Nose & Throat Disorders', 'dept-ent', 8, null, 'Expertise in managing sinusitis, allergic rhinitis, ear infections, throat disorders, and pediatric ENT consultations.', array['Kannada', 'English']::text[], 400, 6, true),
  ('doc-107', 'Dr. Ravikiran', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=400', 'MBBS, MD, DM', 'Consultant Nephrologist & Super Specialist', 'Nephrology & Renal Medicine', 'dept-nephro', 15, null, 'Super specialist handling complex kidney conditions, chronic renal disorders, electrolyte abnormalities, and hypertension.', array['Kannada', 'English', 'Hindi']::text[], 650, 7, true),
  ('doc-108', 'Dr. Amod', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400', 'MBBS, MD, IDCCM', 'Critical Care Specialist & Intensivist', 'Critical Care Medicine & ICU Lead', 'dept-genmed', 13, null, 'Intensive care expert overseeing multi-disciplinary ICU admissions, mechanical ventilation, and hemodynamic stabilization.', array['Kannada', 'English', 'Hindi', 'Marathi']::text[], 600, 8, true),
  ('doc-109', 'Dr. Sudarshan', 'https://images.unsplash.com/photo-1594824813566-88855ce78c00?auto=format&fit=crop&q=80&w=400', 'MBBS, MD (Dermatology)', 'Consultant Dermatologist', 'Clinical Dermatology & Skin Disorders', 'dept-derm', 10, null, 'Skilled dermatologist treating psoriasis, eczema, skin infections, hair loss, and cosmetic skin care.', array['Kannada', 'English']::text[], 400, 9, true),
  ('doc-110', 'Dr. Ramya Reddy', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400', 'BDS, MDS', 'Dental & Maxillofacial Specialist', 'Oral & Maxillofacial Care', 'dept-gensurg', 9, null, 'Specializes in comprehensive oral health, facial trauma assessments, dental procedures, and surgical extractions.', array['Kannada', 'English', 'Telugu']::text[], 350, 10, true),
  ('doc-111', 'Dr. Vishwanth', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400', 'MBBS, MS, MCH (Urology)', 'Consultant Urologist & Andrologist', 'Urological Surgery & Stone Management', 'dept-uro', 16, null, 'Super specialist surgeon for kidney stone extraction, prostate disease treatment, and reconstructive urology.', array['Kannada', 'English', 'Hindi']::text[], 700, 11, true),
  ('doc-112', 'Dr. Ganesh Prathap', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400', 'MBBS, DTCD / DNB (Resp)', 'Consultant Pulmonologist', 'Pulmonology & Chest Medicine', 'dept-pulmo', 12, null, 'Experienced chest physician diagnosing respiratory distress, allergic asthma, sleep apnea, and lung diseases.', array['Kannada', 'English', 'Hindi']::text[], 500, 12, true),
  ('doc-113', 'Dr. Hariprakash', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400', 'MBBS, M.Ch (Neurosurgery)', 'Consultant Neurosurgeon', 'Neurosurgery & Neurotrauma', 'dept-neuro', 15, null, 'Consultant neurosurgeon with extensive expertise in head injury management, spine care, and critical neurosurgical emergencies.', array['Kannada', 'English']::text[], 700, 13, true)
on conflict (id) do nothing;

insert into public.doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_minutes, capacity_per_slot)
select doctor_id, day_of_week, start_time::time, end_time::time, slot_minutes, capacity_per_slot from (values
  ('doc-101', 1, '09:00', '13:00', 30, 4),
  ('doc-101', 1, '17:00', '20:00', 30, 4),
  ('doc-101', 2, '09:00', '13:00', 30, 4),
  ('doc-101', 3, '09:00', '13:00', 30, 4),
  ('doc-101', 3, '17:00', '20:00', 30, 4),
  ('doc-101', 4, '09:00', '13:00', 30, 4),
  ('doc-101', 5, '09:00', '13:00', 30, 4),
  ('doc-101', 5, '17:00', '20:00', 30, 4),
  ('doc-101', 6, '10:00', '14:00', 30, 4),
  ('doc-102', 1, '10:00', '14:00', 30, 4),
  ('doc-102', 1, '17:00', '20:00', 30, 4),
  ('doc-102', 2, '10:00', '14:00', 30, 4),
  ('doc-102', 3, '10:00', '14:00', 30, 4),
  ('doc-102', 3, '17:00', '20:00', 30, 4),
  ('doc-102', 4, '10:00', '14:00', 30, 4),
  ('doc-102', 5, '10:00', '14:00', 30, 4),
  ('doc-102', 5, '17:00', '20:00', 30, 4),
  ('doc-102', 6, '10:00', '14:00', 30, 4),
  ('doc-103', 1, '09:00', '13:00', 30, 4),
  ('doc-103', 1, '17:00', '20:00', 30, 4),
  ('doc-103', 2, '09:00', '13:00', 30, 4),
  ('doc-103', 3, '09:00', '13:00', 30, 4),
  ('doc-103', 3, '17:00', '20:00', 30, 4),
  ('doc-103', 4, '09:00', '13:00', 30, 4),
  ('doc-103', 5, '09:00', '13:00', 30, 4),
  ('doc-103', 5, '17:00', '20:00', 30, 4),
  ('doc-103', 6, '10:00', '14:00', 30, 4),
  ('doc-104', 1, '10:00', '14:00', 30, 4),
  ('doc-104', 1, '17:00', '20:00', 30, 4),
  ('doc-104', 2, '10:00', '14:00', 30, 4),
  ('doc-104', 3, '10:00', '14:00', 30, 4),
  ('doc-104', 3, '17:00', '20:00', 30, 4),
  ('doc-104', 4, '10:00', '14:00', 30, 4),
  ('doc-104', 5, '10:00', '14:00', 30, 4),
  ('doc-104', 5, '17:00', '20:00', 30, 4),
  ('doc-104', 6, '10:00', '14:00', 30, 4),
  ('doc-105', 1, '09:00', '13:00', 30, 4),
  ('doc-105', 1, '17:00', '20:00', 30, 4),
  ('doc-105', 2, '09:00', '13:00', 30, 4),
  ('doc-105', 3, '09:00', '13:00', 30, 4),
  ('doc-105', 3, '17:00', '20:00', 30, 4),
  ('doc-105', 4, '09:00', '13:00', 30, 4),
  ('doc-105', 5, '09:00', '13:00', 30, 4),
  ('doc-105', 5, '17:00', '20:00', 30, 4),
  ('doc-105', 6, '10:00', '14:00', 30, 4),
  ('doc-106', 1, '10:00', '14:00', 30, 4),
  ('doc-106', 1, '17:00', '20:00', 30, 4),
  ('doc-106', 2, '10:00', '14:00', 30, 4),
  ('doc-106', 3, '10:00', '14:00', 30, 4),
  ('doc-106', 3, '17:00', '20:00', 30, 4),
  ('doc-106', 4, '10:00', '14:00', 30, 4),
  ('doc-106', 5, '10:00', '14:00', 30, 4),
  ('doc-106', 5, '17:00', '20:00', 30, 4),
  ('doc-106', 6, '10:00', '14:00', 30, 4),
  ('doc-107', 1, '09:00', '13:00', 30, 4),
  ('doc-107', 1, '17:00', '20:00', 30, 4),
  ('doc-107', 2, '09:00', '13:00', 30, 4),
  ('doc-107', 3, '09:00', '13:00', 30, 4),
  ('doc-107', 3, '17:00', '20:00', 30, 4),
  ('doc-107', 4, '09:00', '13:00', 30, 4),
  ('doc-107', 5, '09:00', '13:00', 30, 4),
  ('doc-107', 5, '17:00', '20:00', 30, 4),
  ('doc-107', 6, '10:00', '14:00', 30, 4),
  ('doc-108', 1, '10:00', '14:00', 30, 4),
  ('doc-108', 1, '17:00', '20:00', 30, 4),
  ('doc-108', 2, '10:00', '14:00', 30, 4),
  ('doc-108', 3, '10:00', '14:00', 30, 4),
  ('doc-108', 3, '17:00', '20:00', 30, 4),
  ('doc-108', 4, '10:00', '14:00', 30, 4),
  ('doc-108', 5, '10:00', '14:00', 30, 4),
  ('doc-108', 5, '17:00', '20:00', 30, 4),
  ('doc-108', 6, '10:00', '14:00', 30, 4),
  ('doc-109', 1, '09:00', '13:00', 30, 4),
  ('doc-109', 1, '17:00', '20:00', 30, 4),
  ('doc-109', 2, '09:00', '13:00', 30, 4),
  ('doc-109', 3, '09:00', '13:00', 30, 4),
  ('doc-109', 3, '17:00', '20:00', 30, 4),
  ('doc-109', 4, '09:00', '13:00', 30, 4),
  ('doc-109', 5, '09:00', '13:00', 30, 4),
  ('doc-109', 5, '17:00', '20:00', 30, 4),
  ('doc-109', 6, '10:00', '14:00', 30, 4),
  ('doc-110', 1, '10:00', '14:00', 30, 4),
  ('doc-110', 1, '17:00', '20:00', 30, 4),
  ('doc-110', 2, '10:00', '14:00', 30, 4),
  ('doc-110', 3, '10:00', '14:00', 30, 4),
  ('doc-110', 3, '17:00', '20:00', 30, 4),
  ('doc-110', 4, '10:00', '14:00', 30, 4),
  ('doc-110', 5, '10:00', '14:00', 30, 4),
  ('doc-110', 5, '17:00', '20:00', 30, 4),
  ('doc-110', 6, '10:00', '14:00', 30, 4),
  ('doc-111', 1, '09:00', '13:00', 30, 4),
  ('doc-111', 1, '17:00', '20:00', 30, 4),
  ('doc-111', 2, '09:00', '13:00', 30, 4),
  ('doc-111', 3, '09:00', '13:00', 30, 4),
  ('doc-111', 3, '17:00', '20:00', 30, 4),
  ('doc-111', 4, '09:00', '13:00', 30, 4),
  ('doc-111', 5, '09:00', '13:00', 30, 4),
  ('doc-111', 5, '17:00', '20:00', 30, 4),
  ('doc-111', 6, '10:00', '14:00', 30, 4),
  ('doc-112', 1, '10:00', '14:00', 30, 4),
  ('doc-112', 1, '17:00', '20:00', 30, 4),
  ('doc-112', 2, '10:00', '14:00', 30, 4),
  ('doc-112', 3, '10:00', '14:00', 30, 4),
  ('doc-112', 3, '17:00', '20:00', 30, 4),
  ('doc-112', 4, '10:00', '14:00', 30, 4),
  ('doc-112', 5, '10:00', '14:00', 30, 4),
  ('doc-112', 5, '17:00', '20:00', 30, 4),
  ('doc-112', 6, '10:00', '14:00', 30, 4),
  ('doc-113', 1, '09:00', '13:00', 30, 4),
  ('doc-113', 1, '17:00', '20:00', 30, 4),
  ('doc-113', 2, '09:00', '13:00', 30, 4),
  ('doc-113', 3, '09:00', '13:00', 30, 4),
  ('doc-113', 3, '17:00', '20:00', 30, 4),
  ('doc-113', 4, '09:00', '13:00', 30, 4),
  ('doc-113', 5, '09:00', '13:00', 30, 4),
  ('doc-113', 5, '17:00', '20:00', 30, 4),
  ('doc-113', 6, '10:00', '14:00', 30, 4)
) v(doctor_id, day_of_week, start_time, end_time, slot_minutes, capacity_per_slot)
where not exists (select 1 from public.doctor_schedules);

insert into public.services (id, name, short_description, full_description, icon_name, display_order, active) values
  ('srv-1', '24/7 Emergency & Casualty Care', 'Immediate emergency triage, trauma resuscitation, burns care, and emergency surgery around the clock.', 'Operates 24/7 to deliver rapid assessment, stabilization, and multidisciplinary treatment for critical illnesses and major traumas with on-call specialists.', 'Ambulance', 1, true),
  ('srv-2', 'ICU & Critical Care Unit', 'Multi-disciplinary 24/7 intensive care with advanced hemodynamic monitoring and high nurse-to-patient ratio.', 'Dedicated critical care infrastructure staffed by trained intensivists for post-operative recovery, cardiac crises, and critical respiratory emergencies.', 'Activity', 2, true),
  ('srv-3', 'General & Emergency Surgery', 'Modular Operation Theatre for emergency surgery, appendectomy, hernia, and acute surgical interventions.', 'Infection-controlled operating environment equipped for abdominal, orthopedic, urological, and trauma surgical procedures.', 'Syringe', 3, true),
  ('srv-4', 'Maternity & Obstetrics Care', 'Safe deliveries, prenatal and postnatal monitoring, and comprehensive mother-child care.', 'Compassionate maternal healthcare supporting antenatal visits, fetal heart tracking, labor suites, and postnatal infant guidance.', 'Baby', 4, true),
  ('srv-5', 'Child Vaccination & Preventive Health', 'Pediatric immunizations, infant growth tracking, and complete preventive health checkup packages.', 'Full range of government and optional childhood vaccines, wellness assessments, diabetes screening, and routine health evaluations.', 'Shield', 5, true),
  ('srv-6', '24/7 Diagnostic Pathology & Lab', 'In-house blood and urine diagnostic tests with guaranteed Same-Day digital report delivery.', 'Equipped for complete blood counts, biochemical profiles, renal and liver function panels, urinalysis, and emergency cardiac biomarkers.', 'Microscope', 6, true),
  ('srv-7', 'Digital X-Ray & ECG Diagnostics', 'High-resolution digital radiology and 12-lead ECG evaluations available 24/7.', 'Immediate imaging for bone fractures, chest diagnostics, abdominal conditions, and rapid ECG readings for cardiac symptoms.', 'Activity', 7, true)
on conflict (id) do nothing;

insert into public.facilities (id, name, description, image_url, display_order, active) values
  ('fac-1', 'Intensive Care Unit (ICU)', '24/7 multi-disciplinary ICU with continuous physiological monitoring, ventilators, and high nurse-to-patient ratio.', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600', 1, true),
  ('fac-2', 'Modern Operation Theatre (OT)', 'Infection-controlled surgical suite designed for elective, trauma, and round-the-clock emergency surgical procedures.', 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=600', 2, true),
  ('fac-3', 'In-House 24/7 Pharmacy', 'Fully stocked round-the-clock medical store dispensing authentic prescriptions, emergency injectables, and surgical consumables.', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=600', 3, true),
  ('fac-4', '24/7 Ambulance Fleet (Karnataka-Wide)', 'Emergency ambulance service available 24/7 covering Doddaballapura and all across Karnataka (Call: +91 93530 61993).', 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&q=80&w=600', 4, true),
  ('fac-5', 'Patient Amenities & Full Accessibility', 'Dedicated patient parking, wheelchair ramps, elevators, accessible restrooms, and comfortable air-conditioned waiting lounges.', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600', 5, true)
on conflict (id) do nothing;



-- =============================================================================
-- ASSIGN SUPER ADMIN ROLE TO OWNER
-- =============================================================================
INSERT INTO public.profiles (id, role, full_name, email)
SELECT id, 'SUPER_ADMIN'::public.app_role, 'Hospital Administrator', email
FROM auth.users
WHERE email = 'anushreetc678@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'SUPER_ADMIN'::public.app_role, full_name = 'Hospital Administrator', email = EXCLUDED.email;

SELECT p.id, u.email, p.role, p.full_name
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'anushreetc678@gmail.com';
