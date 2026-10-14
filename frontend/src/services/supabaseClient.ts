import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  'https://cienqtqfgqrdasdpezxe.supabase.co';

const supabaseAnonKey = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  'sb_publishable_N6CtrYpNVc3dEURE_qlX3Q_tx5-eCoC';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://cienqtqfgqrdasdpezxe.supabase.co',
  supabaseAnonKey || 'sb_publishable_N6CtrYpNVc3dEURE_qlX3Q_tx5-eCoC'
);
