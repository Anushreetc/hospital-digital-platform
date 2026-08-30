import React, { useState, useEffect } from 'react';
import { Appointment, Doctor, DoctorApplication, Department, ServiceItem, FacilityItem, AuthUser, AuditLog } from '../types';
import { apiClient } from '../services/apiClient';
import { Building2, Users, Stethoscope, CalendarCheck, ShieldCheck, CheckCircle2, XCircle, LogOut, ArrowLeft, Plus, Search, Eye } from 'lucide-react';

interface Props {
  user: AuthUser;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const ManagementDashboard: React.FC<Props> = ({ user, onLogout, onNavigateHome }) => {
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorApps, setDoctorApps] = useState<DoctorApplication[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'appointments' | 'doctors' | 'audit'>('overview');

  useEffect(() => {
    loadManagementData();
  }, []);

  const loadManagementData = async () => {
    setLoading(true);
    try {
      const [dashStats, appts, apps, docs] = await Promise.all([
        apiClient.getManagementDashboard(),
        apiClient.getManagementAppointments(),
        apiClient.getDoctorApplications().catch(() => []),
        apiClient.getManagementDoctors().catch(() => [])
      ]);
      setStats(dashStats);
      setAppointments(appts);
      setDoctorApps(apps);
      setDoctors(docs);

      if (user.role === 'SUPER_ADMIN') {
        const logs = await apiClient.getManagementAuditLogs().catch(() => []);
        setAuditLogs(logs);
      }
    } catch (err) {
      console.error('Error loading management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApp = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.reviewDoctorApplication(id, status);
      alert(`Doctor application ${status.toLowerCase()} successfully!`);
      loadManagementData();
    } catch (err: any) {
      alert(err.message || 'Failed to review application.');
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await apiClient.updateAppointmentStatus(id, status);
      loadManagementData();
    } catch (err: any) {
      alert(err.message || 'Failed to update appointment status.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onNavigateHome} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="font-extrabold text-lg text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Hospital Administration Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-300 font-semibold hidden sm:inline">
              {user.name} ({user.role})
            </span>
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

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            KPI Overview
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'applications' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>Doctor Registrations</span>
            {doctorApps.filter(a => a.status === 'PENDING_VERIFICATION').length > 0 && (
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                {doctorApps.filter(a => a.status === 'PENDING_VERIFICATION').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'appointments' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'doctors' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Active Doctors ({doctors.length})
          </button>
          {user.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'audit' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Audit Logs
            </button>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Appointments</div>
                <div className="text-3xl font-black text-blue-400">{stats.todayAppointmentsCount}</div>
              </div>
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Doctors</div>
                <div className="text-3xl font-black text-emerald-400">{stats.totalDoctorsCount}</div>
              </div>
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Doctor Apps</div>
                <div className="text-3xl font-black text-amber-400">{stats.pendingDoctorApplicationsCount}</div>
              </div>
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Patients</div>
                <div className="text-3xl font-black text-indigo-400">{stats.totalPatientsCount}</div>
              </div>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
              <h3 className="font-bold text-lg text-white">Status Breakdown</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {Object.entries(stats.statusCounts || {}).map(([st, count]) => (
                  <div key={st} className="bg-slate-900 p-3 rounded-xl border border-slate-700/60 text-center">
                    <div className="text-xs font-semibold text-slate-400">{st}</div>
                    <div className="text-xl font-bold text-white mt-1">{String(count)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Doctor Registration Applications */}
        {activeTab === 'applications' && (
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-lg text-white">Pending Doctor Verification Applications</h3>
            {doctorApps.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No doctor applications found.</div>
            ) : (
              <div className="space-y-4">
                {doctorApps.map((app) => (
                  <div key={app.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-700 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          app.status === 'APPROVED' ? 'bg-emerald-900 text-emerald-300' :
                          app.status === 'REJECTED' ? 'bg-rose-900 text-rose-300' :
                          'bg-amber-900 text-amber-300'
                        }`}>
                          {app.status}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1">{app.name}</h4>
                        <div className="text-xs text-slate-400">{app.qualification} | Reg: {app.registrationNumber}</div>
                      </div>

                      {app.status === 'PENDING_VERIFICATION' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleReviewApp(app.id, 'APPROVED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve Doctor
                          </button>
                          <button
                            onClick={() => handleReviewApp(app.id, 'REJECTED')}
                            className="bg-rose-600/40 hover:bg-rose-600 text-rose-200 hover:text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl">{app.bio}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Appointments */}
        {activeTab === 'appointments' && (
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-lg text-white">All Hospital Appointments</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 font-bold">
                    <th className="p-3">ID</th>
                    <th className="p-3">Patient</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-300">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-900/60">
                      <td className="p-3 font-mono text-blue-400 font-bold">{a.id}</td>
                      <td className="p-3 font-bold text-white">{a.patientName}</td>
                      <td className="p-3">{a.patientPhone}</td>
                      <td className="p-3">{a.doctorName}</td>
                      <td className="p-3">{a.preferredDate} ({a.preferredTime})</td>
                      <td className="p-3 font-mono text-[10px]">{a.source}</td>
                      <td className="p-3 font-bold text-emerald-400">{a.status}</td>
                      <td className="p-3 text-right space-x-1">
                        {a.status === 'NEW' && (
                          <button onClick={() => handleStatusUpdate(a.id, 'CONTACTED')} className="bg-blue-600 px-2.5 py-1 rounded font-bold text-[11px]">
                            Mark Contacted
                          </button>
                        )}
                        {a.status !== 'CONFIRMED' && a.status !== 'COMPLETED' && (
                          <button onClick={() => handleStatusUpdate(a.id, 'CONFIRMED')} className="bg-emerald-600 px-2.5 py-1 rounded font-bold text-[11px]">
                            Confirm
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Active Doctors */}
        {activeTab === 'doctors' && (
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-lg text-white">Active Verified Doctors Directory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((d) => (
                <div key={d.id} className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center space-x-3">
                  <img src={d.photoUrl} alt={d.name} className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                  <div>
                    <div className="font-bold text-white text-sm">{d.name}</div>
                    <div className="text-xs text-slate-400">{d.designation}</div>
                    <div className="text-[11px] text-emerald-400 font-semibold">{d.departmentName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Audit Logs (Super Admin) */}
        {activeTab === 'audit' && user.role === 'SUPER_ADMIN' && (
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
            <h3 className="font-bold text-lg text-white">System Security & Status Audit Logs</h3>
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-900 rounded-xl text-xs border border-slate-700 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-indigo-400">{log.action}</span> by <span className="font-semibold text-white">{log.actor.name}</span> ({log.actor.role})
                    <div className="text-[11px] text-slate-400 mt-0.5">Entity: {log.entity} #{log.entityId}</div>
                  </div>
                  <div className="text-[11px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
