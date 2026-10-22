import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const FullPageLoader: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 text-slate-600">
    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
    <div className="text-sm font-semibold">{label}</div>
  </div>
);

export const FullPageError: React.FC<{ title: string; message: string; action?: React.ReactNode }> = ({ title, message, action }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
      <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-600">{message}</p>
      {action}
    </div>
  </div>
);

export const NotConfigured: React.FC = () => (
  <FullPageError
    title="Staff access is not available yet"
    message="Secure sign-in has not been connected. Contact your hospital administrator."
  />
);
