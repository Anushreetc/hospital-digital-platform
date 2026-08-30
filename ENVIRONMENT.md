# Environment Variables Reference

| Variable | Type | Description | Required |
|---|---|---|---|
| `NODE_ENV` | String | `development` or `production` | Yes |
| `PORT` | Number | Server HTTP port (default `5000`) | Yes |
| `FRONTEND_URL` | URL String | CORS allowed origin (default `http://localhost:5173`) | Yes |
| `JWT_SECRET` | String | Min 32-char secret for JWT signing | Yes |
| `JWT_EXPIRES_IN` | String | Token validity duration (e.g. `7d`) | Yes |
| `RATE_LIMIT_WINDOW_MS` | Number | Rate limit window in ms (default `900000`) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Number | Max requests per IP in window (default `100`) | No |
| `GOOGLE_SHEETS_ID` | String | Google Spreadsheet ID for V1 sync | Optional |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | String | Service Account email | Optional |
| `GOOGLE_PRIVATE_KEY` | String | Service Account RSA private key | Optional |
