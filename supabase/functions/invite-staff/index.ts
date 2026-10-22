// Invites a staff member by email and assigns their role.
//
// Staff accounts are never self-registered. Only an administrator signed in
// with MFA can call this function:
//   - SUPER_ADMIN    may invite any staff role
//   - HOSPITAL_ADMIN may invite DOCTOR and RECEPTIONIST
//
// Deploy: supabase functions deploy invite-staff
// Secrets: supabase secrets set STAFF_APP_URL=https://staff.example.com
import { createClient } from 'jsr:@supabase/supabase-js@2';

type StaffRole = 'DOCTOR' | 'RECEPTIONIST' | 'HOSPITAL_ADMIN' | 'SUPER_ADMIN';
const STAFF_ROLES: StaffRole[] = ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'];

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const staffAppUrl = (Deno.env.get('STAFF_APP_URL') ?? '').replace(/\/$/, '');

const corsHeaders = {
  'Access-Control-Allow-Origin': staffAppUrl || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' });
  if (!staffAppUrl) return json(500, { error: 'STAFF_APP_URL secret is not configured.' });

  const authorization = req.headers.get('Authorization');
  if (!authorization) return json(401, { error: 'Not signed in.' });

  // Check the caller with their own token, so RLS helpers see their session
  // (including the MFA level).
  const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return json(401, { error: 'Not signed in.' });

  const [{ data: isAdmin }, { data: isSuperAdmin }] = await Promise.all([
    caller.rpc('is_admin'),
    caller.rpc('is_super_admin'),
  ]);
  if (!isAdmin) return json(403, { error: 'Only administrators signed in with MFA can invite staff.' });

  let body: { email?: string; fullName?: string; role?: StaffRole; doctorId?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const fullName = (body.fullName ?? '').trim().slice(0, 120);
  const role = body.role;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Enter a valid email address.' });
  if (fullName.length < 2) return json(400, { error: 'Enter the staff member\'s full name.' });
  if (!role || !STAFF_ROLES.includes(role)) return json(400, { error: 'Choose a valid staff role.' });
  if (!isSuperAdmin && (role === 'HOSPITAL_ADMIN' || role === 'SUPER_ADMIN')) {
    return json(403, { error: 'Only a super admin can invite administrators.' });
  }
  if (role === 'DOCTOR' && !body.doctorId) return json(400, { error: 'Choose which doctor profile this account belongs to.' });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  if (role === 'DOCTOR') {
    const { data: doctor } = await admin.from('doctors').select('id, user_id').eq('id', body.doctorId!).maybeSingle();
    if (!doctor) return json(400, { error: 'Doctor profile not found.' });
    if (doctor.user_id) return json(409, { error: 'That doctor profile already has a login.' });
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${staffAppUrl}/welcome`,
    data: { full_name: fullName },
  });
  if (inviteError || !invited.user) {
    return json(400, { error: inviteError?.message ?? 'Could not send the invitation.' });
  }

  const userId = invited.user.id;
  const { error: profileError } = await admin
    .from('profiles')
    .update({ role, full_name: fullName, active: true })
    .eq('id', userId);
  if (profileError) return json(500, { error: 'Invitation sent but the role could not be assigned.' });

  if (role === 'DOCTOR') {
    await admin.from('doctors').update({ user_id: userId }).eq('id', body.doctorId!);
  }

  const { data: actorProfile } = await admin.from('profiles').select('role').eq('id', userData.user.id).single();
  await admin.from('audit_logs').insert({
    actor_id: userData.user.id,
    actor_role: actorProfile?.role ?? null,
    action: 'STAFF_INVITED',
    entity: 'profiles',
    entity_id: userId,
    details: { email, role, doctor_id: body.doctorId ?? null },
  });

  return json(200, { userId, email, role });
});
