import React, { useState, useEffect } from 'react';
import { Appointment, AuthUser } from '../types';
import { apiClient } from '../services/apiClient';
import { Stethoscope, Clock, CheckCircle2, XCircle, LogOut, ArrowLeft, Calendar, FileEdit, Users, LayoutDashboard, Search } from 'lucide-react';

interface Props {
  user: AuthUser;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const DoctorDashboard: React.FC<Props> = ({ user, onLogout, onNavigateHome }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const appts = await apiClient.getDoctorAppointments();
      setAppointments(appts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await apiClient.updateDoctorAppointmentStatus(id, status);
      loadDoctorData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.preferredDate === todayStr);
  const pendingQueue = todayAppts.filter(a => a.status === 'NEW' || a.status === 'CONFIRMED');

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-800 flex flex-col pb-20">
      {/* Sidebar/Header hybrid (SaaS style) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button onClick={onNavigateHome} className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-slate-900 leading-tight">ClinicOS</h1>
                <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600">Provider Portal</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input type="text" placeholder="Search patients..." className="bg-transparent border-none outline-none text-sm w-48 text-slate-700" />
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  On Duty
                </p>
              </div>
              <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Today's Queue</p>
              <h3 className="text-4xl font-black text-slate-900">{pendingQueue.length}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7" />
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-emerald-300 transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Completed Today</p>
              <h3 className="text-4xl font-black text-slate-900">{todayAppts.filter(a => a.status === 'COMPLETED').length}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-purple-300 transition-colors">
            <div>
              <p className="text-sm font-bold text-slate-500 mb-1">Total Assigned</p>
              <h3 className="text-4xl font-black text-slate-900">{appointments.length}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Appointment View */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-slate-400" />
                Active Patient Queue
              </h2>
              <div className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 shadow-sm">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse h-64 bg-slate-200 rounded-3xl w-full"></div>
            ) : pendingQueue.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Queue is clear</h3>
                <p className="text-slate-500 mt-2">You have no pending patients for today. Take a break!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingQueue.map((appt, idx) => (
                  <div key={appt.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden">
                    {idx === 0 && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-lg text-xs uppercase tracking-wider">
                          {appt.preferredTime}
                        </span>
                        {idx === 0 && <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-lg text-xs animate-pulse">NEXT PATIENT</span>}
                      </div>
                      <h4 className="text-xl font-black text-slate-900">{appt.patientName || 'Patient Name'}</h4>
                      <p className="text-slate-500 text-sm mt-1">Reason: <span className="font-medium text-slate-700">{appt.reason}</span></p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button onClick={() => handleStatusUpdate(appt.id, 'COMPLETED')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5" />
                        Complete
                      </button>
                      <button onClick={() => handleStatusUpdate(appt.id, 'CANCELLED')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-4 py-3 rounded-xl font-bold transition-all">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl text-white">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-blue-400" />
                Quick Notes
              </h3>
              <textarea 
                className="w-full h-32 bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white placeholder-white/50 outline-none focus:bg-white/20 transition-colors resize-none"
                placeholder="Jot down quick reminders here..."
              ></textarea>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Upcoming Schedule</h3>
              <div className="space-y-3">
                {appointments.filter(a => a.preferredDate !== todayStr).slice(0,4).map(appt => (
                  <div key={appt.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 font-bold shrink-0">
                      {new Date(appt.preferredDate || '').getDate()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-900 truncate">{appt.patientName}</p>
                      <p className="text-xs text-slate-500">{appt.preferredTime}</p>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No future appointments.</p>}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
