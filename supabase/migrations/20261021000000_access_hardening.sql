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
