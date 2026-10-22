import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase, errorMessage } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { StaffAlert, StaffCard, staffInputClass } from './StaffCard';

const MIN_LENGTH = 12;

// Shown after following an invitation or password-reset link.
export const SetPasswordPage: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} characters.`);
    if (password !== confirmPassword) return setError('The passwords do not match.');
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) return setError(errorMessage(updateError));
    onDone();
  };

  return (
    <StaffCard title="Choose your password" subtitle={session?.user.email ?? undefined}>
      <p className="text-sm text-slate-600">
        Pick a password of at least {MIN_LENGTH} characters. Next, you'll link an authenticator app (Google Authenticator, Microsoft Authenticator or similar).
      </p>
      {error && <StaffAlert>{error}</StaffAlert>}
      <form onSubmit={save} className="space-y-4">
        <input type="password" autoComplete="new-password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} className={staffInputClass} required />
        <input type="password" autoComplete="new-password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={staffInputClass} required />
        <button type="submit" disabled={busy} className="w-full min-h-[48px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Save password
        </button>
      </form>
    </StaffCard>
  );
};
