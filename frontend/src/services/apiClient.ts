import {
  HospitalInfo,
  Department,
  Doctor,
  DoctorApplication,
  DoctorAvailability,
  ServiceItem,
  FacilityItem,
  Appointment,
  AuthUser
} from '../types';
import { processLocalVoiceUtterance } from './localVoiceEngine';
import {
  fallbackHospitalInfo,
  fallbackDepartments,
  fallbackDoctors,
  fallbackDoctorAvailability,
  fallbackServices,
  fallbackFacilities,
  fallbackAppointments,
  fallbackDoctorApplications,
  fallbackAuditLogs,
  fallbackManagementStats
} from './mockData';

const defaultRemoteUrl = 'https://hospital-digital-platform-1.onrender.com';
const envBase = ((import.meta as any).env?.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') ? defaultRemoteUrl : '')).replace(/\/$/, '');
export const API_BASE = envBase ? `${envBase}/api` : '/api';

const getHeaders = () => {
  const token = localStorage.getItem('hospital_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'API request failed.');
  }
  return json.data as T;
}

// In-memory runtime state for local actions
let localAppointments = [...fallbackAppointments];
let localDoctorApplications = [...fallbackDoctorApplications];

export const apiClient = {
  // Public
  getHospitalInfo: () => fetch(`${API_BASE}/hospital`).then(res => handleResponse<HospitalInfo>(res)).catch(() => fallbackHospitalInfo),
  getDepartments: () => fetch(`${API_BASE}/departments`).then(res => handleResponse<Department[]>(res)).catch(() => fallbackDepartments),
  getServices: () => fetch(`${API_BASE}/services`).then(res => handleResponse<ServiceItem[]>(res)).catch(() => fallbackServices),
  getFacilities: () => fetch(`${API_BASE}/facilities`).then(res => handleResponse<FacilityItem[]>(res)).catch(() => fallbackFacilities),
  getDoctors: (departmentId?: string) => {
    const url = departmentId ? `${API_BASE}/doctors?departmentId=${departmentId}` : `${API_BASE}/doctors`;
    return fetch(url).then(res => handleResponse<Doctor[]>(res)).catch(() => {
      if (departmentId) return fallbackDoctors.filter(d => d.departmentId === departmentId);
      return fallbackDoctors;
    });
  },
  getDoctorById: (id: string) => fetch(`${API_BASE}/doctors/${id}`).then(res => handleResponse<Doctor>(res)).catch(() => {
    const doc = fallbackDoctors.find(d => d.id === id);
    if (doc) return doc;
    throw new Error('Doctor not found.');
  }),
  getDoctorAvailability: (id: string) => fetch(`${API_BASE}/doctors/${id}/availability`).then(res => handleResponse<DoctorAvailability>(res)).catch(() => ({
    ...fallbackDoctorAvailability,
    doctorId: id
  })),

  createAppointment: (data: any, idempotencyKey?: string) => {
    const headers = getHeaders();
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(res => handleResponse<Appointment>(res)).catch(() => {
      const newApt: Appointment = {
        id: `APT-${Date.now().toString().slice(-4)}`,
        tokenNumber: `T-0${localAppointments.length + 1}`,
        patientName: data.patientName || 'Patient',
        patientPhone: data.patientPhone || '9876543210',
        patientEmail: data.patientEmail || 'patient@example.com',
        departmentId: data.departmentId || 'dept-1',
        departmentName: data.departmentName || 'Cardiology',
        doctorId: data.doctorId || 'doc-1',
        doctorName: data.doctorName || 'Dr. Rajesh Kumar',
        preferredDate: data.preferredDate || new Date().toISOString().split('T')[0],
        preferredTime: data.preferredTime || '10:00 AM',
        reason: data.reason || 'General Consultation',
        status: 'CONFIRMED',
        source: 'WEB',
        createdAt: new Date().toISOString()
      };
      localAppointments.unshift(newApt);
      return newApt;
    });
  },

  processVoiceUtterance: async (sessionId: string, utterance: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${API_BASE}/voice/appointments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ sessionId, utterance }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (res.ok) {
        return await handleResponse<any>(res);
      }
      return processLocalVoiceUtterance(sessionId, utterance);
    } catch (err) {
      return processLocalVoiceUtterance(sessionId, utterance);
    }
  },

  // Auth
  patientSignup: (data: any) => fetch(`${API_BASE}/auth/patient/signup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ token: string; patient: any }>(res)),
  patientLogin: (data: any) => fetch(`${API_BASE}/auth/patient/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ token: string; patient: any }>(res)),

  doctorSignup: (data: any) => fetch(`${API_BASE}/auth/doctor/signup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ application: DoctorApplication; message: string }>(res)),
  doctorLogin: (data: any) => fetch(`${API_BASE}/auth/doctor/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ token: string; doctor: any }>(res)),

  managementSignup: (data: any) => fetch(`${API_BASE}/auth/management/signup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ message: string }>(res)),
  managementLogin: (data: any) => fetch(`${API_BASE}/auth/management/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ token: string; user: AuthUser }>(res)),

  // Patient Portal
  getPatientAppointments: () => fetch(`${API_BASE}/patient/appointments`, { headers: getHeaders() }).then(res => handleResponse<Appointment[]>(res)).catch(() => localAppointments.slice(0, 3)),
  cancelPatientAppointment: (id: string) => fetch(`${API_BASE}/patient/appointments/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status: 'CANCELLED' }) }).then(res => handleResponse<Appointment>(res)).catch(() => {
    const apt = localAppointments.find(a => a.id === id);
    if (apt) apt.status = 'CANCELLED';
    return apt as Appointment;
  }),
  getPatientNotifications: () => fetch(`${API_BASE}/patient/notifications`, { headers: getHeaders() }).then(res => handleResponse<any[]>(res)).catch(() => [
    { id: "notif-1", title: "Appointment Confirmed", message: "Your OPD appointment with Dr. Rajesh Kumar is confirmed for 10:30 AM.", createdAt: new Date().toISOString() },
    { id: "notif-2", title: "Prescription Ready", message: "Your diagnostic lab reports are ready to download in your profile.", createdAt: new Date(Date.now() - 86400000).toISOString() }
  ]),

  // Doctor Portal
  getDoctorAppointments: () => fetch(`${API_BASE}/doctor/appointments`, { headers: getHeaders() }).then(res => handleResponse<Appointment[]>(res)).catch(() => localAppointments),
  updateDoctorAppointmentStatus: (id: string, status: string) => fetch(`${API_BASE}/doctor/appointments/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }) }).then(res => handleResponse<Appointment>(res)).catch(() => {
    const apt = localAppointments.find(a => a.id === id);
    if (apt) apt.status = status as any;
    return apt as Appointment;
  }),
  getDoctorSelfAvailability: () => fetch(`${API_BASE}/doctor/availability`, { headers: getHeaders() }).then(res => handleResponse<DoctorAvailability>(res)).catch(() => ({
    ...fallbackDoctorAvailability,
    doctorId: 'doc-1'
  })),

  // Management Portal
  getManagementDashboard: () => fetch(`${API_BASE}/management/dashboard`, { headers: getHeaders() }).then(res => handleResponse<any>(res)).catch(() => fallbackManagementStats),
  getManagementAppointments: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/management/appointments?${query}`, { headers: getHeaders() }).then(res => handleResponse<Appointment[]>(res)).catch(() => localAppointments);
  },
  updateAppointmentStatus: (id: string, status: string) => fetch(`${API_BASE}/management/appointments/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }) }).then(res => handleResponse<Appointment>(res)).catch(() => {
    const apt = localAppointments.find(a => a.id === id);
    if (apt) apt.status = status as any;
    return apt as Appointment;
  }),
  addAppointmentNote: (id: string, text: string) => fetch(`${API_BASE}/management/appointments/${id}/notes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ text }) }).then(res => handleResponse<Appointment>(res)).catch(() => {
    const apt = localAppointments.find(a => a.id === id);
    if (apt) apt.notes = text;
    return apt as Appointment;
  }),

  getDoctorApplications: () => fetch(`${API_BASE}/management/doctor-applications`, { headers: getHeaders() }).then(res => handleResponse<DoctorApplication[]>(res)).catch(() => localDoctorApplications),
  reviewDoctorApplication: (id: string, status: 'APPROVED' | 'REJECTED') => fetch(`${API_BASE}/management/doctor-applications/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }) }).then(res => handleResponse<DoctorApplication>(res)).catch(() => {
    const app = localDoctorApplications.find(a => a.id === id);
    if (app) app.status = status;
    return app as DoctorApplication;
  }),

  getManagementDoctors: () => fetch(`${API_BASE}/management/doctors`, { headers: getHeaders() }).then(res => handleResponse<Doctor[]>(res)).catch(() => fallbackDoctors),
  saveManagementDoctor: (doc: any) => fetch(`${API_BASE}/management/doctors`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(doc) }).then(res => handleResponse<Doctor>(res)),

  getManagementPatients: () => fetch(`${API_BASE}/management/patients`, { headers: getHeaders() }).then(res => handleResponse<any[]>(res)).catch(() => [
    { id: "pat-1", name: "Sohan Kumar", phone: "+91 9876543210", email: "sohan.k@example.com", totalVisits: 3, lastVisit: "Today" },
    { id: "pat-2", name: "Ramesh Sharma", phone: "+91 9845123456", email: "ramesh.s@example.com", totalVisits: 5, lastVisit: "Today" },
    { id: "pat-3", name: "Pooja Hegde", phone: "+91 9741234567", email: "pooja.h@example.com", totalVisits: 2, lastVisit: "Yesterday" },
    { id: "pat-4", name: "Kavitha Reddy", phone: "+91 9900112233", email: "kavitha.r@example.com", totalVisits: 4, lastVisit: "3 days ago" }
  ]),
  getManagementDepartments: () => fetch(`${API_BASE}/management/departments`, { headers: getHeaders() }).then(res => handleResponse<Department[]>(res)).catch(() => fallbackDepartments),
  getManagementServices: () => fetch(`${API_BASE}/management/services`, { headers: getHeaders() }).then(res => handleResponse<ServiceItem[]>(res)).catch(() => fallbackServices),
  getManagementFacilities: () => fetch(`${API_BASE}/management/facilities`, { headers: getHeaders() }).then(res => handleResponse<FacilityItem[]>(res)).catch(() => fallbackFacilities),
  getManagementContent: () => fetch(`${API_BASE}/management/content`, { headers: getHeaders() }).then(res => handleResponse<HospitalInfo>(res)).catch(() => fallbackHospitalInfo),
  updateManagementContent: (info: HospitalInfo) => fetch(`${API_BASE}/management/content`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(info) }).then(res => handleResponse<HospitalInfo>(res)),

  getManagementUsers: () => fetch(`${API_BASE}/management/users`, { headers: getHeaders() }).then(res => handleResponse<any[]>(res)),
  getManagementAuditLogs: () => fetch(`${API_BASE}/management/audit-logs`, { headers: getHeaders() }).then(res => handleResponse<any[]>(res)).catch(() => fallbackAuditLogs)
};
