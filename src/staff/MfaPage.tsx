import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase, errorMessage } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { StaffAlert, StaffCard, staffInputClass } from './StaffCard';

interface Props {
  /** 'enroll' when the account has no authenticator yet, 'verify' otherwise. */
  mode: 'enroll' | 'verify';
  onVerified: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

// Every staff session must be upgraded to aal2 with a TOTP code; RLS rejects
// staff access otherwise.
export const MfaPage: React.FC<Props> = ({ mode, onVerified, onSignOut }) => {
  const { session } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const prepare = async () => {
      try {
        const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
        if (listError) throw listError;
        if (mode === 'verify') {
          const verified = factors.totp[0];
          if (!verified) throw new Error('No authenticator found for this account. Contact a super admin.');
          if (!cancelled) setFactorId(verified.id);
          return;
        }
        // Remove half-finished enrolments from an earlier attempt, then start fresh.
        for (const f of factors.all.filter(f => f.factor_type === 'totp' && f.status === 'unverified')) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          // Names must be unique per user; a random suffix avoids clashes with leftovers.
          friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)} ${Math.random().toString(36).slice(2, 6)}`,
        });
        if (enrollError) throw enrollError;
        if (!cancelled) {
          setFactorId(data.id);
          setQrCode(data.totp.qr_code);
          setSecret(data.totp.secret);
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      } finally {
        if (!cancelled) setPreparing(false);
      }
    };
    prepare();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code from your authenticator app.');
    setError(null);
    setBusy(true);
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (verifyError) throw verifyError;
      await onVerified();
    } catch (err) {
      setError(errorMessage(err, 'That code did not work. Try the newest code.'));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <StaffCard
      title={mode === 'enroll' ? 'Set up two-step verification' : 'Two-step verification'}
      subtitle={session?.user.email ?? undefined}
    >
      {mode === 'enroll' ? (
        <p className="text-sm text-slate-600">
          Staff accounts can see patient information, so a second step is required. Scan this QR code with an authenticator app, then enter the 6-digit code it shows.
        </p>
      ) : (
        <p className="text-sm text-slate-600">Enter the 6-digit code from your authenticator app.</p>
      )}

      {error && <StaffAlert>{error}</StaffAlert>}

      {preparing ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {mode === 'enroll' && qrCode && (
            <div className="flex flex-col items-center gap-2">
              <img src={qrCode} alt="Authenticator QR code" className="w-48 h-48 border border-slate-200 rounded-xl p-2 bg-white" />
              {secret && (
                <details className="text-[11px] text-slate-500 w-full">
                  <summary className="cursor-pointer text-center">Can't scan? Enter this key manually</summary>
                  <code className="block mt-2 p-2 bg-slate-100 rounded-lg break-all text-center font-mono text-slate-800">{secret}</code>
                </details>
              )}
            </div>
          )}
          <form onSubmit={verify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${staffInputClass} text-center text-2xl tracking-[0.5em] font-mono`}
              autoFocus
              disabled={!factorId}
            />
            <button type="submit" disabled={busy || !factorId} className="w-full min-h-[48px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify
            </button>
          </form>
        </>
      )}

      <button type="button" onClick={onSignOut} className="w-full text-xs font-bold text-slate-500 hover:text-slate-800">
        Sign out
      </button>
      {mode === 'verify' && (
        <p className="text-[11px] text-slate-400 text-center">Lost your phone? A super admin can reset your two-step verification.</p>
      )}
    </StaffCard>
  );
};
