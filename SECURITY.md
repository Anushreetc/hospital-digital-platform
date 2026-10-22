# Security Model

## Principles

1. **The database enforces access, not the browser.** Every table has Postgres
   Row Level Security (`supabase/migrations`). The browser holds only the
   publishable key, so a visitor who finds a URL, edits JavaScript or calls the
   API directly still gets only what the rules allow.
2. **Public site and staff app are separate builds on separate domains.** The
   public bundle contains no staff or admin code. Hiding the staff URL isn't
   what protects it (rule 1 does), but it keeps the admin login out of sight.
3. **No self-service staff accounts.** Doctors, receptionists and admins are
   invited by an administrator (`supabase/functions/invite-staff`). A public
   sign-up always creates a `PATIENT`.
4. **MFA for everyone who can see patient data.** Staff and doctor policies
   require an `aal2` session (password + authenticator code). A stolen staff
   password alone shows nothing.

## Who can do what

| Caller | Can read | Can change |
|---|---|---|
| Visitor (not signed in) | Hospital info, active departments/doctors/services/facilities, OPD schedules, slot availability counts | Book an appointment (starts as `NEW`) |
| Patient | Own profile and own appointments | Own name/DOB/gender; book (confirmed); cancel own upcoming appointments |
| Doctor (MFA) | Own appointments and leave | Mark own appointments completed/no-show; add/remove own leave |
| Receptionist (MFA) | All appointments, patient profiles, AI call cases, dashboard stats | Appointment status and notes, call cases, front-desk bookings |
| Hospital admin (MFA) | Everything a receptionist sees, plus the staff list | Site content, doctors, schedules; invite/manage doctors and receptionists |
| Super admin (MFA) | Everything, including the audit log | Everything, including granting admin roles |

## Controls

- **Roles** are stored in `profiles.role`. Users can't write that column; only
  `set_user_role()` can change it, and it checks the caller's own role.
  Deactivating a profile removes access on the next request.
- **Appointments** can't be inserted or updated directly. `book_appointment()`
  and `update_appointment_status()` validate input, enforce slot capacity under
  a lock, apply per-role status transitions, block duplicate bookings and limit
  unverified (guest) bookings to 3 upcoming per mobile number.
- **Patients** sign in with a one-time code (SMS or email). There are no
  patient passwords to leak or reset.
- **Audit log**: role changes, staff invites, appointment creation and status
  changes, and every edit to site content are recorded with actor and role.
- **HTTP headers** (`frontend/vercel.json`): `X-Frame-Options: DENY`, HSTS,
  `nosniff`, a strict referrer policy and a permissions policy. The staff app is
  `noindex`.
- **Secrets**: only the publishable key ships to browsers. The service-role key
  lives only in Edge Function and backend secrets.

## Known follow-ups

- Add CAPTCHA (Turnstile) to guest booking and patient sign-up before launch.
- Move the AI voice/telephony backend onto Supabase (it still writes to local
  JSON files). Until then, voice bookings don't appear in the staff app.
- India's DPDP Act 2023: publish a privacy notice, record consent at booking,
  and define a data-retention period.
