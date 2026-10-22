# Supabase Setup & Deployment

The website, patient portal and staff app all run on Supabase (Postgres, Auth,
Edge Functions). This guide takes a fresh Supabase project to a working
deployment.

```
wecarehospital.in          → public website + patient portal  (frontend, `npm run build`)
staff.wecarehospital.in    → staff app                        (frontend, `npm run build:staff`)
Supabase                   → database + access rules, auth, invite-staff function
backend/ (Express)         → legacy; only the AI voice/telephony webhooks still use it
```

## 1. Create the project and apply the schema

1. Create a project at <https://supabase.com/dashboard> (region: Mumbai `ap-south-1`).
2. Apply the schema, using either:
   - **SQL editor:** paste and run `supabase/migrations/20261018000000_init.sql`, then `supabase/seed.sql`.
   - **CLI:** `supabase link --project-ref <ref>` then `supabase db push` and run `supabase/seed.sql` in the SQL editor.
3. The seeded OPD schedules are placeholders (Mon–Sat, 30-minute slots, 4 patients per slot). Correct each doctor's real hours in the `doctor_schedules` table before going live.

## 2. Configure Auth (Dashboard → Authentication)

| Setting | Value |
|---|---|
| **URL Configuration → Site URL** | `https://wecarehospital.in` |
| **URL Configuration → Redirect URLs** | `https://wecarehospital.in/**`, `https://staff.wecarehospital.in/**` (plus `http://localhost:5173/**`, `http://localhost:5174/**` for development) |
| **Sign In / Providers → Email** | Enabled. Patients receive a 6-digit code. Edit the *Magic Link* email template to include `{{ .Token }}`. |
| **Sign In / Providers → Phone** | Enable with an SMS provider (Twilio, MessageBird, Vonage or Textlocal). In India, SMS needs a DLT-registered sender ID and OTP template. Until that is ready, set `VITE_PATIENT_LOGIN_METHODS=email`. |
| **Multi-Factor → TOTP** | Enabled. **Required:** staff can't see any data without it. |
| **Allow new users to sign up** | Leave on. A new sign-up is always a `PATIENT`; staff roles are only granted by administrators. |
| **Attack Protection** | Turn on CAPTCHA (Cloudflare Turnstile or hCaptcha) for sign-ups once you're in production. |
| **SMTP** | Use a custom SMTP sender (e.g. no-reply@wecarehospital.in). The built-in sender is rate-limited. |

## 3. Deploy the staff invite function

```bash
supabase functions deploy invite-staff
supabase secrets set STAFF_APP_URL=https://staff.wecarehospital.in
```

## 4. Create the first super admin

Nobody can sign up as staff, so the first account is created by hand:

1. Dashboard → Authentication → Users → **Invite user** → enter the owner's email.
2. In the SQL editor:
   ```sql
   update public.profiles
   set role = 'SUPER_ADMIN', full_name = 'Owner Name'
   where email = 'owner@example.com';
   ```
3. The owner opens the invite email, which leads to the staff app. They choose a password and scan the QR code with an authenticator app.
4. Every other staff member is invited from **Staff & Access** in the staff app.

## 5. Deploy the frontends (two Vercel projects, same repo)

Both projects use **Root Directory** `frontend`, and both get the same environment variables:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Project URL (Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | **Publishable / anon** key. Never the service-role key. |
| `VITE_PATIENT_LOGIN_METHODS` | `phone,email` (or `email` until SMS is set up) |

| Project | Build command | Output directory | Domain |
|---|---|---|---|
| Public site | `npm run build` | `dist` | `wecarehospital.in` |
| Staff app | `npm run build:staff` | `dist-staff` | `staff.wecarehospital.in` |

Optional hardening for the staff project: Vercel **Deployment Protection** / password, or put the staff domain behind Cloudflare Access or an IP allow-list for the hospital network.

## 6. Day-to-day operations

- **Staff member leaves:** Staff & Access → *Deactivate*. Access stops on their next request.
- **Lost authenticator phone:** a super admin deletes the user's MFA factor (Dashboard → Authentication → Users → user → MFA factors). The staff member enrols a new one at their next sign-in.
- **Audit trail:** the staff app's *Audit Logs* tab (super admins), or the `audit_logs` table.

## 7. Local development

Run Supabase locally with the CLI (Docker needed). `supabase/config.toml` already enables TOTP MFA and the localhost redirect URLs:

```bash
supabase start            # applies migrations + seed; prints the local API URL and publishable key
supabase functions serve  # serves invite-staff (put STAFF_APP_URL=http://localhost:5174 in supabase/.env)
```

Emails (patient login codes, staff invites) arrive in the local Mailpit inbox at http://127.0.0.1:54324. Create your first super admin as in step 4.

```bash
cd frontend
cp ../.env.example .env.local   # fill in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev          # public site  → http://localhost:5173
npm run dev:staff    # staff app    → http://localhost:5174
```

### Testing the database rules

`supabase/tests/local/run.sh` applies the migration and seed to a throwaway
database on any local PostgreSQL 15+ and runs the access-control tests (guest,
patient, receptionist with and without MFA, doctor, admin, super admin). It
doesn't need Docker or the Supabase CLI:

```bash
supabase/tests/local/run.sh -h localhost -U postgres
```

Run it after every schema change.
