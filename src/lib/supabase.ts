import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env ?? {};
const supabaseUrl: string = env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey: string = env.VITE_SUPABASE_ANON_KEY ?? '';

// Only the publishable (anon) key belongs in the browser. Access control is
// enforced by Row Level Security in supabase/migrations.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'missing-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

// Turns Supabase/PostgREST errors into a message safe to show to users.
export const errorMessage = (err: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
    const msg = (err as any).message as string;
    if (/failed to fetch|networkerror/i.test(msg)) return 'Could not reach the server. Check your connection and try again.';
    return msg;
  }
  return fallback;
};
