# Environment Variables Reference

## Frontend (public site and staff app)

| Variable | Description | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key. Never the service-role key. | Yes |
| `VITE_PATIENT_LOGIN_METHODS` | Patient one-time-code channels: `phone,email`, `email` or `phone` | No (default `phone,email`) |

## Supabase Edge Function secrets

| Variable | Description |
|---|---|
| `STAFF_APP_URL` | Staff app origin, e.g. `https://staff.wecarehospital.in` (invite links and CORS) |

## Legacy backend (voice / telephony)

| Variable | Type | Description | Required |
|---|---|---|---|
| `NODE_ENV` | String | `development` or `production` | Yes |
| `PORT` | Number | Server HTTP port (default `5000`) | Yes |
| `FRONTEND_URL` | URL String | CORS allowed origin (default `http://localhost:5173`) | Yes |
| `JWT_SECRET` | String | Min 32-char secret for JWT signing (startup fails in production without it) | Yes |
| `SEED_ADMIN_PASSWORD` | String | Password for seeded accounts in local dev; random if unset | No |
| `JWT_EXPIRES_IN` | String | Token validity duration (e.g. `7d`) | Yes |
| `RATE_LIMIT_WINDOW_MS` | Number | Rate limit window in ms (default `900000`) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Number | Max requests per IP in window (default `100`) | No |
| `GOOGLE_SHEETS_ID` | String | Google Spreadsheet ID for V1 sync | Optional |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | String | Service Account email | Optional |
| `GOOGLE_PRIVATE_KEY` | String | Service Account RSA private key | Optional |
