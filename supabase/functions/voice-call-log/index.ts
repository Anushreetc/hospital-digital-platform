// ElevenLabs post-call webhook -> public.voice_calls, shown in Reception's
// "AI Receptionist Desk". The request must carry a valid ElevenLabs-Signature
// (HMAC-SHA256 of "<timestamp>.<raw body>" with the Vault secret
// voice_webhook_secret). A booking made during the conversation by voice-tools
// is linked through its idempotency key "voice-<conversation_id>-...".
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false },
});

const TOLERANCE_SECS = 30 * 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let cachedSecret: string | null = null;
async function webhookSecret(): Promise<string | null> {
  if (cachedSecret) return cachedSecret;
  const { data, error } = await db.rpc('voice_agent_secret', { p_name: 'voice_webhook_secret' });
  if (error || !data) return null;
  cachedSecret = data as string;
  return cachedSecret;
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verify(header: string | null, raw: string, secret: string): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=') as [string, string]));
  const t = Number(parts.t);
  if (!t || !parts.v0 || Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECS) return false;
  return safeEqual(await hmacHex(secret, `${t}.${raw}`), parts.v0);
}

const mmss = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;

// data_collection_results entries look like { value, rationale, ... }.
const collected = (results: any, key: string): string | undefined => {
  const v = results?.[key]?.value;
  return v === null || v === undefined || v === '' ? undefined : String(v).trim();
};

const INTENTS = ['APPOINTMENT_BOOKING', 'EMERGENCY_QUERY', 'GENERAL_OPD', 'DOCTOR_ENQUIRY'];

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const secret = await webhookSecret();
  if (!secret) return json({ error: 'Webhook secret not configured' }, 503);

  const raw = await req.text();
  if (!(await verify(req.headers.get('elevenlabs-signature'), raw, secret))) return json({ error: 'Invalid signature' }, 401);

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  // Audio and other event types are acknowledged and ignored.
  if (event?.type !== 'post_call_transcription') return json({ ok: true, ignored: event?.type ?? null });

  const data = event.data ?? {};
  const conversationId: string | undefined = data.conversation_id;
  if (!conversationId) return json({ error: 'Missing conversation_id' }, 400);

  const meta = data.metadata ?? {};
  const results = data.analysis?.data_collection_results ?? {};

  const turns = (Array.isArray(data.transcript) ? data.transcript : [])
    .filter((t: any) => typeof t?.message === 'string' && t.message.trim())
    .map((t: any) => ({
      speaker: t.role === 'agent' ? 'AI_RECEPTIONIST' : 'PATIENT',
      text: t.message.trim(),
      timestamp: mmss(Number(t.time_in_call_secs) || 0),
    }));
  const transcript = turns.map((t: any) => `[${t.timestamp}] ${t.speaker === 'AI_RECEPTIONIST' ? 'Agent' : 'Caller'}: ${t.text}`).join('\n');

  // Booking made in this conversation, if any (latest wins).
  const keyPrefix = `voice-${conversationId}-`.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data: appt, error: apptError } = await db
    .from('appointments')
    .select('id, patient_name, patient_phone, language')
    .like('idempotency_key', `${keyPrefix}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (apptError) {
    console.error('[voice-call-log] appointment lookup', apptError);
    return json({ error: 'Lookup failed' }, 500);
  }

  const patientText = turns.filter((t: any) => t.speaker === 'PATIENT').map((t: any) => t.text).join(' ');
  const hasKannada = /[ಀ-೿]/.test(patientText);
  const collectedLang = collected(results, 'language')?.toUpperCase();
  const language = appt?.language ?? (collectedLang === 'KN' || collectedLang === 'EN' ? collectedLang : hasKannada ? 'KN' : 'EN');

  const collectedIntent = collected(results, 'intent')?.toUpperCase();
  const intent = appt ? 'APPOINTMENT_BOOKING' : INTENTS.includes(collectedIntent ?? '') ? collectedIntent : 'GENERAL_OPD';

  const outcome = appt
    ? 'APPOINTMENT_CREATED'
    : intent === 'EMERGENCY_QUERY'
      ? 'EMERGENCY_ESCALATED'
      : data.status === 'failed'
        ? 'TECHNICAL_FAILURE'
        : data.analysis?.call_successful === 'success'
          ? 'INFORMATION_PROVIDED'
          : 'CALL_ENDED';

  const startSecs = Number(meta.start_time_unix_secs) || Math.floor(Date.now() / 1000);
  const duration = Number(meta.call_duration_secs) || 0;
  const phone =
    appt?.patient_phone ??
    collected(results, 'patient_phone')?.replace(/\D/g, '').slice(-10) ??
    meta.phone_call?.external_number ??
    'WEB';

  const row = {
    call_id: conversationId,
    caller_name: appt?.patient_name ?? collected(results, 'patient_name') ?? null,
    phone_number: phone || 'WEB',
    started_at: new Date(startSecs * 1000).toISOString(),
    ended_at: new Date((startSecs + duration) * 1000).toISOString(),
    duration_seconds: duration,
    language,
    status: data.status === 'failed' ? 'FAILED' : 'COMPLETED',
    intent,
    outcome,
    summary: data.analysis?.transcript_summary ?? null,
    transcript: transcript || null,
    dialogue_turns: turns,
    appointment_id: appt?.id ?? null,
  };

  // Upsert so a re-delivered webhook updates the same case; reception's own
  // fields (case_status, notes, assignment) are not in the row and stay as they are.
  const { error } = await db.from('voice_calls').upsert(row, { onConflict: 'call_id' });
  if (error) {
    console.error('[voice-call-log] upsert', error);
    return json({ error: 'Save failed' }, 500);
  }
  return json({ ok: true });
});
