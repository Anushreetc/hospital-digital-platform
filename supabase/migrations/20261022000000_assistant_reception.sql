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
