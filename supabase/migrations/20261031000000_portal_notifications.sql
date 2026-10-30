-- In-portal alerts for reception and doctors (instead of SMS).
--
--   New booking (any channel)          -> RECEPTION: confirm with the patient
--   Booking confirmed                  -> DOCTOR:    new appointment
--   Confirmed booking cancelled/moved  -> DOCTOR
--   Patient cancels                    -> RECEPTION
--   Voice call without a booking       -> RECEPTION: follow up
--
-- Rows are written only by these triggers. Read state is per staff member.

create type public.notification_audience as enum ('RECEPTION', 'DOCTOR');

create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  audience        public.notification_audience not null,
  doctor_id       text references public.doctors (id) on delete cascade,
  kind            text not null,
  title           text not null,
  body            text not null,
  appointment_id  uuid references public.appointments (id) on delete cascade,
  voice_call_id   uuid references public.voice_calls (id) on delete cascade,
  created_at      timestamptz not null default now(),
  constraint notifications_doctor_audience check ((audience = 'DOCTOR') = (doctor_id is not null))
);
create index notifications_reception_idx on public.notifications (created_at desc) where audience = 'RECEPTION';
create index notifications_doctor_idx on public.notifications (doctor_id, created_at desc) where audience = 'DOCTOR';

create table public.notification_reads (
  notification_id uuid not null references public.notifications (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  read_at         timestamptz not null default now(),
  primary key (notification_id, user_id)
);

alter table public.notifications      enable row level security;
alter table public.notification_reads enable row level security;

grant select on public.notifications to authenticated;
grant select, insert on public.notification_reads to authenticated;

create policy notifications_read on public.notifications for select to authenticated
  using (
    (audience = 'RECEPTION' and public.is_staff())
    or (audience = 'DOCTOR' and doctor_id = public.my_doctor_id())
  );

create policy notification_reads_own_select on public.notification_reads for select to authenticated
  using (user_id = auth.uid());
create policy notification_reads_own_insert on public.notification_reads for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.notifications n where n.id = notification_id)
  );

-- "Harsha · Dr. Hariprakash · 31 Oct, 1:00 PM · Token 1"
create or replace function public.appointment_line(p_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.patient_name || ' · ' || d.name || ' · '
         || to_char(a.appointment_date, 'DD Mon') || ', ' || ltrim(to_char(a.slot_time, 'HH12:MI AM'), '0')
         || ' · Token ' || a.token_number
  from public.appointments a
  join public.doctors d on d.id = a.doctor_id
  where a.id = p_id;
$$;
revoke all on function public.appointment_line(uuid) from public, anon, authenticated;

create or replace function public.notify_appointment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line   text := public.appointment_line(new.id);
  v_source text := case new.source
                     when 'VOICE_AI' then 'voice agent'
                     when 'WEBSITE' then 'website'
                     when 'PATIENT_PORTAL' then 'patient portal'
                     when 'FRONT_DESK' then 'front desk'
                     else lower(new.source::text) end;
begin
  if tg_op = 'INSERT' then
    if new.status = 'NEW' then
      insert into public.notifications (audience, kind, title, body, appointment_id)
      values ('RECEPTION', 'NEW_BOOKING', 'New booking via ' || v_source,
              v_line || '. Call the patient to confirm.', new.id);
    end if;
    if new.status = 'CONFIRMED' then
      insert into public.notifications (audience, doctor_id, kind, title, body, appointment_id)
      values ('DOCTOR', new.doctor_id, 'BOOKING_CONFIRMED', 'New appointment', v_line || coalesce('. Reason: ' || new.reason, ''), new.id);
    end if;
    return new;
  end if;

  -- UPDATE
  if new.status = 'CONFIRMED' and old.status is distinct from 'CONFIRMED' then
    insert into public.notifications (audience, doctor_id, kind, title, body, appointment_id)
    values ('DOCTOR', new.doctor_id, 'BOOKING_CONFIRMED', 'New appointment', v_line || coalesce('. Reason: ' || new.reason, ''), new.id);
  elsif new.status = 'CANCELLED' and old.status is distinct from 'CANCELLED' then
    if old.status = 'CONFIRMED' then
      insert into public.notifications (audience, doctor_id, kind, title, body, appointment_id)
      values ('DOCTOR', new.doctor_id, 'BOOKING_CANCELLED', 'Appointment cancelled', v_line, new.id);
    end if;
    if not public.is_staff() then
      insert into public.notifications (audience, kind, title, body, appointment_id)
      values ('RECEPTION', 'BOOKING_CANCELLED', 'Patient cancelled a booking', v_line, new.id);
    end if;
  elsif new.status = 'CONFIRMED'
        and (new.appointment_date, new.slot_time, new.doctor_id) is distinct from (old.appointment_date, old.slot_time, old.doctor_id) then
    insert into public.notifications (audience, doctor_id, kind, title, body, appointment_id)
    values ('DOCTOR', new.doctor_id, 'BOOKING_RESCHEDULED', 'Appointment rescheduled', v_line, new.id);
  end if;
  return new;
end;
$$;

create trigger appointments_notify_insert
  after insert on public.appointments
  for each row execute function public.notify_appointment_change();

create trigger appointments_notify_update
  after update of status, appointment_date, slot_time, doctor_id on public.appointments
  for each row execute function public.notify_appointment_change();

create or replace function public.notify_voice_call()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.appointment_id is null then
    insert into public.notifications (audience, kind, title, body, voice_call_id)
    values (
      'RECEPTION',
      case when new.intent = 'EMERGENCY_QUERY' then 'CALL_EMERGENCY' else 'CALL_FOLLOW_UP' end,
      case when new.intent = 'EMERGENCY_QUERY' then 'Emergency mentioned on a voice call' else 'Voice call needs follow-up' end,
      coalesce(nullif(new.caller_name, ''), 'Unknown caller')
        || case when new.phone_number <> 'WEB' then ' (' || new.phone_number || ')' else '' end
        || coalesce('. ' || left(new.summary, 200), ''),
      new.id
    );
  end if;
  return new;
end;
$$;

create trigger voice_calls_notify_insert
  after insert on public.voice_calls
  for each row execute function public.notify_voice_call();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;

-- Trigger functions are not part of the API.
revoke all on function public.notify_appointment_change() from public, anon, authenticated;
revoke all on function public.notify_voice_call() from public, anon, authenticated;
