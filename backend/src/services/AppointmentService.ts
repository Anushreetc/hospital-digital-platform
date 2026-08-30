import { FileRepository } from '../repositories/FileRepository';
import { GoogleSheetsRepository } from '../repositories/GoogleSheetsRepository';
import { Appointment, AppointmentStatus, AppointmentSource, AuditLog } from '../models/types';
import { v4 as uuidv4 } from 'crypto';

export interface CreateAppointmentDTO {
  patientName: string;
  patientPhone: string;
  departmentId: string;
  doctorId: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string;
  reason: string;
  additionalMessage?: string;
  source?: AppointmentSource;
  language?: 'KN' | 'EN';
  idempotencyKey?: string;
  agentSessionId?: string;
}

export class AppointmentService {
  private fileRepo: FileRepository;
  private sheetsRepo: GoogleSheetsRepository;

  constructor(fileRepo: FileRepository, sheetsRepo: GoogleSheetsRepository) {
    this.fileRepo = fileRepo;
    this.sheetsRepo = sheetsRepo;
  }

  /**
   * Generates Human Readable Appointment ID: APT-YYYYMMDD-XXXX
   */
  private generateAppointmentId(dateStr: string): string {
    const cleanDate = dateStr.replace(/-/g, '');
    const existing = this.fileRepo.getAppointments();
    const prefix = `APT-${cleanDate}-`;
    
    // Count how many appointments exist for this date
    const countForDate = existing.filter(a => a.id.startsWith(prefix)).length;
    const nextSeq = (countForDate + 1).toString().padStart(4, '0');
    
    return `${prefix}${nextSeq}`;
  }

  /**
   * Normalizes Indian Phone Number to +91XXXXXXXXXX
   */
  public normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+91${digits}`;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      return `+${digits}`;
    }
    return phone.trim();
  }

  /**
   * Validates phone format
   */
  public isValidIndianPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return /^[6-9]\d{9}$/.test(digits);
    if (digits.length === 12 && digits.startsWith('91')) return /^91[6-9]\d{9}$/.test(digits);
    return false;
  }

  /**
   * Validates if date is today or future
   */
  public isValidDate(dateStr: string): boolean {
    const date = new Date(`${dateStr}T00:00:00`);
    if (isNaN(date.getTime())) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    return date >= today;
  }

  /**
   * Checks doctor availability for a given date and time
   */
  public checkDoctorAvailability(doctorId: string, dateStr: string): { available: boolean; reason?: string } {
    const doctor = this.fileRepo.getDoctorById(doctorId);
    if (!doctor || !doctor.active) {
      return { available: false, reason: 'Doctor is inactive or not found.' };
    }

    const avail = this.fileRepo.getAvailabilityByDoctorId(doctorId);
    if (!avail) {
      // Default to available if no explicit restrictions created
      return { available: true };
    }

    // Check temporary leave/unavailability
    const isOnLeave = avail.unavailabilities.some(u => u.date === dateStr);
    if (isOnLeave) {
      return { available: false, reason: `Doctor is unavailable on ${dateStr}.` };
    }

    // Check day of week schedule
    const dateObj = new Date(dateStr);
    const dayNames: Array<'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'> = [
      'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
    ];
    const dayOfWeek = dayNames[dateObj.getDay()];

    const daySchedule = avail.weeklySchedule.find(s => s.dayOfWeek === dayOfWeek);
    if (!daySchedule || daySchedule.slots.length === 0) {
      return { available: false, reason: `Doctor does not consult on ${dayOfWeek}s.` };
    }

    return { available: true };
  }

  /**
   * Core Appointment Creation Engine
   */
  public async createAppointment(dto: CreateAppointmentDTO): Promise<{ appointment: Appointment; isDuplicate: boolean }> {
    // 1. Check Idempotency Key
    if (dto.idempotencyKey) {
      const existing = this.fileRepo.getAppointmentByIdempotencyKey(dto.idempotencyKey);
      if (existing) {
        console.log(`[AppointmentService] Idempotency hit for key ${dto.idempotencyKey}`);
        return { appointment: existing, isDuplicate: true };
      }
    }

    // 2. Validate Inputs
    if (!dto.patientName || dto.patientName.trim().length < 2) {
      throw { code: 'VALIDATION_ERROR', message: 'Patient name must be at least 2 characters.' };
    }

    if (!dto.patientPhone || !this.isValidIndianPhone(dto.patientPhone)) {
      throw { code: 'INVALID_PHONE', message: 'Please provide a valid 10-digit Indian phone number.' };
    }

    const dept = this.fileRepo.getDepartmentById(dto.departmentId);
    if (!dept || !dept.active) {
      throw { code: 'VALIDATION_ERROR', message: 'Invalid or inactive department selected.' };
    }

    const doctor = this.fileRepo.getDoctorById(dto.doctorId);
    if (!doctor || !doctor.active) {
      throw { code: 'VALIDATION_ERROR', message: 'Invalid or inactive doctor selected.' };
    }

    if (doctor.departmentId !== dto.departmentId) {
      throw { code: 'VALIDATION_ERROR', message: 'Selected doctor does not belong to the chosen department.' };
    }

    if (!this.isValidDate(dto.preferredDate)) {
      throw { code: 'INVALID_DATE', message: 'Appointment date must be today or a future date.' };
    }

    if (!dto.preferredTime || dto.preferredTime.trim().length === 0) {
      throw { code: 'INVALID_TIME', message: 'Preferred time slot is required.' };
    }

    if (!dto.reason || dto.reason.trim().length < 3) {
      throw { code: 'VALIDATION_ERROR', message: 'Please provide a reason for the visit.' };
    }

    // 3. Availability Verification
    const availCheck = this.checkDoctorAvailability(dto.doctorId, dto.preferredDate);
    if (!availCheck.available) {
      throw { code: 'DOCTOR_UNAVAILABLE', message: availCheck.reason || 'Doctor is unavailable at the requested date/time.' };
    }

    // 4. Duplicate Submission Check (Same phone, doctor, date, time)
    const normalizedPhone = this.normalizePhone(dto.patientPhone);
    const recentDuplicates = this.fileRepo.getAppointments().filter(a =>
      a.patientPhone === normalizedPhone &&
      a.doctorId === dto.doctorId &&
      a.preferredDate === dto.preferredDate &&
      a.status !== 'CANCELLED'
    );
    if (recentDuplicates.length > 0) {
      throw { code: 'DUPLICATE_REQUEST', message: 'An active appointment already exists for this patient with the doctor on the selected date.' };
    }

    // 5. Build Appointment Model
    const nowIso = new Date().toISOString();
    const dateFormatted = dto.preferredDate;
    const appointmentId = this.generateAppointmentId(dateFormatted);

    const appointment: Appointment = {
      id: appointmentId,
      createdAt: nowIso,
      updatedAt: nowIso,
      patientName: dto.patientName.trim(),
      patientPhone: normalizedPhone,
      departmentId: dept.id,
      departmentName: dept.name,
      doctorId: doctor.id,
      doctorName: doctor.name,
      preferredDate: dto.preferredDate,
      preferredTime: dto.preferredTime.trim(),
      reason: dto.reason.trim(),
      additionalMessage: dto.additionalMessage ? dto.additionalMessage.trim() : undefined,
      source: dto.source || 'WEBSITE',
      language: dto.language || 'EN',
      status: 'NEW',
      notes: [],
      idempotencyKey: dto.idempotencyKey,
      agentSessionId: dto.agentSessionId
    };

    // 6. Save to Local Persistence
    this.fileRepo.saveAppointment(appointment);

    // 7. Audit Log Event
    this.fileRepo.addAuditLog({
      id: `audit-${Date.now()}`,
      actor: { id: 'patient', name: appointment.patientName, role: 'PATIENT' },
      action: 'CREATE_APPOINTMENT',
      entity: 'Appointment',
      entityId: appointment.id,
      timestamp: nowIso,
      details: { source: appointment.source, doctor: appointment.doctorName, date: appointment.preferredDate }
    });

    // 8. Async write to Google Sheets (V1 Primary External Storage)
    this.sheetsRepo.saveAppointment(appointment).catch(err => {
      console.error(`[AppointmentService] Background Google Sheets sync failed for ${appointment.id}:`, err);
    });

    return { appointment, isDuplicate: false };
  }

  /**
   * Status State Machine Rules
   */
  public isAllowedStatusTransition(current: AppointmentStatus, next: AppointmentStatus): boolean {
    if (current === next) return true;

    const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      NEW: ['CONTACTED', 'CONFIRMED', 'CANCELLED'],
      CONTACTED: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
      CANCELLED: [],
      COMPLETED: [],
      NO_SHOW: []
    };

    return allowedTransitions[current]?.includes(next) || false;
  }

  /**
   * Update Appointment Status
   */
  public async updateStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    actor: { id: string; name: string; role: string }
  ): Promise<Appointment> {
    const appointment = this.fileRepo.getAppointmentById(appointmentId);
    if (!appointment) {
      throw { code: 'NOT_FOUND', message: `Appointment ${appointmentId} not found.` };
    }

    if (!this.isAllowedStatusTransition(appointment.status, newStatus)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: `Cannot transition appointment status from ${appointment.status} to ${newStatus}.`
      };
    }

    const prevStatus = appointment.status;
    appointment.status = newStatus;
    appointment.updatedAt = new Date().toISOString();

    // Save updated appointment
    this.fileRepo.saveAppointment(appointment);

    // Record Audit Log
    this.fileRepo.addAuditLog({
      id: `audit-${Date.now()}`,
      actor,
      action: 'UPDATE_STATUS',
      entity: 'Appointment',
      entityId: appointment.id,
      timestamp: appointment.updatedAt,
      details: { previousStatus: prevStatus, newStatus }
    });

    // Sync status to Google Sheets
    this.sheetsRepo.updateAppointmentStatus(appointment.id, newStatus, JSON.stringify(appointment.notes)).catch(err => {
      console.error(`[AppointmentService] Google Sheets status update failed for ${appointment.id}:`, err);
    });

    return appointment;
  }

  /**
   * Add Note to Appointment
   */
  public async addNote(
    appointmentId: string,
    noteText: string,
    actor: { id: string; name: string; role: string }
  ): Promise<Appointment> {
    const appointment = this.fileRepo.getAppointmentById(appointmentId);
    if (!appointment) {
      throw { code: 'NOT_FOUND', message: `Appointment ${appointmentId} not found.` };
    }

    if (!noteText || noteText.trim().length === 0) {
      throw { code: 'VALIDATION_ERROR', message: 'Note text cannot be empty.' };
    }

    const note = {
      id: `note-${Date.now()}`,
      text: noteText.trim(),
      author: `${actor.name} (${actor.role})`,
      createdAt: new Date().toISOString()
    };

    appointment.notes.push(note);
    appointment.updatedAt = note.createdAt;

    this.fileRepo.saveAppointment(appointment);

    this.fileRepo.addAuditLog({
      id: `audit-${Date.now()}`,
      actor,
      action: 'ADD_NOTE',
      entity: 'Appointment',
      entityId: appointment.id,
      timestamp: note.createdAt,
      details: { noteText: note.text }
    });

    this.sheetsRepo.updateAppointmentStatus(appointment.id, appointment.status, JSON.stringify(appointment.notes)).catch(err => {
      console.error(`[AppointmentService] Google Sheets note update failed:`, err);
    });

    return appointment;
  }

  public getAppointments(filters?: {
    search?: string;
    doctor?: string;
    department?: string;
    status?: string;
    date?: string;
    source?: string;
  }): Appointment[] {
    let list = this.fileRepo.getAppointments();

    if (filters) {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(a =>
          a.id.toLowerCase().includes(q) ||
          a.patientName.toLowerCase().includes(q) ||
          a.patientPhone.includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.departmentName.toLowerCase().includes(q)
        );
      }
      if (filters.doctor) {
        list = list.filter(a => a.doctorId === filters.doctor || a.doctorName === filters.doctor);
      }
      if (filters.department) {
        list = list.filter(a => a.departmentId === filters.department || a.departmentName === filters.department);
      }
      if (filters.status) {
        list = list.filter(a => a.status === filters.status);
      }
      if (filters.date) {
        list = list.filter(a => a.preferredDate === filters.date);
      }
      if (filters.source) {
        list = list.filter(a => a.source === filters.source);
      }
    }

    return list;
  }

  public getAppointmentById(id: string): Appointment | undefined {
    return this.fileRepo.getAppointmentById(id);
  }
}
