import React, { useState, useEffect } from 'react';
import { Appointment, AuthUser } from '../types';
import { apiClient } from '../services/apiClient';
import { CalendarCheck, User, LogOut, ArrowLeft, Activity, FileText, Clock, ChevronRight, ActivitySquare, Pill } from 'lucide-react';

interface Props {
  user: AuthUser;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const PatientDashboard: React.FC<Props> = ({ user, onLogout, onNavigateHome }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const appts = await apiClient.getPatientAppointments();
      setAppointments(appts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await apiClient.cancelPatientAppointment(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel.');
    }
  };

  const upcomingAppts = appointments.filter(a => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');
  const pastAppts = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED');

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onNavigateHome} className="p-2.5 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="font-black text-xl text-slate-900 flex items-center gap-2">
                <ActivitySquare className="w-6 h-6 text-blue-600" />
                <span>Patient Portal</span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Manage your health effortlessly</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">Patient ID: {(user.id || '').toUpperCase()}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-inner">
              {user.name.charAt(0)}
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-black mb-2">Good morning, {user.name.split(' ')[0]}!</h1>
            <p className="text-blue-100 text-lg max-w-xl">You have {upcomingAppts.length} upcoming appointments. Your health is our top priority.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Appointments */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <CalendarCheck className="w-6 h-6 text-blue-600" />
                  Upcoming Visits
                </h2>
              </div>
              
              {loading ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-24 bg-slate-200 rounded-2xl"></div>
                  </div>
                </div>
              ) : upcomingAppts.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarCheck className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No upcoming appointments</h3>
                  <p className="text-slate-500 mt-1 mb-6">You don't have any visits scheduled right now.</p>
                  <button onClick={onNavigateHome} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/30">
                    Book an Appointment
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {upcomingAppts.map(appt => (
                    <div key={appt.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex flex-col items-center justify-center shrink-0 border border-blue-100">
                          <span className="text-xs font-bold uppercase">{new Date(appt.preferredDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-black leading-none">{new Date(appt.preferredDate).getDate()}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-lg">{appt.doctorName}</h4>
                          <p className="text-blue-600 font-medium text-sm mb-1">{appt.departmentName}</p>
                          <div className="flex items-center gap-3 text-slate-500 text-sm">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {appt.preferredTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                        <span className={`px-4 py-2 rounded-xl text-xs font-bold text-center ${appt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {appt.status}
                        </span>
                        <button onClick={() => handleCancel(appt.id)} className="px-4 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-colors text-center w-full sm:w-auto">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past History */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-slate-600" />
                Medical History
              </h2>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {pastAppts.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No past records found.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {pastAppts.map(appt => (
                      <div key={appt.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{appt.doctorName}</p>
                          <p className="text-sm text-slate-500">{new Date(appt.preferredDate).toLocaleDateString('en-US', { dateStyle: 'medium' })} • {appt.departmentName}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${appt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {appt.status}
                          </span>
                          <button className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 flex items-center justify-center transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Sidebar (Quick Stats / Vitals) */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500" />
                Health Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                  <span className="text-sm text-slate-500 font-medium">Blood Group</span>
                  <span className="font-bold text-rose-600 bg-rose-100 px-3 py-1 rounded-lg">O+</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                  <span className="text-sm text-slate-500 font-medium">Height</span>
                  <span className="font-bold text-slate-900">175 cm</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl">
                  <span className="text-sm text-slate-500 font-medium">Weight</span>
                  <span className="font-bold text-slate-900">70 kg</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-3xl border border-blue-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-indigo-500" />
                Active Prescriptions
              </h3>
              <div className="p-4 bg-white/60 rounded-2xl backdrop-blur-sm border border-white">
                <p className="text-sm font-bold text-slate-900">Paracetamol 500mg</p>
                <p className="text-xs text-slate-500 mt-1">1 tablet after food • 5 days</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
