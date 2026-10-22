# We Care Hospital — merged patient and staff platform

Professional navy, white and blue one-page patient website using the original hospital content and imagery, with the newer Supabase-based staff architecture.

## Run
`npm install` then `npm run dev` (patient website).
`npm run dev:staff` (separate staff app).
`npm run build` produces `dist`; `npm run build:staff` produces `dist-staff`.

## Deploy
Deploy only `dist` on the public hospital domain. Deploy `dist-staff` as a separate staff site/domain, with the same SPA rewrite and security headers. Do not expose the source folder or legacy backend as static files. The Sites deployment includes the patient website and lazy-loaded staff access pages. /staff offers three portal entry points: /staff/doctor, /staff/reception and /staff/admin. A standalone staff build is also retained.

Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in each frontend build environment. Never include a service-role key in frontend variables. Apply all SQL migrations in filename order, then seed reviewed hospital content. See SUPABASE_SETUP.md for invitation, administrator bootstrap and redirect URL steps. All staff must enroll MFA.

## Three protected staff experiences
- Doctor: assigned schedule and own appointments.
- Reception: bookings and call follow-up.
- Administration: content and staff administration, with super-admin-only audit access.
The public landing page lazy-loads a separate staff interface chunk only on /staff routes. Knowing a staff URL grants no records: Supabase sessions, active database roles, MFA and Row Level Security govern access. There is no staff self-registration or client role selector.

## Current integration status
No live Supabase project or staff credentials were supplied. The patient page works with the supplied hospital directory; phone and email enquiries remain available. Booking forms and staff features require a configured database and migration deployment. No booking is simulated or saved locally. Staff sign-in is visibly disabled when unconfigured; no records or simulated dashboard sessions are exposed.

## Merge decisions
The newer h-1-main project contains the original public hospital data/assets plus separated staff and patient applications, so it is the integration base. Portal selection chooses a workspace, never an account role. Legacy mock authentication was not reintroduced. The existing backend telephony source is retained under backend and needs separate hosting/configuration; it is not part of the static deployment. The original backend data store was excluded.

## Verification
TypeScript compilation and both Vite production builds passed. Browser checks covered homepage, booking form, Kannada guided conversation and portal access; parsing tests covered Kannada/English phone numbers and valid appointment dates. The additional access-hardening migration fixes NULL-based note permission bypasses and active patient appointment reads. Database policies require execution against the real Supabase environment before handling patient data; they were reviewed but not executed here.

## Before patient launch
Review doctor directory, hospital services, room prices, visiting hours and contact information with the hospital. The source used a US phone number as the hospital contact; this version does not present it as the local emergency line. The supplied Hospital Information & Data Collection Form gives +91 88677 55541 for reception/emergency and +91 93530 61993 for ambulance; these are used throughout. Replace doctor initials with verified portraits when available.

## October 2026 UI and appointment update
All original homepage sections are restored: about, 12 departments, complete doctor directory/details, services, facilities, room categories, patient guide, availability, appointment form, FAQs and contact. The new design uses navy/blue/white, supplied logo, authentic Drive photographs, supplied hospital video and a readable summary of diagnostic facilities. Doctor stock photos are replaced with initials so unrelated people are not presented as hospital staff.

The bilingual assistant supports guided Kannada and English text, browser speech recognition, spoken prompts and a confirmation review. It uses the same booking RPC as the form. Reception sees these records through its existing appointments query, with Realtime refresh plus 60-second polling. The assistant never sends a booking until the patient confirms. Success uses the database's returned reference, token and actual status; no fake booking success is shown.

For natural-language extraction and reliable Kannada spoken replies on devices without Kannada voices, follow ASSISTANT_SETUP.md. The preview's local guided chat works; live appointments, real staff sign-in, cloud speech and natural-language extraction are not activated or end-to-end verified until the hospital provides/configures its backend services. Browser voice requires HTTPS, microphone permission, browser language support and network connectivity. It is not a telephone calling service.

October 2026 visual revision: reference-led rotating hero, two-row navigation and directory search; actual hospital photography in care/infrastructure sections; room prices omitted throughout the public interface and assistant. Promotional flyers are not displayed.
