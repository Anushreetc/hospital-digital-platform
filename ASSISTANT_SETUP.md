# Activate reception bookings and Kannada/English assistance

## Shared appointment database
1. Configure the hospital's Supabase project using SUPABASE_SETUP.md. Run all migrations in filename order, including `20261022000000_assistant_reception.sql`, and review/seed the hospital catalogue and doctor schedules. Do not reset an existing production database.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend build. Use the public/publishable key, never a service-role key. Rebuild and redeploy.
3. Invite the receptionist, doctor and administrators with their database roles; enroll MFA. There are no demo passwords or public staff registration.
4. The form and assistant both call `public.book_appointment`; records appear under Reception → Appointments. Guests and voice bookings await reception confirmation. Capacity and duplicate checks run in SQL. Realtime updates use the authenticated role's RLS; a 60-second refresh is retained if Realtime is unavailable.

## Guided chat and browser voice
The default assistant runs without an AI account. It asks for name, phone, doctor, date, available time and reason in English or Kannada. Browser recognition uses `en-IN` or `kn-IN`. It accepts Kannada digits and common relative dates. The patient reviews the details and explicitly confirms before submission. It falls back to typing if microphone access or recognition is unavailable. English/Kannada speech synthesis depends on installed device voices unless cloud speech below is enabled.

Voice input uses the browser's speech service, which may process audio remotely. The UI explains this before activation. Conversations are held in component memory, not localStorage. The booking details necessary for care are persisted only upon confirmed submission. This is appointment support, not diagnosis or emergency triage.

## Natural conversation (optional OpenAI integration)
The provided `supabase/functions/appointment-assistant/index.ts` extracts multiple fields and corrections from normal Kannada/English sentences. It does not execute bookings, choose treatment or generate a fake booking result.

Configure these as **Supabase Edge Function secrets**, never VITE variables or committed files:
- `OPENAI_API_KEY`: hospital-approved API account.
- `OPENAI_MODEL`: a model currently supported by Chat Completions with JSON mode. Choose and validate in the hospital account.
- `ASSISTANT_ALLOWED_ORIGINS`: comma-separated exact frontend origins, no trailing slash; include the actual deployed hospital domain and authorised preview origin only.
- `ASSISTANT_RATE_LIMIT_SALT`: long randomly generated secret used to hash request IPs for rate limiting.

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the function runtime. The service key is used only server-side to read the public doctor catalogue and consume the quota. The function exposes neither staff records nor a booking capability. Its quota table denies anon/authenticated access and retains only salted quota buckets, not transcripts.

Deploy with `supabase functions deploy appointment-assistant` using the hospital's authenticated CLI project. Keep JWT verification enabled (the browser sends the configured Supabase public token). Set `VITE_ENABLE_AI_ASSISTANT=true`, rebuild and redeploy. Use the assistant's explicit AI consent or voice consent before messages are sent to the provider. No API key belongs in browser code.

## Consistent Kannada spoken replies (optional Azure Speech)
Configure Edge Function secrets:
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION` (the region for the hospital's Azure Speech resource, e.g. centralindia)
- The same allowed origins and rate-limit salt listed above.

Set `VITE_ENABLE_CLOUD_SPEECH=true` and rebuild. The function uses Azure's `kn-IN-SapnaNeural` for Kannada and `en-IN-NeerjaNeural` for English. Audio is returned to the browser; the key remains server-side. Cloud speech is separate from OpenAI extraction and can be enabled independently. Spoken responses are disclosed as automated. On playback or provider failure, the text remains available and the patient can continue by typing or tapping the microphone.

## Required activation check in the hospital's staging environment
- Verify real Kannada microphone recognition and spoken replies on the actual Android/iPhone/desktop devices the hospital intends to support; test permission denial and missing voices.
- Confirm a test appointment in Kannada and another via the form. Check the returned ID matches the Reception → Appointments row, including date, IST slot, doctor, patient phone, source and language. Delete/cancel test data through authorised staff workflows.
- Verify simultaneous attempts on a nearly full slot, duplicate submissions/retries and a lost network response. Reusing the same attempt key must return the same record.
- Verify unauthenticated visitors, inactive users, patient accounts and wrong-role staff cannot read appointment records or enter staff workspaces. Verify MFA enforcement.
- Review provider privacy/data retention, billing controls and consent wording for the hospital's launch. The per-IP function limit is 40 requests per 10 minutes; a voice turn may use two requests. Configure additional platform quotas as appropriate.

## What has and has not been verified here
Both application builds and local guided conversation/date/phone tests were run. The source includes SQL and Edge Function integration, but no hospital Supabase credentials, OpenAI account or Azure Speech resource were supplied. No live patient record was created; no cloud AI/speech request or real reception end-to-end test was performed. Finish the activation checks above before public patient use.

## Microphone troubleshooting
Voice input starts directly after consent, independently of spoken playback. Allow microphone access for the HTTPS site and in device settings. Open the site directly rather than inside an embedded preview. Unsupported browsers, blocked access, missing devices and speech-service network errors now show distinct recovery instructions. Speech recognition availability, including Kannada, depends on the browser service. No live device audio was available in the automated build environment; verify real English and Kannada speech on the target device. Booking still requires the configured Supabase backend.
