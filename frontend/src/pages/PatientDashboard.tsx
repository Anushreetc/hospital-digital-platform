import React, { useState, useEffect } from 'react';
import { Appointment, AuthUser } from '../types';
import { apiClient } from '../services/apiClient';
import { CalendarCheck, Clock, User, Bell, LogOut, Plus, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface Props {
  user: AuthUser;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const PatientDashboard: React.FC<Props> = ({ user, onLogout, onNavigateHome }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'profile' | 'notifications'>('appointments');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appts, notifs] = await Promise.all([
        apiClient.getPatientAppointments(),
        apiClient.getPatientNotifications()
      ]);
      setAppointments(appts);
      setNotifications(notifs);
    } catch (err) {
      console.error('Error loading patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await apiClient.cancelPatientAppointment(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onNavigateHome} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="font-bold text-lg text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              <span>Patient Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-300 font-semibold hidden sm:inline">Welcome, {user.name}</span>
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'appointments' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            My Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'notifications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Notifications ({notifications.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Your Scheduled Consultations</h2>
              <button
                onClick={onNavigateHome}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                Book New Appointment
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-sm">Loading your appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No Appointments Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You haven't scheduled any doctor appointments yet. Click above to book your consultation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((appt) => (
                  <div key={appt.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {appt.id}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base mt-1">{appt.doctorName}</h4>
                        <div className="text-xs font-medium text-slate-600">{appt.departmentName}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        appt.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        appt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {appt.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-700">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Date & Time: {appt.preferredDate} at {appt.preferredTime}</span>
                      </div>
                      <div className="text-slate-500">Reason: {appt.reason}</div>
                    </div>

                    {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleCancel(appt.id)}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 px-3 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Notifications & Alerts</h2>
            {notifications.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No new notifications.</div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                    <div className="font-bold text-slate-900">{n.title}</div>
                    <div className="text-slate-600">{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
