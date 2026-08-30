# Google Sheets V1 Appointment Integration

Google Sheets serves as the external V1 appointment persistence engine.

## Sheet Structure (`Appointments` Tab)

| Column Header | Format | Example |
|---|---|---|
| **Appointment ID** | String | `APT-20260825-0001` |
| **Created At** | ISO Timestamp | `2026-08-24T12:00:00.000Z` |
| **Updated At** | ISO Timestamp | `2026-08-24T12:05:00.000Z` |
| **Patient Name** | String | `Ramesh Kumar` |
| **Phone** | Normalized String | `+919876543210` |
| **Department** | String | `Cardiology` |
| **Doctor** | String | `Dr. Rajesh Sharma` |
| **Preferred Date** | YYYY-MM-DD | `2026-08-25` |
| **Preferred Time** | String | `10:00 AM` |
| **Reason** | String | `Routine Heart Checkup` |
| **Source** | String | `WEBSITE` / `VOICE_KANNADA` |
| **Language** | String | `KN` / `EN` |
| **Status** | String | `NEW` / `CONTACTED` / `CONFIRMED` |
| **Notes** | JSON Array | `[{"text":"Patient called"}]` |
| **Agent Session ID**| String | `vsession-1724484000` |

## Local Repository Fallback
If `GOOGLE_SHEETS_ID` is empty or credentials fail, `GoogleSheetsRepository` logs a warning and the system automatically continues writing to `FileRepository` (`backend/data/appointments.json`) without interrupting the patient flow.
