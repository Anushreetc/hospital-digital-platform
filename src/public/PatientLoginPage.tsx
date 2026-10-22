import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, ShieldCheck, Smartphone } from 'lucide-react';
import { supabase, errorMessage } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type Method = 'phone' | 'email';

const env = (import.meta as any).env ?? {};
// Which one-time-code channels are offered. SMS needs an SMS provider (and, in
// India, DLT template registration) configured in Supabase Auth.
const METHODS: Method[] = String(env.VITE_PATIENT_LOGIN_METHODS ?? 'phone,email')
  .split(',')
  .map((m: string) => m.trim())
  .filter((m: string): m is Method => m === 'phone' || m === 'email');

const inputClass =
  'w-full min-h-[44px] bg-slate-50 border border-slate-300 text-slate-900 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500';

// Patients sign in with a one-time code; there are no patient passwords to
// leak or reset. An account is created automatically on first sign-in.
export const PatientLoginPage: React.FC = () => {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState<Method>(METHODS[0] ?? 'email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && session && profile?.role === 'PATIENT') return <Navigate to="/my" replace />;

  const e164Phone = () => `+91${phone.replace(/\D/g, '').slice(-10)}`;

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (method === 'phone' && !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10))) {
      return setError('Enter a valid 10-digit mobile number.');
    }
    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError('Enter a valid email address.');
    }
    setBusy(true);
    try {
      const { error: otpError } =
        method === 'phone'
          ? await supabase.auth.signInWithOtp({ phone: e164Phone() })
          : await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase() });
      if (otpError) throw otpError;
      setCodeSentTo(method === 'phone' ? e164Phone() : email.trim().toLowerCase());
      setCode('');
    } catch (err) {
      setError(errorMessage(err, 'Could not send the code. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code.');
    setBusy(true);
    try {
      const { error: verifyError } =
        method === 'phone'
          ? await supabase.auth.verifyOtp({ phone: codeSentTo!, token: code.trim(), type: 'sms' })
          : await supabase.auth.verifyOtp({ email: codeSentTo!, token: code.trim(), type: 'email' });
      if (verifyError) throw verifyError;
      navigate('/my', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'That code is not valid. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          Back to website
        </Link>

        <div className="flex items-center gap-3">
          <img src="/images/hospital_logo.png" alt="" className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-100" />
          <div>
            <h1 className="text-xl font-black text-slate-900">Patient Login</h1>
            <p className="text-xs text-slate-500">View and manage your appointments</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {!codeSentTo ? (
          <form onSubmit={sendCode} className="space-y-4">
            {METHODS.length > 1 && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                {METHODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMethod(m); setError(null); }}
                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${method === m ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}
                  >
                    {m === 'phone' ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    {m === 'phone' ? 'Mobile number' : 'Email'}
                  </button>
                ))}
              </div>
            )}

            {method === 'phone' ? (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Mobile number</span>
                <div className="flex gap-2">
                  <span className="min-h-[44px] px-3 flex items-center bg-slate-100 border border-slate-300 rounded-xl text-sm font-semibold text-slate-600">+91</span>
                  <input type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
                </div>
              </label>
            ) : (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Email address</span>
                <input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              </label>
            )}

            <button type="submit" disabled={busy} className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Send login code
            </button>
            <p className="text-[11px] text-slate-500 text-center">New here? An account is created for you when you verify the code.</p>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-sm text-slate-600">
              We sent a 6-digit code to <strong className="text-slate-900">{codeSentTo}</strong>.
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono`}
              autoFocus
            />
            <button type="submit" disabled={busy} className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Verify and continue
            </button>
            <button type="button" onClick={() => { setCodeSentTo(null); setError(null); }} className="w-full text-xs font-bold text-slate-500 hover:text-slate-800">
              Use a different {method === 'phone' ? 'number' : 'email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
