export type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'HOSPITAL_ADMIN' | 'SUPER_ADMIN';

export type DoctorApplicationStatus = 'PENDING_VERIFICATION' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type AppointmentStatus = 'NEW' | 'CONTACTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface HospitalInfo {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  emergencyPhone: string;
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
  userId?: string;
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
  photoUrl?: string;
  status: DoctorApplicationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  weeklySchedule: Array<{
    dayOfWeek: string;
    slots: Array<{ startTime: string; endTime: string }>;
  }>;
  unavailabilities: Array<{ date: string; reason?: string }>;
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

export interface Appointment {
  id: string;
  tokenNumber?: string;
  patientId?: string;
  createdAt: string;
  updatedAt?: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  preferredDate: string;
  preferredTime: string;
  reason: string;
  additionalMessage?: string;
  source: string;
  language?: 'KN' | 'EN';
  status: AppointmentStatus;
  notes?: any;
  agentSessionId?: string;
}

export interface AuthUser {
  userId?: string;
  id?: string;
  email: string;
  role: UserRole;
  name: string;
  doctorId?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  actor?: {
    id: string;
    name: string;
    role: string;
  };
  action: string;
  entity: string;
  entityId: string;
  timestamp?: string;
  createdAt?: string;
  details?: any;
  ipAddress?: string;
}
