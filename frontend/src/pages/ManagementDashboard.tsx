import React, { useState, useEffect } from 'react';
import { Appointment, Doctor, DoctorApplication, Department, ServiceItem, FacilityItem, AuthUser, VoiceCall } from '../types';
import { apiClient } from '../services/apiClient';
import { fallbackManagementStats, fallbackAppointments, fallbackDoctorApplications, fallbackDoctors, fallbackAuditLogs } from '../services/mockData';
import {
  Building2,
  Users,
  Stethoscope,
  CalendarCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  LogOut,
  ArrowLeft,
  Plus,
  Search,
  Eye,
  Phone,
  Sparkles,
  Activity,
  Clock,
  ShieldAlert,
  MessageSquare,
  FileText,
  UserCheck,
  Check,
  AlertCircle,
  Radio,
  Send,
  Calendar
} from 'lucide-react';

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
  const [voiceCalls, setVoiceCalls] = useState<VoiceCall[]>([]);
  const [selectedCase, setSelectedCase] = useState<VoiceCall | null>(null);
  const [receptionistNoteInput, setReceptionistNoteInput] = useState('');
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState<'ALL' | 'NEW' | 'UNDER_REVIEW' | 'CLOSED'>('ALL');
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'receptionist_cases' | 'appointments' | 'applications' | 'doctors' | 'audit'>(() => {
    return user.role === 'RECEPTIONIST' ? 'receptionist_cases' : 'overview';
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadManagementData();

    const handleSync = (e: any) => {
      const newApt = e.detail;
      if (newApt) {
        setAppointments(prev => {
          const idx = prev.findIndex(a => a.id === newApt.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = newApt;
            return next;
          }
          return [newApt, ...prev];
        });
      }
    };

    const handleCallsSync = (e: any) => {
      const newCall = e.detail;
      if (newCall) {
        setVoiceCalls(prev => {
          const idx = prev.findIndex(c => c.id === newCall.id || c.callId === newCall.callId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...newCall };
            return next;
          }
          return [newCall, ...prev];
        });
        setSelectedCase(current => {
          if (current && (current.id === newCall.id || current.callId === newCall.callId)) {
            return { ...current, ...newCall };
          }
          return current;
        });
      }
    };

    window.addEventListener('hospital_appointments_updated', handleSync);
    window.addEventListener('hospital_calls_updated', handleCallsSync);
    window.addEventListener('storage', loadManagementData);
    return () => {
      window.removeEventListener('hospital_appointments_updated', handleSync);
      window.removeEventListener('hospital_calls_updated', handleCallsSync);
      window.removeEventListener('storage', loadManagementData);
    };
  }, []);

  const loadManagementData = async () => {
    setLoading(true);
    try {
      const [dashStats, appts, apps, docs, calls] = await Promise.all([
        apiClient.getManagementDashboard().catch(() => fallbackManagementStats),
        apiClient.getManagementAppointments().catch(() => fallbackAppointments),
        apiClient.getDoctorApplications().catch(() => fallbackDoctorApplications),
        apiClient.getManagementDoctors().catch(() => fallbackDoctors),
        apiClient.getVoiceCalls().catch(() => [])
      ]);
      setStats(dashStats || fallbackManagementStats);
      setAppointments(appts && appts.length > 0 ? appts : fallbackAppointments);
      setDoctorApps(apps && apps.length > 0 ? apps : fallbackDoctorApplications);
      setDoctors(docs && docs.length > 0 ? docs : fallbackDoctors);
      setVoiceCalls(calls || []);

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

  const handleAssignToMe = async (callId: string) => {
    try {
      const updated = await apiClient.updateVoiceCallCase(callId, {
        assignedReceptionist: user.name,
        caseStatus: 'UNDER_REVIEW'
      });
      setVoiceCalls(prev => prev.map(c => (c.id === callId || c.callId === callId) ? updated : c));
      setSelectedCase(updated);
    } catch (err) {
      console.error('Failed to assign case:', err);
    }
  };

  const handleAddCaseNote = async (callId: string) => {
    if (!receptionistNoteInput.trim()) return;
    try {
      const noteToAdd = `[${user.name} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]: ${receptionistNoteInput.trim()}`;
      const currentNotes = selectedCase?.receptionistNotes ? `${selectedCase.receptionistNotes}\n${noteToAdd}` : noteToAdd;
      const updated = await apiClient.updateVoiceCallCase(callId, {
        receptionistNotes: currentNotes,
        assignedReceptionist: selectedCase?.assignedReceptionist || user.name
      });
      setVoiceCalls(prev => prev.map(c => (c.id === callId || c.callId === callId) ? updated : c));
      setSelectedCase(updated);
      setReceptionistNoteInput('');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleCloseCase = async (callId: string) => {
    try {
      const resNote = resolutionNotesInput.trim() || 'Verified patient details and finalized case.';
      const updated = await apiClient.closeVoiceCallCase(callId, resNote);
      setVoiceCalls(prev => prev.map(c => (c.id === callId || c.callId === callId) ? updated : c));
      setSelectedCase(updated);
      setResolutionNotesInput('');
    } catch (err) {
      console.error('Failed to close case:', err);
    }
  };

  const pendingCasesCount = voiceCalls.filter(c => !c.caseStatus || c.caseStatus === 'NEW').length;

  const filteredAppointments = appointments.filter(a =>
    a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVoiceCalls = voiceCalls.filter(c => {
    if (caseStatusFilter !== 'ALL') {
      if (caseStatusFilter === 'NEW' && c.caseStatus && c.caseStatus !== 'NEW') return false;
      if (caseStatusFilter !== 'NEW' && c.caseStatus !== caseStatusFilter) return false;
    }
    if (!caseSearchQuery.trim()) return true;
    const q = caseSearchQuery.toLowerCase();
    return (
      (c.callerName && c.callerName.toLowerCase().includes(q)) ||
      c.phoneNumber.includes(q) ||
      (c.summary && c.summary.toLowerCase().includes(q)) ||
      (c.transcript && c.transcript.toLowerCase().includes(q)) ||
      (c.bookedAppointmentDetails?.doctorName && c.bookedAppointmentDetails.doctorName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button onClick={onNavigateHome} className="p-2.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer" title="Back to Public Site">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-white leading-tight">ClinicOS</h1>
                <p className="text-[10px] uppercase tracking-wider font-bold text-blue-400">Administration Portal</p>
              </div>
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
            onClick={() => setActiveTab('receptionist_cases')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'receptionist_cases' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Phone className="w-4 h-4 text-purple-300" />
            <span>AI Receptionist Desk ({voiceCalls.length})</span>
            {pendingCasesCount > 0 && (
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse shadow-sm">
                {pendingCasesCount} New
              </span>
            )}
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

        {/* Tab: AI Receptionist Desk & Call Transcripts */}
        {activeTab === 'receptionist_cases' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>AI Voice Calls</span>
                  <Phone className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-400">{voiceCalls.length}</div>
                <div className="text-[11px] text-slate-400">VoisLabs Indic & Live AI Receptionist</div>
              </div>

              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>New Action Required</span>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-black text-rose-400">{pendingCasesCount}</div>
                <div className="text-[11px] text-rose-300 font-medium">Calls needing receptionist review</div>
              </div>

              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Under Review</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400">
                  {voiceCalls.filter(c => c.caseStatus === 'UNDER_REVIEW').length}
                </div>
                <div className="text-[11px] text-slate-400">Assigned & being handled</div>
              </div>

              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Resolved & Closed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400">
                  {voiceCalls.filter(c => c.caseStatus === 'CLOSED').length}
                </div>
                <div className="text-[11px] text-emerald-300 font-medium">Cases completed by receptionists</div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {(['ALL', 'NEW', 'UNDER_REVIEW', 'CLOSED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setCaseStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      caseStatusFilter === st
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {st === 'ALL' && `All Calls (${voiceCalls.length})`}
                    {st === 'NEW' && `New (${pendingCasesCount})`}
                    {st === 'UNDER_REVIEW' && `Under Review (${voiceCalls.filter(c => c.caseStatus === 'UNDER_REVIEW').length})`}
                    {st === 'CLOSED' && `Closed (${voiceCalls.filter(c => c.caseStatus === 'CLOSED').length})`}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search caller name, phone, doctor, transcript..."
                  value={caseSearchQuery}
                  onChange={(e) => setCaseSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Call Cases List */}
            {filteredVoiceCalls.length === 0 ? (
              <div className="bg-slate-800/60 p-12 rounded-2xl border border-slate-700 text-center space-y-3">
                <Phone className="w-12 h-12 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-300">No call cases match your criteria</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  New calls from the website's AI Receptionist widget appear here automatically in real time with full transcripts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredVoiceCalls.map((call) => {
                  const isClosed = call.caseStatus === 'CLOSED';
                  const isUnderReview = call.caseStatus === 'UNDER_REVIEW';
                  const isNew = !call.caseStatus || call.caseStatus === 'NEW';

                  return (
                    <div
                      key={call.id || call.callId}
                      className={`p-4 rounded-2xl border transition-all duration-200 bg-slate-800/90 hover:bg-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                        isNew
                          ? 'border-rose-500/40 hover:border-rose-400/80 shadow-rose-950/20'
                          : isUnderReview
                          ? 'border-amber-500/40 hover:border-amber-400/80'
                          : 'border-emerald-500/30 hover:border-emerald-400/60'
                      }`}
                    >
                      {/* Left: Caller Info & Call Meta */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-white">
                            {call.callerName || 'Guest Caller'}
                          </span>
                          <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                            {call.phoneNumber}
                          </span>

                          {/* Language Pill */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            call.language === 'KN'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : call.language === 'EN'
                              ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          }`}>
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{call.language === 'KN' ? 'ಕನ್ನಡ' : call.language === 'EN' ? 'English' : 'Bilingual'}</span>
                          </span>

                          {/* Case Status Pill */}
                          {isNew && (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              <span>NEW CASE</span>
                            </span>
                          )}
                          {isUnderReview && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>UNDER REVIEW</span>
                            </span>
                          )}
                          {isClosed && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>CLOSED & RESOLVED</span>
                            </span>
                          )}
                        </div>

                        {/* Call Summary / Description */}
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {call.summary || (call.transcript ? call.transcript.slice(0, 140) + '...' : 'AI Receptionist call concluded.')}
                        </p>

                        {/* Booked Appointment Banner (if present) */}
                        {call.bookedAppointmentDetails && (
                          <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl px-3 py-1.5 flex items-center gap-3 text-xs text-purple-200 flex-wrap">
                            <span className="font-bold text-white flex items-center gap-1">
                              <CalendarCheck className="w-3.5 h-3.5 text-purple-400" />
                              <span>Booked: {call.bookedAppointmentDetails.doctorName} ({call.bookedAppointmentDetails.departmentName})</span>
                            </span>
                            <span className="text-slate-400">•</span>
                            <span>Slot: <strong className="text-white">{call.bookedAppointmentDetails.date} at {call.bookedAppointmentDetails.time}</strong></span>
                            {call.appointmentId && (
                              <span className="bg-purple-500/20 text-purple-300 font-mono text-[10px] px-1.5 py-0.5 rounded">
                                {call.appointmentId}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Timing and Assignee Footnote */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                          <span>⏱️ {call.durationSeconds || 60}s duration</span>
                          <span>•</span>
                          <span>🕒 {new Date(call.startedAt || call.createdAt).toLocaleString()}</span>
                          {call.assignedReceptionist && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-300 font-medium flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-indigo-400" />
                                <span>Assigned: {call.assignedReceptionist}</span>
                              </span>
                            </>
                          )}
                          {call.closedBy && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-medium">Closed by {call.closedBy}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCase(call);
                            setReceptionistNoteInput('');
                            setResolutionNotesInput('');
                          }}
                          className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Review Transcript & Handle</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Interactive Full Transcript & Case Handling Modal Drawer */}
            {selectedCase && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                  
                  {/* Modal Header */}
                  <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-white">
                            {selectedCase.callerName || 'Caller'}
                          </h3>
                          <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                            {selectedCase.phoneNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedCase.caseStatus === 'CLOSED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : selectedCase.caseStatus === 'UNDER_REVIEW'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {selectedCase.caseStatus || 'NEW'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Call ID: {selectedCase.callId} • Started: {new Date(selectedCase.startedAt || selectedCase.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCase(null)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body: 2-Column Responsive Layout */}
                  <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left 2 Columns: Full Conversation Transcript */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-xs text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                          <span>Complete Conversation Transcript ({selectedCase.dialogueTurns?.length || 0} Turns)</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Duration: {selectedCase.durationSeconds || 60}s
                        </span>
                      </div>

                      {/* Dialogue Stream */}
                      <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-[380px] overflow-y-auto text-xs">
                        {selectedCase.dialogueTurns && selectedCase.dialogueTurns.length > 0 ? (
                          selectedCase.dialogueTurns.map((turn, i) => {
                            const isAI = turn.speaker === 'AI_RECEPTIONIST';
                            return (
                              <div
                                key={i}
                                className={`p-3 rounded-2xl leading-relaxed flex flex-col space-y-1 ${
                                  isAI
                                    ? 'bg-slate-900 border border-purple-500/20 text-slate-100 rounded-tl-sm'
                                    : 'bg-blue-950/70 border border-blue-600/30 text-blue-100 rounded-tr-sm ml-6'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className={isAI ? 'text-purple-300 flex items-center gap-1' : 'text-blue-300'}>
                                    {isAI ? (
                                      <>
                                        <Sparkles className="w-2.5 h-2.5" />
                                        <span>AI Receptionist (VoisLabs)</span>
                                      </>
                                    ) : (
                                      <span>Patient Voice ({selectedCase.callerName || 'Caller'})</span>
                                    )}
                                  </span>
                                  <span className="text-slate-500 font-mono">{turn.timestamp}</span>
                                </div>
                                <div className="text-xs">{turn.text}</div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {selectedCase.transcript || 'No detailed transcript recorded.'}
                          </div>
                        )}
                      </div>

                      {/* Booked Appointment Summary Box */}
                      {selectedCase.bookedAppointmentDetails && (
                        <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl text-xs space-y-2">
                          <div className="font-extrabold text-purple-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Automated Appointment Booked By AI</span>
                            </span>
                            <span className="bg-purple-500 text-slate-950 font-black px-2 py-0.5 rounded-full text-[10px]">
                              {selectedCase.bookedAppointmentDetails.id}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                            <div>Doctor: <strong className="text-white">{selectedCase.bookedAppointmentDetails.doctorName}</strong></div>
                            <div>Dept: <strong className="text-white">{selectedCase.bookedAppointmentDetails.departmentName}</strong></div>
                            <div>Date: <strong className="text-white">{selectedCase.bookedAppointmentDetails.date}</strong></div>
                            <div>Time Slot: <strong className="text-white">{selectedCase.bookedAppointmentDetails.time}</strong></div>
                            {selectedCase.bookedAppointmentDetails.reason && (
                              <div className="col-span-2 text-slate-400">
                                Reason: <em>{selectedCase.bookedAppointmentDetails.reason}</em>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Receptionist Handling & Close Case Actions */}
                    <div className="space-y-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Receptionist Desk Actions</span>
                        </div>

                        {/* Assign Receptionist Section */}
                        <div className="space-y-2 text-xs">
                          <div className="text-[11px] text-slate-400">Current Assignee:</div>
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                            <span className="font-bold text-slate-200">
                              {selectedCase.assignedReceptionist || 'Unassigned'}
                            </span>
                            <button
                              onClick={() => handleAssignToMe(selectedCase.id)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                            >
                              Assign to Me
                            </button>
                          </div>
                        </div>

                        {/* Receptionist Notes History */}
                        <div className="space-y-2 text-xs">
                          <div className="text-[11px] text-slate-400">Internal Case Notes:</div>
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {selectedCase.receptionistNotes || 'No notes added yet. Add follow-up remarks below.'}
                          </div>

                          {/* Add Note Input */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. Called patient, verified X-Ray..."
                              value={receptionistNoteInput}
                              onChange={(e) => setReceptionistNoteInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddCaseNote(selectedCase.id)}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <button
                              onClick={() => handleAddCaseNote(selectedCase.id)}
                              disabled={!receptionistNoteInput.trim()}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Close Case Section */}
                      <div className="pt-4 border-t border-slate-800 space-y-3">
                        {selectedCase.caseStatus === 'CLOSED' ? (
                          <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/40 rounded-2xl text-center space-y-1">
                            <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-extrabold text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Case Closed & Finalized</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Closed by: {selectedCase.closedBy || 'Receptionist'} • {selectedCase.closedAt ? new Date(selectedCase.closedAt).toLocaleString() : 'Recently'}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-300 block">
                              Final Resolution Summary:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Verified with caller. Case resolved."
                              value={resolutionNotesInput}
                              onChange={(e) => setResolutionNotesInput(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() => handleCloseCase(selectedCase.id)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4 text-slate-950" />
                              <span>Close Case (ಕೇಸ್ ಮುಕ್ತಾಯಗೊಳಿಸಿ)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>VoisLabs Indic Telephony Receptionist Portal</span>
                    <button
                      onClick={() => setSelectedCase(null)}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              </div>
            )}
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
