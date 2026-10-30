import React, { useState, useEffect } from 'react';
import { Appointment, AppointmentStatus, AuditLog, Doctor, AuthUser, VoiceCall } from '../types';
import { accountApi, staffApi, DashboardStats } from '../services/db';
import { supabase, errorMessage } from '../lib/supabase';
import { StaffManagement } from './StaffManagement';
import { NotificationBell } from './NotificationBell';
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
  portal?: string;
}

const REFRESH_INTERVAL_MS = 60_000;

const SOURCE_LABELS: Record<Appointment['source'], string> = {
  WEBSITE: 'Website',
  PATIENT_PORTAL: 'Patient login',
  FRONT_DESK: 'Front desk',
  PHONE: 'Phone',
  VOICE_AI: 'Voice agent',
};

const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;

export const ManagementDashboard: React.FC<Props> = ({ user, onLogout, portal }) => {
  const isAdmin = user.role === 'HOSPITAL_ADMIN' || user.role === 'SUPER_ADMIN';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [voiceCalls, setVoiceCalls] = useState<VoiceCall[]>([]);
  const [selectedCase, setSelectedCase] = useState<VoiceCall | null>(null);
  const [receptionistNoteInput, setReceptionistNoteInput] = useState('');
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState<'ALL' | 'NEW' | 'UNDER_REVIEW' | 'CLOSED'>('ALL');
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'receptionist_cases' | 'appointments' | 'doctors' | 'staff' | 'audit'>(() => {
    return (portal === 'reception' || user.role === 'RECEPTIONIST') ? 'appointments' : 'overview';
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadManagementData();
    const timer = window.setInterval(loadManagementData, REFRESH_INTERVAL_MS);
    const channel = supabase.channel('reception-appointments')
      .on('postgres_changes', {event: '*', schema: 'public', table: 'appointments'}, () => loadManagementData())
      .on('postgres_changes', {event: '*', schema: 'public', table: 'voice_calls'}, () => loadManagementData())
      .subscribe();
    return () => { window.clearInterval(timer); void supabase.removeChannel(channel); };
  }, []);

  const loadManagementData = async () => {
    setLoading(true);
    try {
      const [dashStats, appts, docs, calls] = await Promise.all([
        staffApi.getDashboardStats(),
        accountApi.getAppointments(),
        staffApi.getDoctors(),
        staffApi.getVoiceCalls(),
      ]);
      setStats(dashStats);
      setAppointments(appts);
      setDoctors(docs);
      setVoiceCalls(calls);
      setSelectedCase(current => (current ? calls.find(c => c.id === current.id) ?? current : current));
      if (user.role === 'SUPER_ADMIN') {
        setAuditLogs(await staffApi.getAuditLogs());
      }
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load dashboard data.'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: AppointmentStatus) => {
    try {
      await accountApi.updateAppointmentStatus(id, status);
      setAppointments(await accountApi.getAppointments());
    } catch (err) {
      alert(errorMessage(err, 'Failed to update the appointment.'));
    }
  };

  const replaceCall = (updated: VoiceCall) => {
    setVoiceCalls(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    setSelectedCase(updated);
  };

  const handleAssignToMe = async (callId: string) => {
    try {
      replaceCall(await staffApi.updateVoiceCall(callId, { assignedReceptionist: user.name, caseStatus: 'UNDER_REVIEW' }));
    } catch (err) {
      alert(errorMessage(err, 'Failed to assign case.'));
    }
  };

  const handleAddCaseNote = async (callId: string) => {
    if (!receptionistNoteInput.trim()) return;
    try {
      const noteToAdd = `[${user.name} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]: ${receptionistNoteInput.trim()}`;
      const currentNotes = selectedCase?.receptionistNotes ? `${selectedCase.receptionistNotes}\n${noteToAdd}` : noteToAdd;
      replaceCall(
        await staffApi.updateVoiceCall(callId, {
          receptionistNotes: currentNotes,
          assignedReceptionist: selectedCase?.assignedReceptionist || user.name,
        })
      );
      setReceptionistNoteInput('');
    } catch (err) {
      alert(errorMessage(err, 'Failed to add note.'));
    }
  };

  const handleCloseCase = async (callId: string) => {
    try {
      const resNote = resolutionNotesInput.trim() || 'Verified patient details and finalized case.';
      const notes = selectedCase?.receptionistNotes ? `${selectedCase.receptionistNotes}\n[CLOSED]: ${resNote}` : `[CLOSED]: ${resNote}`;
      replaceCall(
        await staffApi.updateVoiceCall(callId, {
          caseStatus: 'CLOSED',
          closedAt: new Date().toISOString(),
          closedBy: user.name,
          receptionistNotes: notes,
        })
      );
      setResolutionNotesInput('');
    } catch (err) {
      alert(errorMessage(err, 'Failed to close case.'));
    }
  };

  const pendingCasesCount = voiceCalls.filter(c => !c.caseStatus || c.caseStatus === 'NEW').length;

  const q = searchQuery.trim().toLowerCase();
  const filteredAppointments = appointments.filter(a =>
    !q ||
    a.patientName.toLowerCase().includes(q) ||
    a.patientPhone.includes(q) ||
    a.doctorName.toLowerCase().includes(q) ||
    a.departmentName.toLowerCase().includes(q) ||
    (a.code ?? '').toLowerCase().includes(q)
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
    <div className="min-h-screen bg-[#f2f6fc] text-[#10294c] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#195fbd] text-white flex items-center justify-center ">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-[#10294c] leading-tight">We Care Staff</h1>
                <p className="text-[10px] uppercase tracking-wider font-bold text-blue-700">
                  {portal === 'reception' ? 'Reception Portal' : 'Administration Portal'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-700 font-semibold">
                {user.name} <span className="text-slate-500 font-normal">· {user.role.replace('_', ' ').toLowerCase()}</span>
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-white hover:bg-rose-50 text-rose-700 border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-200 cursor-pointer shadow-sm active:scale-95"
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
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview' ? 'bg-[#195fbd] text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-[#10294c] hover:bg-slate-100' }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('receptionist_cases')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'receptionist_cases' ? 'bg-[#195fbd] text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-[#10294c] hover:bg-slate-100' }`}
          >
            <Phone className="w-4 h-4" />
            <span>Voice Calls ({voiceCalls.length})</span>
            {pendingCasesCount > 0 && (
              <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm">
                {pendingCasesCount} New
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'appointments' ? 'bg-[#195fbd] text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-[#10294c] hover:bg-slate-100' }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Appointments ({appointments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'doctors' ? 'bg-[#195fbd] text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-[#10294c] hover:bg-slate-100' }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Active Doctors ({doctors.length})</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'staff' ? 'bg-[#195fbd] text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-[#10294c] hover:bg-slate-100' }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Staff &amp; Access</span>
            </button>
          )}

          {user.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'audit' ? 'bg-[#195fbd] text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-[#10294c] hover:bg-slate-100' }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Audit Logs</span>
            </button>
          )}
        </div>

        {loadError && (
          <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <button onClick={loadManagementData} className="underline font-bold">Retry</button>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Today's Appointments</span>
                  <CalendarCheck className="w-4 h-4 text-blue-700" />
                </div>
                <div className="text-3xl font-black text-blue-700">{stats?.todayAppointments ?? '—'}</div>
                <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <span>{stats ? `${stats.yesterdayAppointments} yesterday · ${stats.pendingConfirmation} awaiting confirmation` : ''}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Active Doctors</span>
                  <Stethoscope className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-3xl font-black text-emerald-700">{stats?.activeDoctors ?? '—'}</div>
                <div className="text-[11px] text-slate-500 font-medium">Across {stats?.activeDepartments ?? '—'} departments</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Voice bookings</span>
                </div>
                <div className="text-3xl font-black text-blue-700">{stats?.voiceBookings ?? '—'}</div>
                <div className="text-[11px] text-slate-500 font-semibold">{stats ? `${stats.voiceCalls} calls handled · ${stats.openVoiceCases} open cases` : ''}</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>Registered Patients</span>
                  <Users className="w-4 h-4 text-blue-700" />
                </div>
                <div className="text-3xl font-black text-blue-700">{stats?.registeredPatients ?? '—'}</div>
                <div className="text-[11px] text-slate-500 font-medium">{stats ? `${stats.upcomingAppointments} upcoming appointments` : ''}</div>
              </div>
            </div>

            {/* Telephony & AI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-base text-[#10294c] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-700" />
                  <span>Voice agent summary</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-slate-500 font-semibold">Total Voice Minutes</div>
                    <div className="text-xl font-bold text-[#10294c] mt-1">{stats ? `${stats.voiceMinutes} mins` : '—'}</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-slate-500 font-semibold">Average Call Duration</div>
                    <div className="text-xl font-bold text-[#10294c] mt-1">{stats ? formatDuration(stats.avgCallSeconds) : '—'}</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-slate-500 font-semibold">Bookings by voice agent</div>
                    <div className="text-xl font-bold text-emerald-700 mt-1">{stats?.voiceBookings ?? '—'}</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-slate-500 font-semibold">Open Call Cases</div>
                    <div className="text-xl font-bold text-blue-700 mt-1">{stats?.openVoiceCases ?? '—'}</div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-base text-[#10294c] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-700" />
                  <span>Appointment Queue Breakdown</span>
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-slate-500 font-semibold">CONFIRMED</div>
                    <div className="text-2xl font-bold text-emerald-700 mt-1">
                      {appointments.filter(a => a.status === 'CONFIRMED').length}
                    </div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-slate-500 font-semibold">NEW / CONTACTED</div>
                    <div className="text-2xl font-bold text-amber-700 mt-1">
                      {appointments.filter(a => a.status === 'NEW' || a.status === 'CONTACTED').length}
                    </div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-slate-500 font-semibold">COMPLETED</div>
                    <div className="text-2xl font-bold text-blue-700 mt-1">
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
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span>Voice calls</span>
                  <Phone className="w-4 h-4 text-blue-700" />
                </div>
                <div className="text-2xl font-black text-blue-700">{voiceCalls.length}</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span>New Action Required</span>
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-700">{pendingCasesCount}</div>
                <div className="text-[11px] text-rose-700 font-medium">Calls needing receptionist review</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span>Under Review</span>
                  <Clock className="w-4 h-4 text-amber-700" />
                </div>
                <div className="text-2xl font-black text-amber-700">
                  {voiceCalls.filter(c => c.caseStatus === 'UNDER_REVIEW').length}
                </div>
                <div className="text-[11px] text-slate-500">Assigned & being handled</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <span>Resolved & Closed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {voiceCalls.filter(c => c.caseStatus === 'CLOSED').length}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">Cases completed by receptionists</div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {(['ALL', 'NEW', 'UNDER_REVIEW', 'CLOSED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setCaseStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      caseStatusFilter === st
                        ? 'bg-[#195fbd] text-white shadow-sm'
                        : 'bg-white text-slate-500 hover:text-[#10294c] hover:bg-slate-200' }`}
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
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search caller name, phone, doctor, transcript..."
                  value={caseSearchQuery}
                  onChange={(e) => setCaseSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#10294c] placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Call Cases List */}
            {filteredVoiceCalls.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <Phone className="w-12 h-12 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-600">No call cases match your criteria</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  New calls from the website voice agent appear here automatically with full transcripts.
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
                      className={`p-4 rounded-2xl border transition-all duration-200 bg-slate-50 hover:bg-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                        isNew
                          ? 'border-rose-200 hover:border-rose-200 '
                          : isUnderReview
                          ? 'border-amber-200 hover:border-amber-200' : 'border-emerald-200 hover:border-emerald-200' }`}
                    >
                      {/* Left: Caller Info & Call Meta */}
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-[#10294c]">
                            {call.callerName || 'Guest Caller'}
                          </span>
                          <span className="font-mono text-xs text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                            {call.phoneNumber}
                          </span>

                          {/* Language Pill */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            call.language === 'KN'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : call.language === 'EN'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <span>{call.language === 'KN' ? 'ಕನ್ನಡ' : call.language === 'EN' ? 'English' : 'Bilingual'}</span>
                          </span>

                          {/* Case Status Pill */}
                          {isNew && (
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              <span>NEW CASE</span>
                            </span>
                          )}
                          {isUnderReview && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>UNDER REVIEW</span>
                            </span>
                          )}
                          {isClosed && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>CLOSED & RESOLVED</span>
                            </span>
                          )}
                        </div>

                        {/* Call Summary / Description */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {call.summary || (call.transcript ? call.transcript.slice(0, 140) + '...' : 'Call ended.')}
                        </p>

                        {/* Booked Appointment Banner (if present) */}
                        {call.bookedAppointmentDetails && (
                          <div className="bg-white border border-blue-200 rounded-xl px-3 py-1.5 flex items-center gap-3 text-xs text-blue-700 flex-wrap">
                            <span className="font-bold text-[#10294c] flex items-center gap-1">
                              <CalendarCheck className="w-3.5 h-3.5 text-blue-700" />
                              <span>Booked: {call.bookedAppointmentDetails.doctorName} ({call.bookedAppointmentDetails.departmentName})</span>
                            </span>
                            <span className="text-slate-500">•</span>
                            <span>Slot: <strong className="text-[#10294c]">{call.bookedAppointmentDetails.date} at {call.bookedAppointmentDetails.time}</strong></span>
                            {call.appointmentId && (
                              <span className="bg-blue-50 text-blue-700 font-mono text-[10px] px-1.5 py-0.5 rounded">
                                {call.appointmentId}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Timing and Assignee Footnote */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span>{call.durationSeconds || 60}s duration</span>
                          <span>•</span>
                          <span>{new Date(call.startedAt || call.createdAt).toLocaleString()}</span>
                          {call.assignedReceptionist && (
                            <>
                              <span>•</span>
                              <span className="text-blue-700 font-medium flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-blue-700" />
                                <span>Assigned: {call.assignedReceptionist}</span>
                              </span>
                            </>
                          )}
                          {call.closedBy && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">Closed by {call.closedBy}</span>
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
                          className="w-full md:w-auto px-4 py-2 bg-[#195fbd] hover:bg-[#124a96] text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4 animate-in fade-in duration-200">
                <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                  
                  {/* Modal Header */}
                  <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-[#10294c]">
                            {selectedCase.callerName || 'Caller'}
                          </h3>
                          <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                            {selectedCase.phoneNumber}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedCase.caseStatus === 'CLOSED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : selectedCase.caseStatus === 'UNDER_REVIEW'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {selectedCase.caseStatus || 'NEW'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Call ID: {selectedCase.callId} • Started: {new Date(selectedCase.startedAt || selectedCase.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCase(null)}
                      className="p-2 text-slate-500 hover:text-[#10294c] rounded-xl hover:bg-slate-100 cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body: 2-Column Responsive Layout */}
                  <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left 2 Columns: Full Conversation Transcript */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-xs text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                          <span>Complete Conversation Transcript ({selectedCase.dialogueTurns?.length || 0} Turns)</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Duration: {selectedCase.durationSeconds || 60}s
                        </span>
                      </div>

                      {/* Dialogue Stream */}
                      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 max-h-[380px] overflow-y-auto text-xs">
                        {selectedCase.dialogueTurns && selectedCase.dialogueTurns.length > 0 ? (
                          selectedCase.dialogueTurns.map((turn, i) => {
                            const isAI = turn.speaker === 'AI_RECEPTIONIST';
                            return (
                              <div
                                key={i}
                                className={`p-3 rounded-2xl leading-relaxed flex flex-col space-y-1 ${
                                  isAI
                                    ? 'bg-white border border-blue-200 text-[#10294c] rounded-tl-sm'
                                    : 'bg-blue-50 border border-blue-200 text-blue-700 rounded-tr-sm ml-6'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className={isAI ? 'text-[#195fbd] flex items-center gap-1' : 'text-slate-600'}>
                                    {isAI ? (
                                      <>
                                        <span>Voice agent</span>
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
                          <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {selectedCase.transcript || 'No detailed transcript recorded.'}
                          </div>
                        )}
                      </div>

                      {/* Booked Appointment Summary Box */}
                      {selectedCase.bookedAppointmentDetails && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-2">
                          <div className="font-extrabold text-blue-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              <span>Appointment booked on this call</span>
                            </span>
                            <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded-full text-[10px]">
                              {selectedCase.bookedAppointmentDetails.id}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                            <div>Doctor: <strong className="text-[#10294c]">{selectedCase.bookedAppointmentDetails.doctorName}</strong></div>
                            <div>Dept: <strong className="text-[#10294c]">{selectedCase.bookedAppointmentDetails.departmentName}</strong></div>
                            <div>Date: <strong className="text-[#10294c]">{selectedCase.bookedAppointmentDetails.date}</strong></div>
                            <div>Time Slot: <strong className="text-[#10294c]">{selectedCase.bookedAppointmentDetails.time}</strong></div>
                            {selectedCase.bookedAppointmentDetails.reason && (
                              <div className="col-span-2 text-slate-500">
                                Reason: <em>{selectedCase.bookedAppointmentDetails.reason}</em>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Receptionist Handling & Close Case Actions */}
                    <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="font-bold text-xs text-[#10294c] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                          <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                          <span>Receptionist Desk Actions</span>
                        </div>

                        {/* Assign Receptionist Section */}
                        <div className="space-y-2 text-xs">
                          <div className="text-[11px] text-slate-500">Current Assignee:</div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                            <span className="font-bold text-slate-700">
                              {selectedCase.assignedReceptionist || 'Unassigned'}
                            </span>
                            <button
                              onClick={() => handleAssignToMe(selectedCase.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-[#10294c] font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                            >
                              Assign to Me
                            </button>
                          </div>
                        </div>

                        {/* Receptionist Notes History */}
                        <div className="space-y-2 text-xs">
                          <div className="text-[11px] text-slate-500">Internal Case Notes:</div>
                          <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
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
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#10294c] placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleAddCaseNote(selectedCase.id)}
                              disabled={!receptionistNoteInput.trim()}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-[#10294c] font-bold text-xs rounded-xl cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Close Case Section */}
                      <div className="pt-4 border-t border-slate-200 space-y-3">
                        {selectedCase.caseStatus === 'CLOSED' ? (
                          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                            <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-extrabold text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Case Closed & Finalized</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Closed by: {selectedCase.closedBy || 'Receptionist'} • {selectedCase.closedAt ? new Date(selectedCase.closedAt).toLocaleString() : 'Recently'}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-slate-600 block">
                              Final Resolution Summary:
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Verified with caller. Case resolved."
                              value={resolutionNotesInput}
                              onChange={(e) => setResolutionNotesInput(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#10294c] placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <button
                              onClick={() => handleCloseCase(selectedCase.id)}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4 text-white" />
                              <span>Close Case (ಕೇಸ್ ಮುಕ್ತಾಯಗೊಳಿಸಿ)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span>We Care Hospital · Reception</span>
                    <button
                      onClick={() => setSelectedCase(null)}
                      className="px-4 py-1.5 bg-white hover:bg-slate-200 text-[#10294c] font-bold rounded-xl cursor-pointer"
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-lg text-[#10294c]">Appointments</h3>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search patient, doctor, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-[#10294c] focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white text-slate-500 font-bold border-b border-slate-200">
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
                <tbody className="divide-y divide-slate-200 text-slate-600">
                  {filteredAppointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-100 transition-colors">
                      <td className="p-3">
                        <span className="font-mono text-blue-700 font-extrabold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          #{a.tokenNumber}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">{a.code}</div>
                      </td>
                      <td className="p-3 font-bold text-[#10294c]">{a.patientName}</td>
                      <td className="p-3 font-mono">{a.patientPhone}</td>
                      <td className="p-3">
                        <div className="font-semibold text-[#10294c]">{a.doctorName}</div>
                        <div className="text-[11px] text-slate-500">{a.departmentName}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-[#10294c]">{a.preferredDate}</div>
                        <div className="text-[11px] text-emerald-700">{a.preferredTime}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                          a.source === 'VOICE_AI' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {SOURCE_LABELS[a.source] ?? a.source}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                          a.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          a.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          a.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {a.status === 'NEW' && (
                          <button
                            onClick={() => handleStatusUpdate(a.id, 'CONTACTED')}
                            className="bg-slate-200 hover:bg-slate-300 text-[#10294c] px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Contacted
                          </button>
                        )}
                        {(a.status === 'NEW' || a.status === 'CONTACTED') && (
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
                            className="bg-blue-600 hover:bg-blue-500 text-[#10294c] px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                        {a.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleStatusUpdate(a.id, 'NO_SHOW')}
                            className="bg-slate-200 hover:bg-slate-300 text-[#10294c] px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            No-show
                          </button>
                        )}
                        {(a.status === 'NEW' || a.status === 'CONTACTED' || a.status === 'CONFIRMED') && (
                          <button
                            onClick={() => handleStatusUpdate(a.id, 'CANCELLED')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
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

        {/* Staff & access (admins) */}
        {activeTab === 'staff' && isAdmin && (
          <StaffManagement currentUser={user} doctors={doctors} />
        )}

        {/* Tab 4: Active Doctors */}
        {activeTab === 'doctors' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-lg text-[#10294c]">Active Verified Doctors Directory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.map((d) => (
                <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start space-x-3.5 shadow-sm">
                  <img src={d.photoUrl} alt={d.name} className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#10294c] text-sm truncate">{d.name}{!d.active && <span className="ml-2 text-[10px] text-amber-700">(hidden)</span>}</div>
                    <div className="text-[11px] text-slate-500 truncate">{d.designation}</div>
                    <div className="text-xs text-emerald-700 font-semibold mt-0.5">{d.departmentName}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>Fee: {d.consultationFee != null ? `₹${d.consultationFee}` : '—'}</span>
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200">
            <h3 className="font-bold text-lg text-[#10294c]">System Security & Clinical Audit Trail</h3>
            <div className="space-y-2.5">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-white rounded-xl text-xs border border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <div className="font-bold text-blue-700 flex items-center gap-2">
                      <span>{log.action}</span>
                      <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded font-mono font-normal">
                        {log.actor ? `${log.actor.role} ${log.actor.id.slice(0, 8)}` : 'System'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{`${log.entity} ${log.entityId}`}{log.details?.code ? ` · ${log.details.code}` : ''}{log.details?.from ? ` · ${log.details.from} → ${log.details.to}` : ''}</div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono shrink-0">
                    {new Date(log.createdAt ?? Date.now()).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
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
