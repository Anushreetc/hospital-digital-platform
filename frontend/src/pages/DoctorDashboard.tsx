import React, { useState, useEffect } from 'react';
import { Appointment, AuthUser, DoctorAvailability } from '../types';
import { apiClient } from '../services/apiClient';
import { Stethoscope, Calendar, Clock, CheckCircle2, XCircle, LogOut, ArrowLeft, UserCheck } from 'lucide-react';

interface Props {
  user: AuthUser;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const DoctorDashboard: React.FC<Props> = ({ user, onLogout, onNavigateHome }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const [appts, avail] = await Promise.all([
        apiClient.getDoctorAppointments(),
        apiClient.getDoctorSelfAvailability().catch(() => null)
      ]);
      setAppointments(appts);
      setAvailability(avail);
    } catch (err) {
      console.error('Error loading doctor portal:', err);
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Navbar */}
      <header className="bg-blue-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onNavigateHome} className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="font-bold text-lg text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-300" />
              <span>Doctor Clinical Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-200 font-semibold hidden sm:inline">Dr. {user.name}</span>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-500/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Patient Queue</div>
            <div className="text-3xl font-black text-blue-700">{todayAppts.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Consultations</div>
            <div className="text-3xl font-black text-emerald-700">{appointments.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Today</div>
            <div className="text-3xl font-black text-indigo-700">
              {todayAppts.filter(a => a.status === 'COMPLETED').length}
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Your Assigned Consultations</h2>

          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 italic">No patient appointments assigned yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b">
                    <th className="p-3">Appointment ID</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Reason</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-blue-600">{a.id}</td>
                      <td className="p-3 font-bold text-slate-900">{a.patientName}</td>
                      <td className="p-3">{a.patientPhone}</td>
                      <td className="p-3 font-semibold">{a.preferredDate} ({a.preferredTime})</td>
                      <td className="p-3 text-slate-600">{a.reason}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          a.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                          a.status === 'COMPLETED' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {a.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleStatusUpdate(a.id, 'COMPLETED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded transition-colors text-[11px]"
                          >
                            Mark Completed
                          </button>
                        )}
                        {a.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleStatusUpdate(a.id, 'CANCELLED')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded transition-colors text-[11px]"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
