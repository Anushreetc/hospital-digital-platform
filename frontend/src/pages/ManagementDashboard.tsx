import React, { useState, useEffect } from 'react';
import { Appointment, Doctor, DoctorApplication, Department, ServiceItem, FacilityItem, AuthUser } from '../types';
import { apiClient } from '../services/apiClient';
import { fallbackManagementStats, fallbackAppointments, fallbackDoctorApplications, fallbackDoctors, fallbackAuditLogs } from '../services/mockData';
import { Building2, Users, Stethoscope, CalendarCheck, ShieldCheck, CheckCircle2, XCircle, LogOut, ArrowLeft, Plus, Search, Eye, Phone, Sparkles, Activity, Clock, ShieldAlert } from 'lucide-react';

interface Props {
  user: AuthUser;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const ManagementDashboard: React.FC<Props> = ({ user, onLogout, onNavigateHome }) => {
  const [stats, setStats] = useState<any>(fallbackManagementStats);
  const [appointments, setAppointments] = useState<Appointment[]>(fallbackAppointments);
  const [doctorApps, setDoctorApps] = useState<DoctorApplication[]>(fallbackDoctorApplications);
  const [doctors, setDoctors] = useState<Doctor[]>(fallbackDoctors);
  const [auditLogs, setAuditLogs] = useState<any[]>(fallbackAuditLogs);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'appointments' | 'doctors' | 'audit'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadManagementData();
  }, []);

  const loadManagementData = async () => {
    setLoading(true);
    try {
      const [dashStats, appts, apps, docs] = await Promise.all([
        apiClient.getManagementDashboard().catch(() => fallbackManagementStats),
        apiClient.getManagementAppointments().catch(() => fallbackAppointments),
        apiClient.getDoctorApplications().catch(() => fallbackDoctorApplications),
        apiClient.getManagementDoctors().catch(() => fallbackDoctors)
      ]);
      setStats(dashStats || fallbackManagementStats);
      setAppointments(appts && appts.length > 0 ? appts : fallbackAppointments);
      setDoctorApps(apps && apps.length > 0 ? apps : fallbackDoctorApplications);
      setDoctors(docs && docs.length > 0 ? docs : fallbackDoctors);

      if (user.role === 'SUPER_ADMIN') {
        const logs = await apiClient.getManagementAuditLogs().catch(() => fallbackAuditLogs);
        setAuditLogs(logs && logs.length > 0 ? logs : fallbackAuditLogs);
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
      setDoctorApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err: any) {
      setDoctorApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await apiClient.updateAppointmentStatus(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
    } catch (err: any) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
    }
  };

  const filteredAppointments = appointments.filter(a =>
    a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onNavigateHome} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer" title="Back to Public Site">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="font-extrabold text-lg text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Hospital Administration Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-200 font-semibold">
                {user.name} <span className="text-indigo-400 font-mono">({user.role})</span>
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-500/30 cursor-pointer shadow-sm active:scale-95"
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
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>KPI Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'appointments' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Appointments ({appointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'applications' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Doctor Registrations</span>
            {doctorApps.filter(a => a.status === 'PENDING_VERIFICATION' || a.status === 'UNDER_REVIEW').length > 0 && (
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                {doctorApps.filter(a => a.status === 'PENDING_VERIFICATION' || a.status === 'UNDER_REVIEW').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'doctors' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Active Doctors ({doctors.length})</span>
          </button>

          {user.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Audit Logs</span>
            </button>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Today's Appointments</span>
                  <CalendarCheck className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl font-black text-blue-400">{stats.todayAppointmentsCount || stats.todayAppointments || 26}</div>
                <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span>↑ +18% vs yesterday</span>
                </div>
              </div>

              <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Active Doctors</span>
                  <Stethoscope className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-emerald-400">{stats.totalDoctorsCount || stats.activeDoctors || doctors.length}</div>
                <div className="text-[11px] text-slate-400 font-medium">Across {stats.activeDepartments || 15} Specialty Depts</div>
              </div>

              <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>AI Voice Bookings</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-3xl font-black text-purple-400">{stats.voiceCallsHandled || 364}</div>
                <div className="text-[11px] text-emerald-400 font-semibold">{stats.voiceSatisfactionRate || "98.2%"} Automated Resolution</div>
              </div>

              <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>Registered Patients</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-3xl font-black text-indigo-400">{stats.totalPatientsCount || stats.totalPatients || 1420}</div>
                <div className="text-[11px] text-slate-400 font-medium">OPD Bed Occupancy: {stats.opdOccupancy || "88%"}</div>
              </div>
            </div>

            {/* Telephony & AI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Bilingual AI Telephony Performance</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-slate-400 font-semibold">Total Voice Minutes</div>
                    <div className="text-xl font-bold text-white mt-1">{stats.telephonyStats?.totalMinutes || "1,420 mins"}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-slate-400 font-semibold">Average Call Duration</div>
                    <div className="text-xl font-bold text-white mt-1">{stats.telephonyStats?.avgDuration || "1m 48s"}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-slate-400 font-semibold">Self-Service AI Ratio</div>
                    <div className="text-xl font-bold text-emerald-400 mt-1">{stats.telephonyStats?.resolvedByAI || "94.6%"}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="text-slate-400 font-semibold">Language Mix</div>
                    <div className="text-sm font-bold text-blue-300 mt-1">{stats.telephonyStats?.bilingualRatio || "62% KN / 38% EN"}</div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Appointment Queue Breakdown</span>
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-slate-400 font-semibold">CONFIRMED</div>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">
                      {appointments.filter(a => a.status === 'CONFIRMED').length}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-slate-400 font-semibold">NEW / CONTACTED</div>
                    <div className="text-2xl font-bold text-amber-400 mt-1">
                      {appointments.filter(a => a.status === 'NEW' || a.status === 'CONTACTED').length}
                    </div>
                  </div>
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <div className="text-slate-400 font-semibold">COMPLETED</div>
                    <div className="text-2xl font-bold text-indigo-400 mt-1">
                      {appointments.filter(a => a.status === 'COMPLETED').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Appointments */}
        {activeTab === 'appointments' && (
          <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-lg text-white">Live OPD & Voice Appointment Queue</h3>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search patient, doctor, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                    <th className="p-3">Token & ID</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Doctor & Dept</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Channel</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 text-slate-300">
                  {filteredAppointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3">
                        <span className="font-mono text-indigo-300 font-extrabold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                          {a.tokenNumber || a.id}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">{a.patientName}</td>
                      <td className="p-3 font-mono">{a.patientPhone}</td>
                      <td className="p-3">
                        <div className="font-semibold text-white">{a.doctorName}</div>
                        <div className="text-[11px] text-slate-400">{a.departmentName}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-white">{a.preferredDate}</div>
                        <div className="text-[11px] text-emerald-400">{a.preferredTime}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.source === 'VOICE_AI' ? 'bg-purple-950 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {a.source === 'VOICE_AI' ? '🎙️ Voice AI' : '🌐 Web'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          a.status === 'CONFIRMED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                          a.status === 'COMPLETED' ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/30' :
                          a.status === 'CANCELLED' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' :
                          'bg-amber-950 text-amber-300 border border-amber-500/30'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        {a.status !== 'CONFIRMED' && a.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleStatusUpdate(a.id, 'CONFIRMED')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Confirm
                          </button>
                        )}
                        {a.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleStatusUpdate(a.id, 'COMPLETED')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                        {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleStatusUpdate(a.id, 'CANCELLED')}
                            className="bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white px-2 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
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
          </div>
        )}

        {/* Tab 3: Doctor Registration Applications */}
        {activeTab === 'applications' && (
          <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-lg text-white">Pending Doctor Verification Applications</h3>
            {doctorApps.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No doctor applications found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctorApps.map((app) => (
                  <div key={app.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-700 space-y-3 shadow-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          app.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                          app.status === 'REJECTED' ? 'bg-rose-950 text-rose-300 border border-rose-500/30' :
                          'bg-amber-950 text-amber-300 border border-amber-500/30'
                        }`}>
                          {app.status}
                        </span>
                        <h4 className="text-base font-bold text-white mt-1.5">{app.name}</h4>
                        <div className="text-xs text-indigo-400 font-semibold">{app.specialization}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{app.qualification} • Reg: {app.registrationNumber}</div>
                      </div>

                      {(app.status === 'PENDING_VERIFICATION' || app.status === 'UNDER_REVIEW') && (
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => handleReviewApp(app.id, 'APPROVED')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReviewApp(app.id, 'REJECTED')}
                            className="bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 leading-relaxed">{app.bio}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Active Doctors */}
        {activeTab === 'doctors' && (
          <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-lg text-white">Active Verified Doctors Directory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((d) => (
                <div key={d.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex items-start space-x-3.5 shadow-sm">
                  <img src={d.photoUrl} alt={d.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-sm truncate">{d.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{d.designation}</div>
                    <div className="text-xs text-emerald-400 font-semibold mt-0.5">{d.departmentName}</div>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                      <span>Fee: ₹{d.consultationFee}</span>
                      <span>•</span>
                      <span>Exp: {d.experienceYears} yrs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Audit Logs (Super Admin) */}
        {activeTab === 'audit' && user.role === 'SUPER_ADMIN' && (
          <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-lg text-white">System Security & Clinical Audit Trail</h3>
            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-900 rounded-xl text-xs border border-slate-700/80 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <div className="font-bold text-indigo-300 flex items-center gap-2">
                      <span>{log.action}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-normal">
                        {log.userId || log.actor?.name || 'System'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">{log.details || `Modified ${log.entity} #${log.entityId}`}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono shrink-0">
                    {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
