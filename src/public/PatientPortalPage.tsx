import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ActivitySquare, ArrowLeft, CalendarCheck, Clock, FileText, Loader2, LogOut, Ticket, UserRound } from 'lucide-react';
import { Appointment, Profile } from '../types';
import { accountApi } from '../services/db';
import { errorMessage } from '../lib/supabase';
import { useAuth } from '../lib/auth';

const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts);

export const PatientPortalPage: React.FC = () => {
  const { profile, signOut, refreshProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      await accountApi.claimGuestBookings();
      setAppointments(await accountApi.getAppointments());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancel = async (appt: Appointment) => {
    if (!confirm(`Cancel your appointment with ${appt.doctorName} on ${appt.preferredDate}?`)) return;
    try {
      await accountApi.updateAppointmentStatus(appt.id, 'CANCELLED', 'Cancelled by patient online');
      await loadData();
    } catch (err) {
      alert(errorMessage(err, 'Failed to cancel.'));
    }
  };

  const today = todayIso();
  const isActive = (a: Appointment) => a.status === 'NEW' || a.status === 'CONTACTED' || a.status === 'CONFIRMED';
  const upcomingAppts = appointments
    .filter(a => isActive(a) && a.preferredDate >= today)
    .sort((a, b) => (a.preferredDate + a.preferredTime).localeCompare(b.preferredDate + b.preferredTime));
  const pastAppts = appointments.filter(a => !upcomingAppts.includes(a));

  const firstName = (profile?.fullName || 'there').split(' ')[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="p-2.5 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors" aria-label="Back to website">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="font-black text-xl text-slate-900 flex items-center gap-2">
                <ActivitySquare className="w-6 h-6 text-blue-600" />
                <span>My Appointments</span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">We Care Multispeciality Hospital</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-bold text-slate-900">{profile?.fullName || 'Patient'}</p>
              <p className="text-xs text-slate-500">{profile?.phone ? `+${profile.phone}` : profile?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-black mb-2">Hello, {firstName}!</h1>
            <p className="text-blue-100 text-lg max-w-xl">
              {loading ? 'Loading your appointments…' : `You have ${upcomingAppts.length} upcoming appointment${upcomingAppts.length === 1 ? '' : 's'}.`}
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold flex items-center justify-between gap-3">
            <span>{error}</span>
            <button onClick={loadData} className="text-xs font-bold underline">Retry</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="w-6 h-6 text-blue-600" />
                  Upcoming Visits
                </h2>
                <a href="/#appointment" className="text-sm font-bold text-blue-600 hover:underline">+ Book new</a>
              </div>

              {loading ? (
                <div className="animate-pulse h-24 bg-slate-200 rounded-2xl"></div>
              ) : upcomingAppts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No upcoming appointments</h3>
                  <p className="text-slate-500 mt-1 mb-6">You don't have any visits scheduled right now.</p>
                  <a href="/#appointment" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/30">
                    Book an Appointment
                  </a>
                </div>
              ) : (
                <div className="grid gap-4">
                  {upcomingAppts.map(appt => (
                    <div key={appt.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center shrink-0 border border-blue-100">
                          <span className="text-xs font-bold uppercase">{formatDate(appt.preferredDate, { month: 'short' })}</span>
                          <span className="text-lg font-black leading-none">{formatDate(appt.preferredDate, { day: 'numeric' })}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">{appt.doctorName}</h4>
                          <p className="text-blue-600 font-medium text-sm mb-1">{appt.departmentName}</p>
                          <div className="flex flex-wrap items-center gap-3 text-slate-500 text-sm">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {appt.preferredTime}</span>
                            <span className="flex items-center gap-1"><Ticket className="w-4 h-4" /> Token {appt.tokenNumber}</span>
                            <span className="font-mono text-xs">{appt.code}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                        <span className={`px-4 py-2 rounded-xl text-xs font-bold text-center ${appt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {appt.status === 'CONFIRMED' ? 'CONFIRMED' : 'AWAITING CONFIRMATION'}
                        </span>
                        <button onClick={() => handleCancel(appt)} className="px-4 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors text-center w-full sm:w-auto">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-slate-600" />
                Past Visits
              </h2>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {pastAppts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No past visits yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pastAppts.map(appt => (
                      <div key={appt.id} className="p-6 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900">{appt.doctorName}</p>
                          <p className="text-sm text-slate-500">
                            {formatDate(appt.preferredDate, { dateStyle: 'medium' })} • {appt.departmentName}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {appt.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {profile && <ProfileCard profile={profile} onSaved={refreshProfile} />}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-blue-100 text-sm text-slate-600 space-y-2">
              <h3 className="font-bold text-slate-900">Booked as a guest earlier?</h3>
              <p>Bookings made on the website with the same mobile number you signed in with appear here automatically.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ProfileCard: React.FC<{ profile: Profile; onSaved: () => Promise<void> }> = ({ profile, onSaved }) => {
  const [fullName, setFullName] = useState(profile.fullName);
  const [dob, setDob] = useState(profile.dob ?? '');
  const [gender, setGender] = useState<Profile['gender'] | ''>(profile.gender ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return setMessage('Please enter your full name.');
    setSaving(true);
    setMessage(null);
    try {
      await accountApi.updateMyProfile({ fullName, dob: dob || null, gender: gender || null });
      await onSaved();
      setMessage('Saved.');
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form onSubmit={save} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
      <h3 className="font-bold text-slate-900 flex items-center gap-2">
        <UserRound className="w-5 h-5 text-blue-600" />
        My Details
      </h3>
      {!profile.fullName && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">Please add your name to complete your profile.</p>}
      <label className="block text-xs font-semibold text-slate-600 space-y-1">
        <span>Full name</span>
        <input value={fullName} onChange={e => setFullName(e.target.value)} className={field} maxLength={120} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-slate-600 space-y-1">
          <span>Date of birth</span>
          <input type="date" value={dob} onChange={e => setDob(e.target.value)} className={field} max={todayIso()} />
        </label>
        <label className="block text-xs font-semibold text-slate-600 space-y-1">
          <span>Gender</span>
          <select value={gender} onChange={e => setGender(e.target.value as Profile['gender'] | '')} className={field}>
            <option value="">—</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{message}</span>
        <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 disabled:opacity-50">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
};
