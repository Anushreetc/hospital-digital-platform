// Server tools for the ElevenLabs voice agent. ElevenLabs calls
//   POST /voice-tools/<tool>   with header x-voice-secret: <Vault voice_tools_secret>
// Bookings go through the same capacity-checked book_appointment RPC as the
// website form, as a guest booking with source VOICE_AI (status NEW, so
// reception confirms it). Tool errors are returned as { ok: false, error } with
// HTTP 200 so the agent can read them to the caller.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

const url = Deno.env.get('SUPABASE_URL')!;
const anon = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { auth: { persistSession: false } });
const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

let cachedSecret: string | null = null;
async function toolsSecret(): Promise<string | null> {
  if (cachedSecret) return cachedSecret;
  const { data, error } = await service.rpc('voice_agent_secret', { p_name: 'voice_tools_secret' });
  if (error || !data) return null;
  cachedSecret = data as string;
  return cachedSecret;
}

function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// "13:30:00" -> "1:30 PM"
function timeLabel(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

// Accepts "10:30", "10:30:00", "10:30 AM", "2 PM"; returns "HH:MM:SS" or ''.
function normaliseTime(input: string): string {
  const m = input.trim().toUpperCase().match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)?$/);
  if (!m) return '';
  let h = Number(m[1]);
  const min = Number(m[2] ?? '0');
  if (m[3] === 'PM' && h < 12) h += 12;
  if (m[3] === 'AM' && h === 12) h = 0;
  if (h > 23 || min > 59) return '';
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
}

const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

async function hospitalToday(): Promise<string> {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function openSlots(doctorId: string, date: string) {
  const { data, error } = await anon.rpc('get_available_slots', { p_doctor_id: doctorId, p_date: date });
  if (error) throw error;
  return (data ?? [])
    .filter((s: { available: number }) => s.available > 0)
    .map((s: { slot_time: string; available: number }) => ({ slot_time: s.slot_time, label: timeLabel(s.slot_time), available: s.available }));
}

const tools: Record<string, (body: Record<string, unknown>) => Promise<unknown>> = {
  async hospital_info() {
    const { data, error } = await anon.from('hospital_info').select('data').single();
    if (error) throw error;
    const info = data.data as Record<string, unknown>;
    const keep = ['name', 'phone', 'emergencyPhone', 'ambulancePhone', 'whatsAppNumber', 'email', 'address', 'visitingHours',
      'operatingHours', 'insuranceInfo', 'supportedLanguages'];
    return { ok: true, today: await hospitalToday(), info: Object.fromEntries(keep.filter((k) => k in info).map((k) => [k, info[k]])) };
  },

  async search_doctors(body) {
    const q = str(body.query, 100).toLowerCase().replace(/^dr\.?\s*/, '');
    const { data, error } = await anon
      .from('doctors')
      .select('id, name, specialization, qualification, languages, department:departments(name)')
      .eq('active', true)
      .order('display_order');
    if (error) throw error;
    const doctors = (data ?? []).map((d: any) => ({
      doctor_id: d.id, name: d.name, specialization: d.specialization, department: d.department?.name ?? null,
      qualification: d.qualification, languages: d.languages,
    }));
    if (!q) return { ok: true, doctors };
    const words = q.split(/\s+/).filter((w) => w.length > 2);
    const matches = doctors.filter((d) => {
      const hay = `${d.name} ${d.specialization} ${d.department ?? ''}`.toLowerCase();
      return hay.includes(q) || words.some((w) => hay.includes(w));
    });
    return matches.length
      ? { ok: true, doctors: matches }
      : { ok: true, doctors, note: 'No exact match; this is the full list of doctors. Ask the caller to choose.' };
  },

  async check_slots(body) {
    const doctorId = str(body.doctor_id, 50);
    const date = str(body.date, 10);
    if (!doctorId || !isDate(date)) return { ok: false, error: 'doctor_id and date (YYYY-MM-DD) are required.' };
    const today = await hospitalToday();
    if (date < today) return { ok: false, error: `That date is in the past. Today is ${today}.` };
    const slots = await openSlots(doctorId, date);
    if (slots.length) return { ok: true, date, slots };
    // Nothing that day: offer the next days that have openings.
    const alternatives: Array<{ date: string; first_slot: string; open_slots: number }> = [];
    for (let i = 1; i <= 14 && alternatives.length < 3; i++) {
      const d = addDays(date, i);
      const s = await openSlots(doctorId, d);
      if (s.length) alternatives.push({ date: d, first_slot: s[0].label, open_slots: s.length });
    }
    return { ok: true, date, slots: [], message: 'No open OPD slots for this doctor on that date.', next_available: alternatives };
  },

  async book_appointment(body) {
    const conversationId = str(body.conversation_id, 100);
    const doctorId = str(body.doctor_id, 50);
    const date = str(body.date, 10);
    const slotTime = normaliseTime(str(body.slot_time, 20));
    const phone = str(body.patient_phone, 20).replace(/\D/g, '').slice(-10);
    const language = str(body.language, 2).toUpperCase() === 'KN' ? 'KN' : 'EN';
    if (!conversationId) return { ok: false, error: 'conversation_id is required.' };
    if (!doctorId || !isDate(date) || !slotTime) return { ok: false, error: 'doctor_id, date (YYYY-MM-DD) and slot_time are required.' };

    // Same details in the same conversation -> same booking (safe retries).
    const idempotencyKey = `voice-${conversationId}-${doctorId}-${date}-${slotTime}-${phone}`;
    const { data, error } = await anon.rpc('book_appointment', {
      p_doctor_id: doctorId,
      p_date: date,
      p_slot_time: slotTime,
      p_patient_name: str(body.patient_name, 120),
      p_patient_phone: phone,
      p_reason: str(body.reason, 500) || 'OPD consultation',
      p_additional_message: null,
      p_patient_email: null,
      p_source: 'VOICE_AI',
      p_language: language,
      p_idempotency_key: idempotencyKey,
    });
    if (error) return { ok: false, error: error.message };
    const a = data as Record<string, any>;
    return {
      ok: true,
      booking: {
        reference: a.code, token_number: a.token_number, status: a.status, doctor_name: a.doctor_name,
        department: a.department_name, date: a.appointment_date, time: timeLabel(a.slot_time), patient_name: a.patient_name,
      },
      note: 'The request is recorded. Reception will call the patient to confirm. Read the reference code and token number to the caller.',
    };
  },
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  const expected = await toolsSecret();
  const given = req.headers.get('x-voice-secret') ?? '';
  if (!expected || !safeEqual(given, expected)) return json({ ok: false, error: 'Unauthorized' }, 401);

  const tool = new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? '';
  const handler = tools[tool];
  if (!handler) return json({ ok: false, error: `Unknown tool ${tool}` }, 404);

  let body: Record<string, unknown> = {};
  try {
    const text = await req.text();
    if (text.length > 8000) return json({ ok: false, error: 'Request too large' }, 413);
    body = text ? JSON.parse(text) : {};
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  try {
    return json(await handler(body));
  } catch (e) {
    console.error(`[voice-tools] ${tool}`, e);
    return json({ ok: false, error: 'The hospital system is not responding. Offer to have reception call back.' });
  }
});
