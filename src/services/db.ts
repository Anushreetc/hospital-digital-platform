// Data access for the public site, patient portal and staff app.
// All reads and writes go through Supabase; Row Level Security and the
// SECURITY DEFINER functions in supabase/migrations decide what each caller
// may see or change. Nothing here falls back to sample data: failures are
// surfaced to the user.
import { supabase } from '../lib/supabase';
import {
  Appointment,
  AppointmentStatus,
  AuditLog,
  Consultation,
  ConsultationInput,
  Department,
  Doctor,
  DoctorAvailability,
  DoctorLeave,
  FacilityItem,
  HospitalInfo,
  PatientGender,
  PatientRecord,
  PatientSummary,
  Profile,
  ServiceItem,
  StaffMember,
  StaffRole,
  UserRole,
  VoiceCall,
} from '../types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const check = <T>(res: { data: T; error: any }): NonNullable<T> => {
  if (res.error) throw res.error;
  return res.data as NonNullable<T>;
};

/** "17:30:00" -> "05:30 PM" */
export const formatTime = (t: string): string => {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
};

const toDepartment = (r: any): Department => ({
  id: r.id,
  name: r.name,
  code: r.code,
  description: r.description,
  iconName: r.icon_name,
  active: r.active,
});

const toDoctor = (r: any): Doctor => ({
  id: r.id,
  userId: r.user_id ?? undefined,
  name: r.name,
  photoUrl: r.photo_url,
  qualification: r.qualification,
  designation: r.designation,
  specialization: r.specialization,
  departmentId: r.department_id,
  departmentName: r.department?.name,
  experienceYears: r.experience_years,
  registrationNumber: r.registration_number ?? undefined,
  bio: r.bio,
  languages: r.languages ?? [],
  consultationFee: r.consultation_fee ?? undefined,
  active: r.active,
});

const APPOINTMENT_COLUMNS =
  'id, code, patient_id, patient_record_id, patient_name, patient_phone, patient_email, doctor_id, department_id, appointment_date, slot_time, token_number, reason, additional_message, source, language, status, notes, created_at, updated_at, doctor:doctors(name), department:departments(name)';

const toAppointment = (r: any): Appointment => ({
  id: r.id,
  code: r.code,
  tokenNumber: r.token_number != null ? String(r.token_number) : undefined,
  patientId: r.patient_id ?? undefined,
  patientRecordId: r.patient_record_id ?? undefined,
  patientName: r.patient_name,
  patientPhone: r.patient_phone,
  patientEmail: r.patient_email ?? undefined,
  doctorId: r.doctor_id,
  doctorName: r.doctor_name ?? r.doctor?.name ?? '',
  departmentId: r.department_id,
  departmentName: r.department_name ?? r.department?.name ?? '',
  preferredDate: r.appointment_date,
  preferredTime: formatTime(r.slot_time),
  reason: r.reason,
  additionalMessage: r.additional_message ?? undefined,
  source: r.source,
  language: r.language ?? undefined,
  status: r.status,
  notes: r.notes ?? [],
  createdAt: r.created_at,
  updatedAt: r.updated_at ?? undefined,
});

const toVoiceCall = (r: any): VoiceCall => ({
  id: r.id,
  callId: r.call_id,
  callerName: r.caller_name ?? undefined,
  phoneNumber: r.phone_number,
  startedAt: r.started_at,
  endedAt: r.ended_at ?? undefined,
  durationSeconds: r.duration_seconds ?? undefined,
  language: r.language ?? 'EN',
  status: r.status,
  caseStatus: r.case_status,
  intent: r.intent ?? undefined,
  appointmentId: r.appointment_id ?? undefined,
  bookedAppointmentDetails: r.appointment
    ? {
        id: r.appointment.code,
        doctorName: r.appointment.doctor?.name ?? '',
        departmentName: r.appointment.department?.name ?? '',
        date: r.appointment.appointment_date,
        time: formatTime(r.appointment.slot_time),
        reason: r.appointment.reason,
      }
    : undefined,
  outcome: r.outcome ?? 'CALL_ENDED',
  summary: r.summary ?? undefined,
  transcript: r.transcript ?? undefined,
  dialogueTurns: r.dialogue_turns ?? [],
  assignedReceptionist: r.assigned_receptionist ?? undefined,
  receptionistNotes: r.receptionist_notes ?? undefined,
  closedAt: r.closed_at ?? undefined,
  closedBy: r.closed_by ?? undefined,
  createdAt: r.created_at,
});

const VOICE_CALL_COLUMNS =
  '*, appointment:appointments(code, appointment_date, slot_time, reason, doctor:doctors(name), department:departments(name))';

// ---------------------------------------------------------------------------
// Public content
// ---------------------------------------------------------------------------
export const publicApi = {
  async getHospitalInfo(): Promise<HospitalInfo> {
    const row = check(await supabase.from('hospital_info').select('data').eq('id', 1).single());
    return row.data as HospitalInfo;
  },

  async getDepartments(): Promise<Department[]> {
    const rows = check(await supabase.from('departments').select('*').order('display_order'));
    return rows.map(toDepartment);
  },

  async getDoctors(): Promise<Doctor[]> {
    const rows = check(await supabase.from('doctors').select('*, department:departments(name)').order('display_order'));
    return rows.map(toDoctor);
  },

  async getServices(): Promise<ServiceItem[]> {
    const rows = check(await supabase.from('services').select('*').order('display_order'));
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      shortDescription: r.short_description,
      fullDescription: r.full_description,
      iconName: r.icon_name,
      displayOrder: r.display_order,
      active: r.active,
    }));
  },

  async getFacilities(): Promise<FacilityItem[]> {
    const rows = check(await supabase.from('facilities').select('*').order('display_order'));
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.image_url,
      displayOrder: r.display_order,
      active: r.active,
    }));
  },

  /** Weekly OPD sessions in the shape the doctor profile modal displays. */
  async getDoctorSchedule(doctorId: string): Promise<DoctorAvailability> {
    const rows = check(
      await supabase
        .from('doctor_schedules')
        .select('day_of_week, start_time, end_time')
        .eq('doctor_id', doctorId)
        .order('day_of_week')
        .order('start_time')
    );
    const byDay = new Map<number, Array<{ startTime: string; endTime: string }>>();
    rows.forEach((r: any) => {
      const list = byDay.get(r.day_of_week) ?? [];
      list.push({ startTime: formatTime(r.start_time), endTime: formatTime(r.end_time) });
      byDay.set(r.day_of_week, list);
    });
    // Monday first, Sunday last.
    const order = [1, 2, 3, 4, 5, 6, 0];
    return {
      id: doctorId,
      doctorId,
      weeklySchedule: order.filter(d => byDay.has(d)).map(d => ({ dayOfWeek: DAY_NAMES[d], slots: byDay.get(d)! })),
      unavailabilities: [],
    };
  },

  async getAvailableSlots(doctorId: string, date: string): Promise<Array<{ time: string; label: string; available: number }>> {
    const rows = check(await supabase.rpc('get_available_slots', { p_doctor_id: doctorId, p_date: date }));
    return (rows ?? []).map((r: any) => ({ time: r.slot_time, label: formatTime(r.slot_time), available: r.available }));
  },

  async bookAppointment(input: {
    doctorId: string;
    date: string;
    slotTime: string;
    patientName: string;
    patientPhone: string;
    reason: string;
    additionalMessage?: string;
    patientEmail?: string;
    source?: Appointment['source'];
    language?: 'EN' | 'KN';
    idempotencyKey: string;
  }): Promise<Appointment> {
    const summary = check(
      await supabase.rpc('book_appointment', {
        p_doctor_id: input.doctorId,
        p_date: input.date,
        p_slot_time: input.slotTime,
        p_patient_name: input.patientName,
        p_patient_phone: input.patientPhone,
        p_reason: input.reason,
        p_additional_message: input.additionalMessage ?? null,
        p_patient_email: input.patientEmail ?? null,
        p_source: input.source ?? null,
        p_language: input.language ?? null,
        p_idempotency_key: input.idempotencyKey,
      })
    );
    return toAppointment(summary);
  },
};

// ---------------------------------------------------------------------------
// Signed-in users (patients, doctors, staff). RLS scopes every query.
// ---------------------------------------------------------------------------
export const accountApi = {
  async getMyProfile(): Promise<Profile | null> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data: row, error } = await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle();
    if (error) throw error;
    if (!row) return null;
    return {
      id: row.id,
      role: row.role as UserRole,
      fullName: row.full_name ?? '',
      email: row.email ?? auth.user.email ?? undefined,
      phone: row.phone ?? auth.user.phone ?? undefined,
      dob: row.dob ?? undefined,
      gender: row.gender ?? undefined,
      active: row.active,
    };
  },

  async updateMyProfile(changes: { fullName?: string; dob?: string | null; gender?: Profile['gender'] | null }): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Please sign in again.');
    check(
      await supabase
        .from('profiles')
        .update({
          ...(changes.fullName !== undefined && { full_name: changes.fullName.trim() }),
          ...(changes.dob !== undefined && { dob: changes.dob || null }),
          ...(changes.gender !== undefined && { gender: changes.gender || null }),
        })
        .eq('id', auth.user.id)
    );
  },

  /** Links earlier guest bookings made with the patient's verified mobile number. */
  async claimGuestBookings(): Promise<number> {
    return check(await supabase.rpc('claim_guest_bookings')) as number;
  },

  async getMyDoctorId(): Promise<string | null> {
    const { data, error } = await supabase.rpc('my_doctor_id');
    if (error) throw error;
    return (data as string | null) ?? null;
  },

  /** Appointments visible to the caller: their own as a patient or doctor, all of them as staff. */
  async getAppointments(filter?: { from?: string; to?: string }): Promise<Appointment[]> {
    let query = supabase.from('appointments').select(APPOINTMENT_COLUMNS);
    if (filter?.from) query = query.gte('appointment_date', filter.from);
    if (filter?.to) query = query.lte('appointment_date', filter.to);
    const rows = check(await query.order('appointment_date', { ascending: false }).order('slot_time').limit(1000));
    return rows.map(toAppointment);
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus, note?: string): Promise<void> {
    check(await supabase.rpc('update_appointment_status', { p_id: id, p_status: status, p_note: note ?? null }));
  },

  async addAppointmentNote(id: string, text: string): Promise<void> {
    check(await supabase.rpc('add_appointment_note', { p_id: id, p_text: text }));
  },

  async getLeaves(doctorId: string): Promise<DoctorLeave[]> {
    const rows = check(
      await supabase.from('doctor_leaves').select('id, doctor_id, leave_date, reason').eq('doctor_id', doctorId).order('leave_date')
    );
    return rows.map((r: any) => ({ id: r.id, doctorId: r.doctor_id, date: r.leave_date, reason: r.reason ?? undefined }));
  },

  async addLeave(doctorId: string, date: string, reason?: string): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    check(
      await supabase
        .from('doctor_leaves')
        .insert({ doctor_id: doctorId, leave_date: date, reason: reason?.trim() || null, created_by: auth.user?.id ?? null })
    );
  },

  async removeLeave(id: string): Promise<void> {
    check(await supabase.from('doctor_leaves').delete().eq('id', id));
  },
};

// ---------------------------------------------------------------------------
// Staff only (requires an MFA session; enforced in the database)
// ---------------------------------------------------------------------------
export interface DashboardStats {
  todayAppointments: number;
  yesterdayAppointments: number;
  upcomingAppointments: number;
  pendingConfirmation: number;
  activeDoctors: number;
  activeDepartments: number;
  registeredPatients: number;
  voiceCalls: number;
  voiceBookings: number;
  openVoiceCases: number;
  voiceMinutes: number;
  avgCallSeconds: number;
}

export const staffApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    return check(await supabase.rpc('get_dashboard_stats')) as DashboardStats;
  },

  async getDoctors(): Promise<Doctor[]> {
    const rows = check(await supabase.from('doctors').select('*, department:departments(name)').order('display_order'));
    return rows.map(toDoctor);
  },

  async getVoiceCalls(): Promise<VoiceCall[]> {
    const rows = check(await supabase.from('voice_calls').select(VOICE_CALL_COLUMNS).order('created_at', { ascending: false }).limit(500));
    return rows.map(toVoiceCall);
  },

  async updateVoiceCall(
    id: string,
    changes: { caseStatus?: VoiceCall['caseStatus']; assignedReceptionist?: string; receptionistNotes?: string; closedAt?: string; closedBy?: string }
  ): Promise<VoiceCall> {
    const row = check(
      await supabase
        .from('voice_calls')
        .update({
          ...(changes.caseStatus !== undefined && { case_status: changes.caseStatus }),
          ...(changes.assignedReceptionist !== undefined && { assigned_receptionist: changes.assignedReceptionist }),
          ...(changes.receptionistNotes !== undefined && { receptionist_notes: changes.receptionistNotes }),
          ...(changes.closedAt !== undefined && { closed_at: changes.closedAt }),
          ...(changes.closedBy !== undefined && { closed_by: changes.closedBy }),
        })
        .eq('id', id)
        .select(VOICE_CALL_COLUMNS)
        .single()
    );
    return toVoiceCall(row);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const rows = check(await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200));
    return rows.map((r: any) => ({
      id: String(r.id),
      userId: r.actor_id ?? undefined,
      actor: r.actor_id ? { id: r.actor_id, name: r.actor_id, role: r.actor_role ?? '' } : undefined,
      action: r.action,
      entity: r.entity,
      entityId: r.entity_id ?? '',
      createdAt: r.created_at,
      details: r.details,
    }));
  },

  async listStaff(): Promise<StaffMember[]> {
    const rows = check(await supabase.rpc('list_staff'));
    return (rows ?? []).map((r: any) => ({
      id: r.id,
      fullName: r.full_name ?? '',
      email: r.email ?? undefined,
      phone: r.phone ?? undefined,
      role: r.role,
      active: r.active,
      createdAt: r.created_at,
    }));
  },

  async setUserRole(userId: string, role: UserRole, active = true): Promise<void> {
    check(await supabase.rpc('set_user_role', { p_user_id: userId, p_role: role, p_active: active }));
  },

  async inviteStaff(input: { email: string; fullName: string; role: StaffRole; doctorId?: string }): Promise<void> {
    const { data, error } = await supabase.functions.invoke('invite-staff', { body: input });
    if (error) {
      // The function returns { error } with a non-2xx status; surface that message.
      const body = await (error as any).context?.json?.().catch(() => null);
      throw new Error(body?.error ?? error.message);
    }
    if (data?.error) throw new Error(data.error);
  },
};

// ---------------------------------------------------------------------------
// Portal alerts (written by database triggers; RLS limits each user to the
// reception feed or their own doctor feed)
// ---------------------------------------------------------------------------
export interface PortalNotification {
  id: string;
  audience: 'RECEPTION' | 'DOCTOR';
  kind: string;
  title: string;
  body: string;
  appointmentId?: string;
  voiceCallId?: string;
  createdAt: string;
  read: boolean;
}

export const toNotification = (r: any, read = false): PortalNotification => ({
  id: r.id,
  audience: r.audience,
  kind: r.kind,
  title: r.title,
  body: r.body,
  appointmentId: r.appointment_id ?? undefined,
  voiceCallId: r.voice_call_id ?? undefined,
  createdAt: r.created_at,
  read,
});

export const notificationsApi = {
  async list(limit = 30): Promise<PortalNotification[]> {
    const rows = check(
      await supabase
        .from('notifications')
        .select('id, audience, kind, title, body, appointment_id, voice_call_id, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
    );
    if (rows.length === 0) return [];
    const reads = check(
      await supabase.from('notification_reads').select('notification_id').in('notification_id', rows.map((r: any) => r.id))
    );
    const readIds = new Set(reads.map((r: any) => r.notification_id));
    return rows.map((r: any) => toNotification(r, readIds.has(r.id)));
  },

  async markRead(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase
      .from('notification_reads')
      .upsert(ids.map((id) => ({ notification_id: id, user_id: auth.user!.id })), { onConflict: 'notification_id,user_id', ignoreDuplicates: true });
    if (error) throw error;
  },
};

// ---------------------------------------------------------------------------
// Patient records (search, visit history, prescriptions). All access goes
// through database functions that check the caller's role and log views.
// ---------------------------------------------------------------------------

const toPatientSummary = (r: any): PatientSummary => ({
  id: r.id,
  code: r.code,
  name: r.name,
  phone: r.phone,
  gender: r.gender ?? undefined,
  age: r.age ?? undefined,
  lastVisit: r.last_visit ?? undefined,
  lastDoctor: r.last_doctor ?? undefined,
  visitCount: Number(r.visit_count ?? 0),
});

const toConsultation = (r: any): Consultation => ({
  id: r.id,
  visitDate: r.visit_date,
  appointmentId: r.appointment_id ?? undefined,
  doctorId: r.doctor_id,
  doctorName: r.doctor_name,
  doctorQualification: r.doctor_qualification ?? undefined,
  doctorDesignation: r.doctor_designation ?? undefined,
  doctorRegistration: r.doctor_registration ?? undefined,
  isMine: Boolean(r.is_mine),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  complaint: r.complaint ?? undefined,
  findings: r.findings ?? undefined,
  vitals: r.vitals ?? undefined,
  diagnosis: r.diagnosis ?? undefined,
  advice: r.advice ?? undefined,
  followUpDate: r.follow_up_date ?? undefined,
  items: r.items?.map((i: any) => ({
    medicine: i.medicine,
    dose: i.dose ?? undefined,
    frequency: i.frequency ?? undefined,
    timing: i.timing ?? undefined,
    durationDays: i.duration_days ?? undefined,
    notes: i.notes ?? undefined,
  })),
});

export const patientsApi = {
  async search(query: string): Promise<PatientSummary[]> {
    const rows = check(await supabase.rpc('search_patients', { p_query: query })) as any[];
    return rows.map(toPatientSummary);
  },

  async getRecord(patientId: string): Promise<PatientRecord> {
    const r = check(await supabase.rpc('get_patient_record', { p_patient: patientId })) as any;
    return {
      patient: {
        ...toPatientSummary({ ...r.patient, visit_count: r.visits.length }),
        birthYear: r.patient.birth_year ?? undefined,
        createdAt: r.patient.created_at,
      },
      visits: r.visits.map(toConsultation),
      bookings: r.bookings.map((b: any) => ({
        id: b.id,
        code: b.code,
        date: b.date,
        time: formatTime(b.time),
        doctorId: b.doctor_id,
        doctorName: b.doctor_name,
        status: b.status,
        reason: b.reason ?? undefined,
        token: b.token ?? undefined,
      })),
    };
  },

  async updateDetails(patientId: string, gender: PatientGender | '', birthYear: number | null): Promise<void> {
    check(await supabase.rpc('update_patient_details', { p_patient: patientId, p_gender: gender, p_birth_year: birthYear }));
  },

  async saveConsultation(input: ConsultationInput): Promise<string> {
    return check(await supabase.rpc('save_consultation', {
      p: {
        id: input.id ?? '',
        patient_id: input.patientId,
        appointment_id: input.appointmentId ?? '',
        complaint: input.complaint ?? '',
        findings: input.findings ?? '',
        vitals: input.vitals,
        diagnosis: input.diagnosis ?? '',
        advice: input.advice ?? '',
        follow_up_date: input.followUpDate ?? '',
        items: input.items.map((i) => ({
          medicine: i.medicine,
          dose: i.dose ?? '',
          frequency: i.frequency ?? '',
          timing: i.timing ?? '',
          duration_days: i.durationDays ?? '',
          notes: i.notes ?? '',
        })),
      },
    })) as string;
  },

  async medicineSuggestions(prefix: string): Promise<string[]> {
    if (prefix.trim().length < 2) return [];
    return check(await supabase.rpc('medicine_suggestions', { p_prefix: prefix })) as string[];
  },
};
