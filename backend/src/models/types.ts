export type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'HOSPITAL_ADMIN' | 'SUPER_ADMIN';

export type DoctorApplicationStatus = 'PENDING_VERIFICATION' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type ManagementStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';

export type AppointmentStatus = 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export type AppointmentSource = 'WEBSITE' | 'PATIENT_PORTAL' | 'VOICE_KANNADA' | 'VOICE_ENGLISH' | 'ADMIN_MANUAL';

export interface RoomTariff {
  category: string;
  pricePerDay: number;
  description: string;
  features: string[];
}

export interface HospitalInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  ambulancePhone?: string;
  email: string;
  operatingHours: string;
  mapEmbedUrl: string;
  whatsAppNumber: string;
  certifications: string[];
  statistics: Array<{ label: string; value: string }>;
  socials: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  establishedYear?: number;
  totalBeds?: number;
  directorName?: string;
  supportedLanguages?: string[];
  roomTariffs?: RoomTariff[];
  visitingHours?: {
    general: string;
    icu: string;
    maxVisitors: number;
    restrictions: string[];
  };
  insuranceInfo?: {
    acceptedTPAs: string[];
    cashlessAvailable: boolean;
    preAuthRequired: boolean;
    documentsRequired: string[];
    paymentMethods: string[];
  };
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  iconName: string;
  active: boolean;
}

export interface Doctor {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  photoUrl: string;
  qualification: string;
  designation: string;
  specialization: string;
  departmentId: string;
  departmentName?: string;
  experienceYears: number;
  registrationNumber?: string;
  bio: string;
  languages: string[];
  consultationFee?: number;
  active: boolean;
}

export interface DoctorApplication {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  designation: string;
  departmentId: string;
  departmentName?: string;
  experienceYears: number;
  registrationNumber: string;
  languages: string[];
  bio: string;
  photoUrl: string;
  status: DoctorApplicationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface PatientUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  dob?: string;
  gender?: string;
  profilePhoto?: string;
  createdAt: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  maxAppointments?: number;
}

export interface DaySchedule {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  slots: TimeSlot[];
}

export interface LeavePeriod {
  date: string; // YYYY-MM-DD
  reason?: string;
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  weeklySchedule: DaySchedule[];
  unavailabilities: LeavePeriod[];
}

export interface ServiceItem {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  displayOrder: number;
  active: boolean;
}

export interface FacilityItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
  active: boolean;
}

export interface AppointmentNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Appointment {
  id: string; // APT-YYYYMMDD-XXXX
  patientId?: string;
  createdAt: string;
  updatedAt: string;
  patientName: string;
  patientPhone: string;
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string;
  reason: string;
  additionalMessage?: string;
  source: AppointmentSource;
  language: 'KN' | 'EN';
  status: AppointmentStatus;
  notes: AppointmentNote[];
  idempotencyKey?: string;
  agentSessionId?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  hospitalName?: string;
  status?: ManagementStatus;
  active: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: {
    id: string;
    name: string;
    role: string;
  };
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type VoiceCallOutcome =
  | 'INFORMATION_PROVIDED'
  | 'APPOINTMENT_CREATED'
  | 'HUMAN_HANDOFF'
  | 'EMERGENCY_ESCALATED'
  | 'TECHNICAL_FAILURE'
  | 'CALL_ENDED';

export interface DialogueTurn {
  speaker: 'AI_RECEPTIONIST' | 'PATIENT';
  text: string;
  timestamp: string;
}

export type VoiceCaseStatus = 'NEW' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'CLOSED';

export interface VoiceCall {
  id: string; // call_xxxx
  callId: string;
  callerName?: string;
  phoneNumber: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  language: 'KN' | 'EN' | 'KANGLISH' | 'BILINGUAL';
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  caseStatus?: VoiceCaseStatus;
  intent?: 'APPOINTMENT_BOOKING' | 'EMERGENCY_QUERY' | 'GENERAL_OPD' | 'DOCTOR_ENQUIRY';
  appointmentId?: string;
  bookedAppointmentDetails?: {
    id: string;
    doctorName: string;
    departmentName: string;
    date: string;
    time: string;
    reason?: string;
  };
  outcome: VoiceCallOutcome;
  summary?: string;
  transcript?: string;
  dialogueTurns?: DialogueTurn[];
  assignedReceptionist?: string;
  receptionistNotes?: string;
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
}
