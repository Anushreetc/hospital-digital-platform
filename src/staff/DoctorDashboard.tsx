import React, { useState, useEffect } from 'react';
import { Appointment, AuthUser, DoctorLeave } from '../types';
import { accountApi } from '../services/db';
import { errorMessage } from '../lib/supabase';
import { Stethoscope, CheckCircle2, UserX, LogOut, Calendar, Users, LayoutDashboard, CalendarOff, Trash2, Loader2 } from 'lucide-react';

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

const REFRESH_INTERVAL_MS = 60_000;

const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts);

export const DoctorDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [savingLeave, setSavingLeave] = useState(false);

  const todayStr = todayIso();

  const loadDoctorData = async () => {
    try {
      const [appts, myLeaves] = await Promise.all([
        accountApi.getAppointments({ from: todayStr }),
        user.doctorId ? accountApi.getLeaves(user.doctorId) : Promise.resolve([]),
      ]);
      setAppointments(appts);
      setLeaves(myLeaves.filter(l => l.date >= todayStr));
      setError(null);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your schedule.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
    const timer = window.setInterval(loadDoctorData, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  const handleStatusUpdate = async (id: string, status: 'COMPLETED' | 'NO_SHOW') => {
    try {
      await accountApi.updateAppointmentStatus(id, status);
      await loadDoctorData();
    } catch (err) {
      alert(errorMessage(err, 'Failed to update status.'));
    }
  };

  const addLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.doctorId || !leaveDate) return;
    setSavingLeave(true);
    try {
      await accountApi.addLeave(user.doctorId, leaveDate, leaveReason);
      setLeaveDate('');
      setLeaveReason('');
      await loadDoctorData();
    } catch (err) {
      alert(errorMessage(err, 'Could not save leave.'));
    } finally {
      setSavingLeave(false);
    }
  };

  const removeLeave = async (id: string) => {
    try {
      await accountApi.removeLeave(id);
      await loadDoctorData();
    } catch (err) {
      alert(errorMessage(err, 'Could not remove leave.'));
    }
  };

  const byToken = (a: Appointment, b: Appointment) => Number(a.tokenNumber) - Number(b.tokenNumber);
  const todayAppts = appointments.filter(a => a.preferredDate === todayStr);
  const queue = todayAppts.filter(a => a.status === 'CONFIRMED').sort(byToken);
  const awaitingFrontDesk = todayAppts.filter(a => a.status === 'NEW' || a.status === 'CONTACTED').length;
  const upcoming = appointments
    .filter(a => a.preferredDate > todayStr && a.status !== 'CANCELLED')
    .sort((a, b) => (a.preferredDate + a.preferredTime).localeCompare(b.preferredDate + b.preferredTime));

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-800 flex flex-col pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-900 leading-tight">We Care Staff</h1>
              <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600">Doctor Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{formatDate(todayStr, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" aria-label="Sign out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {!user.doctorId && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm font-semibold">
            Your login is not linked to a doctor profile yet. Ask a hospital admin to link it.
          </div>
        )}
        {error && (
          <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label="Waiting Today" value={queue.length} icon={<Users className="w-7 h-7" />} tone="blue" />
          <MetricCard label="Completed Today" value={todayAppts.filter(a => a.status === 'COMPLETED').length} icon={<CheckCircle2 className="w-7 h-7" />} tone="emerald" />
          <MetricCard label="Upcoming Bookings" value={upcoming.length} icon={<Calendar className="w-7 h-7" />} tone="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-slate-400" />
                Today's Patient Queue
              </h2>
              {awaitingFrontDesk > 0 && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                  {awaitingFrontDesk} awaiting front-desk confirmation
                </span>
              )}
            </div>

            {loading ? (
              <div className="animate-pulse h-64 bg-slate-200 rounded-3xl w-full"></div>
            ) : queue.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Queue is clear</h3>
                <p className="text-slate-500 mt-2">No confirmed patients are waiting today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((appt, idx) => (
                  <div key={appt.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden">
                    {idx === 0 && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-slate-900 text-white font-black px-3 py-1 rounded-lg text-xs">Token {appt.tokenNumber}</span>
                        <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider">{appt.preferredTime}</span>
                        {idx === 0 && <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-xs">NEXT</span>}
                      </div>
                      <h4 className="text-xl font-black text-slate-900">{appt.patientName}</h4>
                      <p className="text-slate-500 text-sm mt-1">Reason: <span className="font-medium text-slate-700">{appt.reason}</span></p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5" />
                        Complete
                      </button>
                      <button onClick={() => handleStatusUpdate(appt.id, 'NO_SHOW')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-4 py-3 rounded-xl font-bold transition-all">
                        <UserX className="w-5 h-5" />
                        No-show
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <CalendarOff className="w-5 h-5 text-rose-500" />
                My Leave Days
              </h3>
              <p className="text-xs text-slate-500">Patients cannot book you on these dates.</p>
              <form onSubmit={addLeave} className="space-y-2">
                <input type="date" min={todayStr} value={leaveDate} onChange={e => setLeaveDate(e.target.value)} required disabled={!user.doctorId} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm" />
                <input type="text" placeholder="Reason (optional)" value={leaveReason} onChange={e => setLeaveReason(e.target.value)} maxLength={200} disabled={!user.doctorId} className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm" />
                <button type="submit" disabled={savingLeave || !user.doctorId} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                  {savingLeave && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add leave day
                </button>
              </form>
              <ul className="divide-y divide-slate-100">
                {leaves.map(l => (
                  <li key={l.id} className="py-2 flex items-center justify-between text-sm">
                    <span>
                      <span className="font-bold text-slate-900">{formatDate(l.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                      {l.reason && <span className="text-slate-500"> · {l.reason}</span>}
                    </span>
                    <button onClick={() => removeLeave(l.id)} className="p-1.5 text-slate-400 hover:text-rose-600" aria-label="Remove leave day">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {leaves.length === 0 && <li className="py-2 text-xs text-slate-400">No upcoming leave.</li>}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Upcoming Bookings</h3>
              <div className="space-y-3">
                {upcoming.slice(0, 6).map(appt => (
                  <div key={appt.id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-600 font-bold shrink-0 leading-none">
                      <span className="text-[10px] uppercase">{formatDate(appt.preferredDate, { month: 'short' })}</span>
                      <span>{formatDate(appt.preferredDate, { day: 'numeric' })}</span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 truncate">{appt.patientName}</p>
                      <p className="text-xs text-slate-500">{appt.preferredTime} · Token {appt.tokenNumber}</p>
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No upcoming bookings.</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
};

const MetricCard: React.FC<{ label: string; value: number; icon: React.ReactNode; tone: keyof typeof TONES }> = ({ label, value, icon, tone }) => (
  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm font-bold text-slate-500 mb-1">{label}</p>
      <h3 className="text-4xl font-black text-slate-900">{value}</h3>
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${TONES[tone]}`}>{icon}</div>
  </div>
);
