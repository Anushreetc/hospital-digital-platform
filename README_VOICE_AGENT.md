# Voice Receptionist Setup Guide

⚠️ **ACTION REQUIRED: MANUAL DASHBOARD STEPS** ⚠️
Before this system goes live, you must manually perform the following steps in the n8n UI, Google Cloud Console, and your Voice Platform dashboard (Vapi).

## 1. n8n Credentials & Environment Variables
You need to supply the following values in your n8n environment or credentials:
- **Google Sheets OAuth2**: Set up in Google Cloud Console. Enable the Google Sheets API and create an OAuth Client ID. Add this credential in the n8n UI for the Google Sheets nodes.
- **Gmail OAuth2**: Enable the Gmail API in Google Cloud Console and add the credential in the n8n UI for the Gmail node.
- **Shared Secret**: This workflow uses a shared secret to secure the webhooks. In your n8n environment variables (e.g., `.env` file where n8n is hosted), add:
  `SHARED_SECRET=your_super_secret_key_here`
  *(Alternatively, you can hardcode this in the first Code node of the workflow if you don't have access to env variables).*

## 2. Google Sheets Setup
Ensure you have a Google Sheet named "Clinic Bookings" with the following tabs:
- **Appointments**: Columns `appointment_id`, `name`, `phone`, `date`, `time`, `status`
- **Leads**: Columns `name`, `phone`, `email`, `question`, `date`
- **Config**: Columns `key`, `value`
  *(Add a row in Config: key = `working_hours`, value = `10:00-18:00`)*

## 3. Testing Webhooks Locally via cURL
Before connecting the Voice Agent, test the deterministic n8n webhooks using your n8n base URL (e.g., `https://your-n8n.com/webhook/`):

### Check Availability
```bash
curl -X POST https://your-n8n.com/webhook/check-availability \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: your_super_secret_key_here" \
  -d '{"date": "2026-10-15"}'
```

### Book Appointment
```bash
curl -X POST https://your-n8n.com/webhook/book-appointment \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: your_super_secret_key_here" \
  -d '{"name": "John Doe", "phone": "1234567890", "date": "2026-10-15", "time": "14:00"}'
```

## 4. Go-Live Checklist
- [ ] **Recording Consent**: Ensure your voice assistant's first message or your phone system IVR explicitly mentions that calls are recorded for quality purposes, if legally required.
- [ ] **Human Handoff**: Provide a valid phone number for the `requestHumanAssistance` fallback tool inside Vapi.
- [ ] **Rate Limiting**: Configure a reverse proxy (like Cloudflare or Nginx) in front of your n8n webhooks to prevent spam and rate-limit IP addresses, as n8n doesn't handle rate-limiting natively on webhook nodes.
