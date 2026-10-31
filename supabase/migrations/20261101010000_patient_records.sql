-- Patient records: one record per patient, visits (consultations) and prescriptions.
--
--   A patient is identified by mobile number + name (a family can share one phone).
--   Every booking is linked to its patient automatically (trigger on appointments).
--   Medical content (complaint, diagnosis, prescription) is visible to doctors only;
--   reception/admin see patient details and the list of visits.
--   All access goes through the RPCs below; the tables have no direct grants.
--   Opening a record and every create/edit of a visit is written to audit_logs.

create or replace function public.normalize_name(p text)
returns text
language sql
immutable
set search_path = ''
as $$ select lower(regexp_replace(trim(coalesce(p, '')), '\s+', ' ', 'g')) $$;

create sequence public.patient_code_seq;

create table public.patients (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique default ('WC-' || lpad(nextval('public.patient_code_seq')::text, 5, '0')),
  name        text not null check (length(trim(name)) between 1 and 120),
  phone       text not null check (phone ~ '^[0-9]{10}$'),
  gender      text check (gender in ('MALE', 'FEMALE', 'OTHER')),
  birth_year  int check (birth_year between 1900 and 2100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index patients_phone_name_key on public.patients (phone, public.normalize_name(name));

alter table public.appointments add column patient_record_id uuid references public.patients (id);
create index appointments_patient_record_idx on public.appointments (patient_record_id);

create table public.consultations (
  id              uuid primary key default gen_random_uuid(),
  patient_id      uuid not null references public.patients (id),
  appointment_id  uuid unique references public.appointments (id) on delete set null,
  doctor_id       text not null references public.doctors (id),
  visit_date      date not null default (now() at time zone 'Asia/Kolkata')::date,
  complaint       text check (length(complaint) <= 2000),
  findings        text check (length(findings) <= 4000),
  vitals          jsonb not null default '{}'::jsonb,
  diagnosis       text check (length(diagnosis) <= 2000),
  advice          text check (length(advice) <= 4000),
  follow_up_date  date,
  created_by      uuid default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index consultations_patient_idx on public.consultations (patient_id, visit_date desc);

create table public.prescription_items (
  id               uuid primary key default gen_random_uuid(),
  consultation_id  uuid not null references public.consultations (id) on delete cascade,
  position         int not null,
  medicine         text not null check (length(trim(medicine)) between 1 and 200),
  dose             text check (length(dose) <= 100),
  frequency        text check (length(frequency) <= 50),
  timing           text check (length(timing) <= 50),
  duration_days    int check (duration_days between 0 and 3650),
  notes            text check (length(notes) <= 500)
);
create index prescription_items_consultation_idx on public.prescription_items (consultation_id, position);
create index prescription_items_medicine_idx on public.prescription_items (lower(medicine));

alter table public.patients           enable row level security;
alter table public.consultations      enable row level security;
alter table public.prescription_items enable row level security;
revoke all on public.patients, public.consultations, public.prescription_items from anon, authenticated;

-- Find-or-create the patient for a name + mobile number.
create or replace function public.patient_for(p_name text, p_phone text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
  v_id uuid;
begin
  if v_phone !~ '^[0-9]{10}$' or public.normalize_name(p_name) = '' then
    return null;
  end if;
  insert into public.patients (name, phone)
  values (regexp_replace(trim(p_name), '\s+', ' ', 'g'), v_phone)
  on conflict (phone, public.normalize_name(name)) do update set updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.patient_for(text, text) from public, anon, authenticated;

create or replace function public.link_appointment_patient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.patient_record_id := public.patient_for(new.patient_name, new.patient_phone);
  return new;
end;
$$;
revoke all on function public.link_appointment_patient() from public, anon, authenticated;

create trigger appointments_link_patient
  before insert or update of patient_name, patient_phone on public.appointments
  for each row execute function public.link_appointment_patient();

-- Existing bookings.
update public.appointments set patient_record_id = public.patient_for(patient_name, patient_phone);

-- Who may use patient records at all: reception/admin or a linked doctor.
create or replace function public.can_view_patients()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select public.is_staff() or public.my_doctor_id() is not null $$;

-- Search by mobile number (exact, 10 digits), patient ID (WC-00012) or name.
create or replace function public.search_patients(p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  q text := trim(coalesce(p_query, ''));
  digits text := regexp_replace(q, '\D', '', 'g');
  result jsonb;
begin
  if not public.can_view_patients() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if length(q) < 2 then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(row_to_json(t) order by t.last_visit desc nulls last, t.name), '[]'::jsonb) into result
  from (
    select p.id, p.code, p.name, p.phone, p.gender,
           case when p.birth_year is not null
                then extract(year from now() at time zone 'Asia/Kolkata')::int - p.birth_year end as age,
           greatest(
             (select max(c.visit_date) from public.consultations c where c.patient_id = p.id),
             (select max(a.appointment_date) from public.appointments a
               where a.patient_record_id = p.id and a.status <> 'CANCELLED')
           ) as last_visit,
           (select d.name from public.appointments a join public.doctors d on d.id = a.doctor_id
             where a.patient_record_id = p.id and a.status <> 'CANCELLED'
             order by a.appointment_date desc, a.slot_time desc limit 1) as last_doctor,
           (select count(*) from public.consultations c where c.patient_id = p.id) as visit_count
    from public.patients p
    where case
            when q ~* '^wc-?[0-9]+$' then p.code = 'WC-' || lpad(digits, 5, '0')
            when length(digits) >= 10 and q !~ '[A-Za-z]' then p.phone = right(digits, 10)
            when length(digits) >= 4 and q !~ '[A-Za-z]' then p.phone like '%' || digits || '%'
            else public.normalize_name(p.name) like '%' || public.normalize_name(q) || '%'
          end
    limit 25
  ) t;
  return result;
end;
$$;

-- Full record. Medical content only for doctors.
create or replace function public.get_patient_record(p_patient uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doctor text := public.my_doctor_id();
  v_patient jsonb;
  v_visits jsonb;
  v_bookings jsonb;
begin
  if not public.can_view_patients() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  select jsonb_build_object(
           'id', p.id, 'code', p.code, 'name', p.name, 'phone', p.phone, 'gender', p.gender,
           'birth_year', p.birth_year,
           'age', case when p.birth_year is not null
                       then extract(year from now() at time zone 'Asia/Kolkata')::int - p.birth_year end,
           'created_at', p.created_at)
    into v_patient
  from public.patients p where p.id = p_patient;
  if v_patient is null then
    raise exception 'Patient not found' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(v order by v->>'visit_date' desc, v->>'created_at' desc), '[]'::jsonb) into v_visits
  from (
    select jsonb_build_object(
             'id', c.id, 'visit_date', c.visit_date, 'appointment_id', c.appointment_id,
             'doctor_id', c.doctor_id, 'doctor_name', d.name,
             'doctor_qualification', d.qualification, 'doctor_designation', d.designation,
             'doctor_registration', d.registration_number,
             'created_at', c.created_at, 'updated_at', c.updated_at,
             'is_mine', c.doctor_id = v_doctor
           )
           || case when v_doctor is null then '{}'::jsonb else jsonb_build_object(
             'complaint', c.complaint, 'findings', c.findings, 'vitals', c.vitals,
             'diagnosis', c.diagnosis, 'advice', c.advice, 'follow_up_date', c.follow_up_date,
             'items', coalesce((
               select jsonb_agg(jsonb_build_object(
                        'medicine', i.medicine, 'dose', i.dose, 'frequency', i.frequency,
                        'timing', i.timing, 'duration_days', i.duration_days, 'notes', i.notes)
                      order by i.position)
               from public.prescription_items i where i.consultation_id = c.id), '[]'::jsonb)
           ) end as v
    from public.consultations c
    join public.doctors d on d.id = c.doctor_id
    where c.patient_id = p_patient
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'code', a.code, 'date', a.appointment_date, 'time', a.slot_time,
           'doctor_id', a.doctor_id, 'doctor_name', d.name, 'status', a.status,
           'reason', a.reason, 'token', a.token_number, 'source', a.source)
         order by a.appointment_date desc, a.slot_time desc), '[]'::jsonb) into v_bookings
  from public.appointments a
  join public.doctors d on d.id = a.doctor_id
  where a.patient_record_id = p_patient;

  perform public.write_audit('PATIENT_RECORD_VIEWED', 'patient', p_patient::text, jsonb_build_object('code', v_patient->>'code'));

  return jsonb_build_object('patient', v_patient, 'visits', v_visits, 'bookings', v_bookings);
end;
$$;

-- Create or edit a visit with its prescription. Doctors only; only the author edits.
create or replace function public.save_consultation(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doctor text := public.my_doctor_id();
  v_id uuid := nullif(p->>'id', '')::uuid;
  v_patient uuid := (p->>'patient_id')::uuid;
  v_appt uuid := nullif(p->>'appointment_id', '')::uuid;
  v_old jsonb;
  v_items jsonb := coalesce(p->'items', '[]'::jsonb);
begin
  if v_doctor is null then
    raise exception 'Only doctors can write prescriptions' using errcode = '42501';
  end if;
  if not exists (select 1 from public.patients where id = v_patient) then
    raise exception 'Patient not found' using errcode = 'P0002';
  end if;
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) > 50 then
    raise exception 'Invalid prescription items' using errcode = '22023';
  end if;
  if v_appt is not null and not exists (
       select 1 from public.appointments
       where id = v_appt and doctor_id = v_doctor and patient_record_id = v_patient) then
    raise exception 'That booking is not yours or is for another patient' using errcode = '42501';
  end if;

  if v_id is null then
    insert into public.consultations (patient_id, appointment_id, doctor_id, visit_date, complaint, findings,
                                      vitals, diagnosis, advice, follow_up_date)
    values (v_patient, v_appt, v_doctor,
            coalesce(nullif(p->>'visit_date', '')::date, (now() at time zone 'Asia/Kolkata')::date),
            nullif(trim(p->>'complaint'), ''), nullif(trim(p->>'findings'), ''),
            coalesce(p->'vitals', '{}'::jsonb), nullif(trim(p->>'diagnosis'), ''),
            nullif(trim(p->>'advice'), ''), nullif(p->>'follow_up_date', '')::date)
    returning id into v_id;
    perform public.write_audit('CONSULTATION_CREATED', 'consultation', v_id::text,
                               jsonb_build_object('patient_id', v_patient));
  else
    select to_jsonb(c) || jsonb_build_object('items', coalesce((
             select jsonb_agg(to_jsonb(i) - 'id' - 'consultation_id' order by i.position)
             from public.prescription_items i where i.consultation_id = c.id), '[]'::jsonb))
      into v_old
    from public.consultations c
    where c.id = v_id and c.doctor_id = v_doctor and c.patient_id = v_patient;
    if v_old is null then
      raise exception 'Only the doctor who wrote this visit can edit it' using errcode = '42501';
    end if;
    update public.consultations set
      complaint = nullif(trim(p->>'complaint'), ''), findings = nullif(trim(p->>'findings'), ''),
      vitals = coalesce(p->'vitals', '{}'::jsonb), diagnosis = nullif(trim(p->>'diagnosis'), ''),
      advice = nullif(trim(p->>'advice'), ''), follow_up_date = nullif(p->>'follow_up_date', '')::date,
      updated_at = now()
    where id = v_id;
    delete from public.prescription_items where consultation_id = v_id;
    -- The previous version is kept in the audit log.
    perform public.write_audit('CONSULTATION_EDITED', 'consultation', v_id::text,
                               jsonb_build_object('patient_id', v_patient, 'previous', v_old));
  end if;

  insert into public.prescription_items (consultation_id, position, medicine, dose, frequency, timing, duration_days, notes)
  select v_id, ord, trim(e->>'medicine'), nullif(trim(e->>'dose'), ''), nullif(trim(e->>'frequency'), ''),
         nullif(trim(e->>'timing'), ''), nullif(e->>'duration_days', '')::int, nullif(trim(e->>'notes'), '')
  from jsonb_array_elements(v_items) with ordinality as x(e, ord)
  where trim(coalesce(e->>'medicine', '')) <> '';

  return v_id;
end;
$$;

-- Age and gender, editable by reception and doctors.
create or replace function public.update_patient_details(p_patient uuid, p_gender text, p_birth_year int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_view_patients() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  update public.patients
  set gender = nullif(p_gender, ''), birth_year = p_birth_year, updated_at = now()
  where id = p_patient;
  perform public.write_audit('PATIENT_UPDATED', 'patient', p_patient::text,
                             jsonb_build_object('gender', p_gender, 'birth_year', p_birth_year));
end;
$$;

-- Medicine names already used, for auto-suggest.
create or replace function public.medicine_suggestions(p_prefix text)
returns setof text
language sql
stable
security definer
set search_path = ''
as $$
  select m from (
    select distinct on (lower(medicine)) medicine as m, lower(medicine) as k
    from public.prescription_items
    where public.my_doctor_id() is not null
      and length(trim(coalesce(p_prefix, ''))) >= 2
      and lower(medicine) like lower(trim(p_prefix)) || '%'
  ) s order by k limit 10;
$$;

revoke all on function public.can_view_patients(), public.search_patients(text), public.get_patient_record(uuid),
  public.save_consultation(jsonb), public.update_patient_details(uuid, text, int), public.medicine_suggestions(text)
  from public, anon;
grant execute on function public.can_view_patients(), public.search_patients(text), public.get_patient_record(uuid),
  public.save_consultation(jsonb), public.update_patient_details(uuid, text, int), public.medicine_suggestions(text)
  to authenticated;
