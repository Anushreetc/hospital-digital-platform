-- Access-control and booking tests. Run with supabase/tests/local/run.sh.
-- Each block switches to a database role and JWT the way Supabase's API does
-- for a real request, then asserts what that caller can and cannot do.
\set ON_ERROR_STOP 1
\set QUIET 1

-- ---------------------------------------------------------------------------
-- Test helpers
-- ---------------------------------------------------------------------------
create schema test;
grant usage on schema test to anon, authenticated;

create function test.next_dow(p_dow int) returns date language sql stable as $$
  select public.hospital_today() + (((p_dow - extract(dow from public.hospital_today())::int + 7) % 7) + 7);
$$;

-- Runs p_sql and passes only if it fails with a message matching p_pattern.
create function test.expect_error(p_sql text, p_pattern text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'expected error matching "%" but statement succeeded: %', p_pattern, p_sql;
exception when others then
  if sqlerrm like 'expected error matching%' then raise; end if;
  if sqlerrm !~* p_pattern then
    raise exception 'expected error matching "%" but got "%"', p_pattern, sqlerrm;
  end if;
end;
$$;
grant execute on all functions in schema test to anon, authenticated;

create table test.ids (name text primary key, id uuid);
grant select, insert on test.ids to anon, authenticated;

-- Users. The 'role' in metadata must be ignored by the sign-up trigger.
insert into auth.users (id, email, phone, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', null, '919845012345', '{"full_name":"Pat One","role":"SUPER_ADMIN"}'),
  ('00000000-0000-0000-0000-00000000000b', null, '919900000002', '{"full_name":"Pat Two"}'),
  ('00000000-0000-0000-0000-00000000000c', 'reception@example.test', null, '{"full_name":"Front Desk"}'),
  ('00000000-0000-0000-0000-00000000000d', 'admin@example.test', null, '{"full_name":"Hospital Admin"}'),
  ('00000000-0000-0000-0000-00000000000e', 'super@example.test', null, '{"full_name":"Super Admin"}'),
  ('00000000-0000-0000-0000-00000000000f', 'doctor@example.test', null, '{"full_name":"Dr Chiranjeevi"}');

do $$ begin
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'PATIENT',
    'sign-up metadata must not be able to set a role';
end $$;

-- Bootstrap staff roles the way SUPABASE_SETUP.md describes (as the service role / SQL editor).
update public.profiles set role = 'RECEPTIONIST'   where id = '00000000-0000-0000-0000-00000000000c';
update public.profiles set role = 'HOSPITAL_ADMIN' where id = '00000000-0000-0000-0000-00000000000d';
update public.profiles set role = 'SUPER_ADMIN'    where id = '00000000-0000-0000-0000-00000000000e';
update public.profiles set role = 'DOCTOR'         where id = '00000000-0000-0000-0000-00000000000f';
update public.doctors set user_id = '00000000-0000-0000-0000-00000000000f' where id = 'doc-101';

-- ---------------------------------------------------------------------------
-- Anonymous visitor (public website)
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"role":"anon"}';
set role anon;

do $$ begin
  assert (select count(*) from public.departments) > 0, 'anon can read departments';
  assert (select count(*) from public.doctors) > 0, 'anon can read doctors';
  assert (select count(*) from public.hospital_info) = 1, 'anon can read hospital info';
  assert (select count(*) from public.get_available_slots('doc-101', test.next_dow(1))) = 14,
    'doc-101 has 8 morning + 6 evening slots on Monday';
  assert (select count(*) from public.get_available_slots('doc-101', public.hospital_today() + 90)) = 0,
    'no slots beyond the 60-day booking window';
end $$;

select test.expect_error('select * from public.appointments', 'permission denied');
select test.expect_error('select * from public.profiles', 'permission denied');
select test.expect_error('select * from public.audit_logs', 'permission denied');
select test.expect_error('select * from public.voice_calls', 'permission denied');
select test.expect_error($q$insert into public.departments (id, name, code) values ('x', 'x', 'X')$q$, 'permission denied');
select test.expect_error($q$select public.update_appointment_status(gen_random_uuid(), 'CANCELLED')$q$, 'permission denied');
select test.expect_error('select public.get_dashboard_stats()', 'permission denied');

do $$
declare r jsonb;
begin
  r := public.book_appointment('doc-101', test.next_dow(1), '09:00', 'Guest Patient', '+91 98450 12345', 'Fever', p_idempotency_key => 'k1');
  assert r ->> 'status' = 'NEW', 'guest bookings start as NEW';
  assert r ->> 'source' = 'WEBSITE', 'guest source is forced to WEBSITE';
  assert r ->> 'patient_phone' = '9845012345', 'phone is normalised';
  assert (r ->> 'token_number')::int = 1, 'first token of the day';
  assert r ->> 'code' ~ '^APT-[0-9]{8}-[0-9A-F]{5}$', 'booking code format';
  -- Retrying with the same idempotency key returns the same booking.
  assert public.book_appointment('doc-101', test.next_dow(1), '09:00', 'Guest Patient', '9845012345', 'Fever',
    p_idempotency_key => 'k1') ->> 'id' = r ->> 'id', 'idempotent retry';
  -- A guest cannot claim a privileged channel.
  assert public.book_appointment('doc-101', test.next_dow(1), '09:30', 'Other', '9845000001', 'Cough',
    p_source => 'FRONT_DESK') ->> 'source' = 'WEBSITE', 'guest cannot choose source';
end $$;

select test.expect_error($q$select public.book_appointment('doc-101', test.next_dow(1), '10:00', 'Guest Patient', '9845012345', 'Fever')$q$, 'already has a booking');
select test.expect_error($q$select public.book_appointment('doc-101', test.next_dow(1), '07:00', 'A B', '9845011111', 'Fever')$q$, 'not an available OPD slot');
select test.expect_error($q$select public.book_appointment('doc-101', test.next_dow(1), '10:00', 'A B', '12345', 'Fever')$q$, 'valid 10-digit');
select test.expect_error($q$select public.book_appointment('doc-101', test.next_dow(1), '10:00', 'A', '9845011111', 'Fever')$q$, 'full name');
select test.expect_error($q$select public.book_appointment('nope', test.next_dow(1), '10:00', 'A B', '9845011111', 'Fever')$q$, 'not available for booking');
select test.expect_error($q$select public.book_appointment('doc-101', public.hospital_today() - 1, '10:00', 'A B', '9845011111', 'Fever')$q$, 'not an available OPD slot');

-- Slot capacity (4 per slot).
do $$ begin
  perform public.book_appointment('doc-101', test.next_dow(1), '11:00', 'Cap One',   '9845020001', 'x1');
  perform public.book_appointment('doc-101', test.next_dow(1), '11:00', 'Cap Two',   '9845020002', 'x2');
  perform public.book_appointment('doc-101', test.next_dow(1), '11:00', 'Cap Three', '9845020003', 'x3');
  perform public.book_appointment('doc-101', test.next_dow(1), '11:00', 'Cap Four',  '9845020004', 'x4');
  assert (select available from public.get_available_slots('doc-101', test.next_dow(1)) where slot_time = '11:00') = 0,
    'slot is full after 4 bookings';
end $$;
select test.expect_error($q$select public.book_appointment('doc-101', test.next_dow(1), '11:00', 'Cap Five', '9845020005', 'x5')$q$, 'fully booked');

-- At most 3 upcoming bookings per phone for non-staff callers.
do $$ begin
  perform public.book_appointment('doc-102', test.next_dow(1), '10:00', 'Spam', '9845030000', 'aa');
  perform public.book_appointment('doc-103', test.next_dow(1), '09:00', 'Spam', '9845030000', 'bb');
  perform public.book_appointment('doc-104', test.next_dow(1), '10:00', 'Spam', '9845030000', 'cc');
end $$;
select test.expect_error($q$select public.book_appointment('doc-105', test.next_dow(1), '09:00', 'Spam', '9845030000', 'dd')$q$, 'already has 3 upcoming');
reset role;

-- ---------------------------------------------------------------------------
-- Signed-in patient
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated","aal":"aal1"}';
set role authenticated;

do $$
declare r jsonb;
begin
  assert public.claim_guest_bookings() = 0, 'unverified phone claims nothing';
  r := public.book_appointment('doc-101', test.next_dow(1), '12:00', 'Pat One', '9900000001', 'Check-up', p_source => 'FRONT_DESK');
  assert r ->> 'status' = 'CONFIRMED', 'verified patient bookings are confirmed';
  assert r ->> 'source' = 'PATIENT_PORTAL', 'patient source is forced';
  insert into test.ids values ('pat_appt', (r ->> 'id')::uuid);
  assert (select count(*) from public.appointments) = 1, 'patient sees only their own appointments';
  assert (select count(*) from public.profiles) = 1, 'patient sees only their own profile';
  assert (select count(*) from public.audit_logs) = 0, 'patient cannot read audit logs';
  update public.profiles set full_name = 'Patient One' where id = auth.uid();
  assert (select full_name from public.profiles where id = auth.uid()) = 'Patient One', 'patient edits own name';
end $$;

select test.expect_error($q$update public.profiles set role = 'SUPER_ADMIN' where id = auth.uid()$q$, 'permission denied');
reset role;
update auth.users set phone_confirmed_at = now() where id = '00000000-0000-0000-0000-00000000000a';
set role authenticated;
do $$ begin
  assert public.claim_guest_bookings() = 1, 'verified phone claims the earlier guest booking';
  assert (select count(*) from public.appointments) = 2, 'claimed booking is now visible';
  assert public.claim_guest_bookings() = 0, 'claiming is idempotent';
end $$;
select test.expect_error($q$update public.appointments set status = 'CONFIRMED'$q$, 'permission denied');
select test.expect_error($q$insert into public.appointments (code) values ('x')$q$, 'permission denied');
select test.expect_error($q$select public.set_user_role('00000000-0000-0000-0000-00000000000b', 'SUPER_ADMIN')$q$, 'not allowed');
select test.expect_error('select public.get_dashboard_stats()', 'not allowed');
select test.expect_error($q$select public.update_appointment_status((select id from public.appointments where false), 'CANCELLED')$q$, 'not found');
select test.expect_error($q$select public.update_appointment_status((select id from test.ids where name = 'pat_appt'), 'COMPLETED')$q$, 'only cancel');

do $$ begin
  assert public.update_appointment_status((select id from test.ids where name = 'pat_appt'), 'CANCELLED') ->> 'status' = 'CANCELLED',
    'patient cancels own upcoming appointment';
end $$;
reset role;

-- Another patient cannot touch the first patient's booking.
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","aal":"aal1"}';
set role authenticated;
do $$ begin
  assert (select count(*) from public.appointments) = 0, 'other patient sees nothing';
end $$;
select test.expect_error($q$select public.update_appointment_status((select id from test.ids where name = 'pat_appt'), 'CANCELLED')$q$, 'not allowed|cannot change');
reset role;

-- ---------------------------------------------------------------------------
-- Receptionist: nothing without MFA, full front-desk access with it
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated","aal":"aal1"}';
set role authenticated;
do $$ begin
  assert (select count(*) from public.appointments) = 0, 'staff without MFA see no appointments';
end $$;
select test.expect_error('select public.get_dashboard_stats()', 'not allowed');
reset role;

set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated","aal":"aal2"}';
set role authenticated;
do $$
declare v_id uuid; r jsonb;
begin
  assert (select count(*) from public.appointments) >= 10, 'staff with MFA see all appointments';
  assert (select count(*) from public.profiles) = 6, 'staff can look up profiles';
  assert (public.get_dashboard_stats() ->> 'activeDoctors')::int > 0, 'dashboard stats';
  select id into v_id from public.appointments where patient_phone = '9845012345';
  assert public.update_appointment_status(v_id, 'CONFIRMED', 'Called patient') ->> 'status' = 'CONFIRMED', 'confirm guest booking';
  assert (select jsonb_array_length(notes) from public.appointments where id = v_id) = 1, 'note recorded';
  perform public.add_appointment_note(v_id, 'Bring old reports');
  -- Staff bookings bypass the per-phone limit and are confirmed.
  r := public.book_appointment('doc-105', test.next_dow(1), '09:00', 'Spam', '9845030000', 'walk-in', p_source => 'PHONE');
  assert r ->> 'source' = 'PHONE' and r ->> 'status' = 'CONFIRMED', 'front desk booking';
  insert into test.ids values ('guest_appt', v_id);
end $$;
select test.expect_error($q$select public.update_appointment_status((select id from test.ids where name = 'pat_appt'), 'CONFIRMED')$q$, 'cannot change');
select test.expect_error($q$insert into public.departments (id, name, code) values ('x', 'x', 'X')$q$, 'row-level security');
select test.expect_error($q$select public.set_user_role('00000000-0000-0000-0000-00000000000b', 'RECEPTIONIST')$q$, 'not allowed');
do $$ begin
  assert (select count(*) from public.audit_logs) = 0, 'receptionist cannot read audit logs';
  assert (select count(*) from public.list_staff()) = 0, 'receptionist cannot list staff';
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- Doctor
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000f","role":"authenticated","aal":"aal2"}';
set role authenticated;
do $$ begin
  assert public.my_doctor_id() = 'doc-101', 'doctor is linked';
  assert (select count(*) from public.appointments) = (select count(*) from public.appointments where doctor_id = 'doc-101'),
    'doctor sees only own appointments';
  assert public.update_appointment_status((select id from test.ids where name = 'guest_appt'), 'COMPLETED') ->> 'status' = 'COMPLETED',
    'doctor completes own appointment';
  insert into public.doctor_leaves (doctor_id, leave_date, reason) values ('doc-101', test.next_dow(3), 'Conference');
  assert (select count(*) from public.get_available_slots('doc-101', test.next_dow(3))) = 0, 'leave blocks all slots';
end $$;
select test.expect_error($q$insert into public.doctor_leaves (doctor_id, leave_date) values ('doc-102', current_date + 3)$q$, 'row-level security');
select test.expect_error($q$select public.update_appointment_status((select id from public.appointments where doctor_id = 'doc-101' and status = 'NEW' limit 1), 'CANCELLED')$q$, 'only mark');
reset role;

-- Same doctor without MFA sees nothing.
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000f","role":"authenticated","aal":"aal1"}';
set role authenticated;
do $$ begin
  assert public.my_doctor_id() is null, 'doctor without MFA is not linked';
  assert (select count(*) from public.appointments) = 0, 'doctor without MFA sees nothing';
end $$;
reset role;

-- ---------------------------------------------------------------------------
-- Hospital admin
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated","aal":"aal2"}';
set role authenticated;
do $$ begin
  update public.doctors set consultation_fee = 500 where id = 'doc-102';
  assert (select consultation_fee from public.doctors where id = 'doc-102') = 500, 'admin edits doctors';
  update public.hospital_info set data = jsonb_set(data, '{phone}', '"+91 80000 00000"');
  perform public.set_user_role('00000000-0000-0000-0000-00000000000b', 'RECEPTIONIST');
  assert (select count(*) from public.list_staff()) = 5, 'admin lists staff';
  assert (select count(*) from public.audit_logs) = 0, 'only super admins read audit logs';
end $$;
select test.expect_error($q$select public.set_user_role('00000000-0000-0000-0000-00000000000b', 'SUPER_ADMIN')$q$, 'not allowed');
select test.expect_error($q$select public.set_user_role('00000000-0000-0000-0000-00000000000e', 'PATIENT')$q$, 'not allowed');
select test.expect_error($q$select public.set_user_role('00000000-0000-0000-0000-00000000000d', 'SUPER_ADMIN')$q$, 'own role');
reset role;

-- ---------------------------------------------------------------------------
-- Super admin
-- ---------------------------------------------------------------------------
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated","aal":"aal2"}';
set role authenticated;
do $$ begin
  assert (select count(*) from public.audit_logs where action = 'ROLE_CHANGED') = 1, 'role change audited';
  assert (select count(*) from public.audit_logs where action = 'UPDATE' and entity = 'doctors'
    and actor_id = '00000000-0000-0000-0000-00000000000d' and actor_role = 'HOSPITAL_ADMIN') = 1, 'content edit audited with actor';
  assert (select count(*) from public.audit_logs where action = 'APPOINTMENT_STATUS_CHANGED') >= 3, 'status changes audited';
  perform public.set_user_role('00000000-0000-0000-0000-00000000000b', 'PATIENT', false);
end $$;
reset role;

-- A deactivated user loses their role immediately.
set request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated","aal":"aal2"}';
set role authenticated;
do $$ begin
  assert public.my_role() is null, 'inactive profile has no role';
end $$;
reset role;

\echo 'All RLS and booking tests passed.'
