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

const API_BASE = '/api';

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

export const apiClient = {
  // Public
  getHospitalInfo: () => fetch(`${API_BASE}/hospital`).then(res => handleResponse<HospitalInfo>(res)),
  getDepartments: () => fetch(`${API_BASE}/departments`).then(res => handleResponse<Department[]>(res)),
  getServices: () => fetch(`${API_BASE}/services`).then(res => handleResponse<ServiceItem[]>(res)),
  getFacilities: () => fetch(`${API_BASE}/facilities`).then(res => handleResponse<FacilityItem[]>(res)),
  getDoctors: (departmentId?: string) => {
    const url = departmentId ? `${API_BASE}/doctors?departmentId=${departmentId}` : `${API_BASE}/doctors`;
    return fetch(url).then(res => handleResponse<Doctor[]>(res));
  },
  getDoctorById: (id: string) => fetch(`${API_BASE}/doctors/${id}`).then(res => handleResponse<Doctor>(res)),
  getDoctorAvailability: (id: string) => fetch(`${API_BASE}/doctors/${id}/availability`).then(res => handleResponse<DoctorAvailability>(res)),

  createAppointment: (data: any, idempotencyKey?: string) => {
    const headers = getHeaders();
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return fetch(`${API_BASE}/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(res => handleResponse<Appointment>(res));
  },

  processVoiceUtterance: (sessionId: string, utterance: string) => {
    return fetch(`${API_BASE}/voice/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessionId, utterance })
    }).then(res => handleResponse<any>(res));
  },

  // Auth
  patientSignup: (data: any) => fetch(`${API_BASE}/auth/patient/signup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ token: string; patient: any }>(res)),
  patientLogin: (data: any) => fetch(`${API_BASE}/auth/patient/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ token: string; patient: any }>(res)),

  doctorSignup: (data: any) => fetch(`${API_BASE}/auth/doctor/signup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ application: DoctorApplication; message: string }>(res)),
  doctorLogin: (data: any) => fetch(`${API_BASE}/auth/doctor/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ token: string; doctor: any }>(res)),

  managementSignup: (data: any) => fetch(`${API_BASE}/auth/management/signup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ message: string }>(res)),
  managementLogin: (data: any) => fetch(`${API_BASE}/auth/management/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(res => handleResponse<{ token: string; user: AuthUser }>(res)),

  // Patient Portal
  getPatientAppointments: () => fetch(`${API_BASE}/patient/appointments`, { headers: getHeaders() }).then(res => handleResponse<Appointment[]>(res)),
  cancelPatientAppointment: (id: string) => fetch(`${API_BASE}/patient/appointments/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status: 'CANCELLED' }) }).then(res => handleResponse<Appointment>(res)),
  getPatientNotifications: () => fetch(`${API_BASE}/patient/notifications`, { headers: getHeaders() }).then(res => handleResponse<any[]>(res)),

  // Doctor Portal
  getDoctorAppointments: () => fetch(`${API_BASE}/doctor/appointments`, { headers: getHeaders() }).then(res => handleResponse<Appointment[]>(res)),
  updateDoctorAppointmentStatus: (id: string, status: string) => fetch(`${API_BASE}/doctor/appointments/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }) }).then(res => handleResponse<Appointment>(res)),
  getDoctorSelfAvailability: () => fetch(`${API_BASE}/doctor/availability`, { headers: getHeaders() }).then(res => handleResponse<DoctorAvailability>(res)),

  // Management Portal
  getManagementDashboard: () => fetch(`${API_BASE}/management/dashboard`, { headers: getHeaders() }).then(res => handleResponse<any>(res)),
  getManagementAppointments: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/management/appointments?${query}`, { headers: getHeaders() }).then(res => handleResponse<Appointment[]>(res));
  },
  updateAppointmentStatus: (id: string, status: string) => fetch(`${API_BASE}/management/appointments/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }) }).then(res => handleResponse<Appointment>(res)),
  addAppointmentNote: (id: string, text: string) => fetch(`${API_BASE}/management/appointments/${id}/notes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ text }) }).then(res => handleResponse<Appointment>(res)),

  getDoctorApplications: () => fetch(`${API_BASE}/management/doctor-applications`, { headers: getHeaders() }).then(res => handleResponse<DoctorApplication[]>(res)),
  reviewDoctorApplication: (id: string, status: 'APPROVED' | 'REJECTED') => fetch(`${API_BASE}/management/doctor-applications/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }) }).then(res => handleResponse<DoctorApplication>(res)),

  getManagementDoctors: () => fetch(`${API_BASE}/management/doctors`, { headers: getHeaders() }).then(res => handleResponse<Doctor[]>(res)),
  saveManagementDoctor: (doc: any) => fetch(`${API_BASE}/management/doctors`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(doc) }).then(res => handleResponse<Doctor>(res)),

  getManagementPatients: () => fetch(`${API_BASE}/management/patients`, { headers: getHeaders() }).then(res => handleResponse<any[]>(res)),
  getManagementDepartments: () => fetch(`${API_BASE}/management/departments`, { headers: getHeaders() }).then(res => handleResponse<Department[]>(res)),
  getManagementServices: () => fetch(`${API_BASE}/management/services`, { headers: getHeaders() }).then(res => handleResponse<ServiceItem[]>(res)),
  getManagementFacilities: () => fetch(`${API_BASE}/management/facilities`, { headers: getHeaders() }).then(res => handleResponse<FacilityItem[]>(res)),
  getManagementContent: () => fetch(`${API_BASE}/management/content`, { headers: getHeaders() }).then(res => handleResponse<HospitalInfo>(res)),
  updateManagementContent: (info: HospitalInfo) => fetch(`${API_BASE}/management/content`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(info) }).then(res => handleResponse<HospitalInfo>(res)),

  getManagementUsers: () => fetch(`${API_BASE}/management/users`, { headers: getHeaders() }).then(res => handleResponse<any[]>(res)),
  getManagementAuditLogs: () => fetch(`${API_BASE}/management/audit-logs`, { headers: getHeaders() }).then(res => handleResponse<any[]>(res))
};
