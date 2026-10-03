import {
  HospitalInfo,
  Department,
  Doctor,
  DoctorApplication,
  DoctorAvailability,
  ServiceItem,
  FacilityItem,
  Appointment,
  AuthUser,
  VoiceCall
} from '../types';
import { processLocalVoiceUtterance } from './localVoiceEngine';
import { supabaseApi } from './supabaseApi';
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

// In-memory runtime state with localStorage persistence for instant Receptionist sync
const getInitialAppointments = (): Appointment[] => {
  try {
    const saved = localStorage.getItem('hospital_local_appointments');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...fallbackAppointments];
};

let localAppointments = getInitialAppointments();
let localDoctorApplications = [...fallbackDoctorApplications];

export const saveAndNotifyAppointment = (newApt: Appointment) => {
  const existingIdx = localAppointments.findIndex(a => a.id === newApt.id);
  if (existingIdx >= 0) {
    localAppointments[existingIdx] = newApt;
  } else {
    localAppointments.unshift(newApt);
  }
  try {
    localStorage.setItem('hospital_local_appointments', JSON.stringify(localAppointments));
  } catch (e) {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hospital_appointments_updated', { detail: newApt }));
  }
};

const fallbackVoiceCalls: VoiceCall[] = [
  {
    id: 'call-101',
    callId: 'vcall_kn_appt_101',
    callerName: 'ರಾಮೇಶ್ ಗೌಡ (Ramesh Gowda)',
    phoneNumber: '9845012345',
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    endedAt: new Date(Date.now() - 7200000 + 115000).toISOString(),
    durationSeconds: 115,
    language: 'KN',
    status: 'COMPLETED',
    caseStatus: 'NEW',
    intent: 'APPOINTMENT_BOOKING',
    appointmentId: 'APT-20260921-001',
    bookedAppointmentDetails: {
      id: 'APT-20260921-001',
      doctorName: 'Dr. Rajesh Kumar',
      departmentName: 'Cardiology',
      date: '2026-09-22',
      time: '10:00 AM',
      reason: 'ಎದೆ ಬಿಗಿತ ಮತ್ತು ರಕ್ತದೊತ್ತಡ ತಪಾಸಣೆ (Chest tightness checkup)'
    },
    outcome: 'APPOINTMENT_CREATED',
    summary: 'ರೋಗಿ ರಾಮೇಶ್ ಗೌಡ ಕಾರ್ಡಿಯಾಲಜಿ ತಜ್ಞ ಡಾ. ರಾಜೇಶ್ ಕುಮಾರ್ ಅವರೊಂದಿಗೆ ನಾಳೆ ಬೆಳಿಗ್ಗೆ 10:00 ಕ್ಕೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಿದ್ದಾರೆ.',
    transcript: 'AI Receptionist: ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ AI ರಿಸೆಪ್ಷನಿಸ್ಟ್. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?\nPatient: ನಮಸ್ಕಾರ, ನನಗೆ ಡಾ. ರಾಜೇಶ್ ಕುಮಾರ್ ಅವರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬೇಕು.\nAI Receptionist: ಖಂಡಿತ! ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.\nPatient: ನನ್ನ ಹೆಸರು ರಾಮೇಶ್ ಗೌಡ, ಮೊಬೈಲ್ 9845012345.\nAI Receptionist: ಧನ್ಯವಾದಗಳು ರಾಮೇಶ್ ಅವರೇ. ಭೇಟಿಯ ಕಾರಣ ತಿಳಿಸಿ.\nPatient: ಸ್ವಲ್ಪ ಎದೆ ಬಿಗಿತ ಮತ್ತು ಬಿಪಿ ಚೆಕಪ್ ಮಾಡಿಸಬೇಕು.\nAI Receptionist: ನಾಳೆ ಬೆಳಿಗ್ಗೆ 10:00 ಗಂಟೆಗೆ ಡಾ. ರಾಜೇಶ್ ಕುಮಾರ್ ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ದೃಢಪಡಿಸಲಾಗಿದೆ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಐಡಿ: APT-20260921-001.',
    dialogueTurns: [
      { speaker: 'AI_RECEPTIONIST', text: 'ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ AI ರಿಸೆಪ್ಷನಿಸ್ಟ್. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?', timestamp: '00:02' },
      { speaker: 'PATIENT', text: 'ನಮಸ್ಕಾರ, ನನಗೆ ಡಾ. ರಾಜೇಶ್ ಕುಮಾರ್ ಅವರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬೇಕು.', timestamp: '00:15' },
      { speaker: 'AI_RECEPTIONIST', text: 'ಖಂಡಿತ! ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಮತ್ತು 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.', timestamp: '00:28' },
      { speaker: 'PATIENT', text: 'ನನ್ನ ಹೆಸರು ರಾಮೇಶ್ ಗೌಡ, ಮೊಬೈಲ್ 9845012345.', timestamp: '00:42' },
      { speaker: 'AI_RECEPTIONIST', text: 'ಧನ್ಯವಾದಗಳು ರಾಮೇಶ್ ಅವರೇ. ಭೇಟಿಯ ಕಾರಣ ತಿಳಿಸಿ.', timestamp: '00:54' },
      { speaker: 'PATIENT', text: 'ಸ್ವಲ್ಪ ಎದೆ ಬಿಗಿತ ಮತ್ತು ಬಿಪಿ ಚೆಕಪ್ ಮಾಡಿಸಬೇಕು.', timestamp: '01:06' },
      { speaker: 'AI_RECEPTIONIST', text: 'ನಾಳೆ ಬೆಳಿಗ್ಗೆ 10:00 ಗಂಟೆಗೆ ಡಾ. ರಾಜೇಶ್ ಕುಮಾರ್ (ಕಾರ್ಡಿಯಾಲಜಿ) ಅವರೊಂದಿಗೆ ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ದೃಢಪಡಿಸಲಾಗಿದೆ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಸಂಖ್ಯೆ: APT-20260921-001.', timestamp: '01:30' }
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'call-102',
    callId: 'vcall_en_ortho_102',
    callerName: 'Meera Sharma',
    phoneNumber: '9900112233',
    startedAt: new Date(Date.now() - 14400000).toISOString(),
    endedAt: new Date(Date.now() - 14400000 + 98000).toISOString(),
    durationSeconds: 98,
    language: 'EN',
    status: 'COMPLETED',
    caseStatus: 'UNDER_REVIEW',
    intent: 'APPOINTMENT_BOOKING',
    assignedReceptionist: 'Ananya Hegde (Receptionist)',
    receptionistNotes: 'Called patient to verify medical history. Advised patient to bring prior knee X-ray films. Arrival confirmed for 4 PM slot.',
    appointmentId: 'APT-20260921-002',
    bookedAppointmentDetails: {
      id: 'APT-20260921-002',
      doctorName: 'Dr. Suresh Rao',
      departmentName: 'Orthopedics',
      date: '2026-09-22',
      time: '04:00 PM',
      reason: 'Severe knee pain and arthritis review'
    },
    outcome: 'APPOINTMENT_CREATED',
    summary: 'Patient Meera Sharma booked consultation with Orthopedic specialist Dr. Rajeev for persistent knee joint pain.',
    transcript: 'AI Receptionist: Hello! Welcome to We Care Multispeciality Hospital. How may I assist you today?\nPatient: Hi, I need to consult an orthopedic specialist for my knee pain.\nAI Receptionist: Certainly. Dr. Rajeev in Orthopedics is available. May I have your full name and 10-digit phone number?\nPatient: Meera Sharma, 9900112233.\nAI Receptionist: Thank you Meera. Your appointment with Dr. Rajeev has been booked for tomorrow at 04:00 PM. ID: APT-20260921-002.',
    dialogueTurns: [
      { speaker: 'AI_RECEPTIONIST', text: 'Hello! Welcome to We Care Multispeciality Hospital. How may I assist you today?', timestamp: '00:02' },
      { speaker: 'PATIENT', text: 'Hi, I need to consult an orthopedic specialist for my knee pain.', timestamp: '00:14' },
      { speaker: 'AI_RECEPTIONIST', text: 'Certainly. Dr. Rajeev in Orthopedics is available. May I have your full name and 10-digit phone number?', timestamp: '00:26' },
      { speaker: 'PATIENT', text: 'Meera Sharma, 9900112233.', timestamp: '00:40' },
      { speaker: 'AI_RECEPTIONIST', text: 'Thank you Meera. Your appointment with Dr. Rajeev has been booked for tomorrow at 04:00 PM. ID: APT-20260921-002.', timestamp: '01:10' }
    ],
    createdAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'call-103',
    callId: 'vcall_kn_mri_103',
    callerName: 'ಸುರೇಶ್ ಕುಮಾರ್ (Suresh Kumar)',
    phoneNumber: '9886077889',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    endedAt: new Date(Date.now() - 86400000 + 84000).toISOString(),
    durationSeconds: 84,
    language: 'BILINGUAL',
    status: 'COMPLETED',
    caseStatus: 'CLOSED',
    intent: 'GENERAL_OPD',
    assignedReceptionist: 'Front Desk',
    receptionistNotes: 'Explained digital X-Ray and diagnostic lab timings and same-day report delivery. Patient will arrive with previous medical summaries. Case resolved.',
    closedAt: new Date(Date.now() - 86400000).toISOString(),
    closedBy: 'Front Desk',
    outcome: 'INFORMATION_PROVIDED',
    summary: 'Inquiry regarding diagnostic lab tests, same-day report delivery, and doctor consultations.',
    transcript: 'AI Receptionist: ನಮಸ್ಕಾರ! ವೀ ಕೇರ್ ಮಲ್ಟಿಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ / Welcome to We Care Hospital.\nPatient: ಸರ್, ಲ್ಯಾಬ್ ಟೆಸ್ಟ್ ಸಮಯ ಮತ್ತು ರಿಪೋರ್ಟ್ ಯಾವಾಗ ಸಿಗುತ್ತೆ?\nAI Receptionist: ನಮ್ಮಲ್ಲಿ 24 ಗಂಟೆಗಳ ಕಾಲ ಲ್ಯಾಬ್ ಪರೀಕ್ಷೆ ಸೌಲಭ್ಯವಿದೆ ಮತ್ತು ಅಂದೇ ವರದಿ ಸಿಗುತ್ತದೆ.\nPatient: ಧನ್ಯವಾದಗಳು, ನಾನು ನಾಳೆ ಬರುತ್ತೇನೆ.\nAI Receptionist: ನಿಮಗೆ ಸ್ವಾಗತ! ನಮ್ಮ ಸಹಾಯವಾಣಿ ಸಂಖ್ಯೆ +91 88677 55541.',
    dialogueTurns: [
      { speaker: 'AI_RECEPTIONIST', text: 'ನಮಸ್ಕಾರ! ವೀ ಕೇರ್ ಮಲ್ಟಿಸ್ಪೆಷಾಲಿಟಿ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ / Welcome to We Care Hospital.', timestamp: '00:02' },
      { speaker: 'PATIENT', text: 'ಸರ್, ಲ್ಯಾಬ್ ಟೆಸ್ಟ್ ಸಮಯ ಮತ್ತು ರಿಪೋರ್ಟ್ ಯಾವಾಗ ಸಿಗುತ್ತೆ?', timestamp: '00:15' },
      { speaker: 'AI_RECEPTIONIST', text: 'ನಮ್ಮಲ್ಲಿ 24 ಗಂಟೆಗಳ ಕಾಲ ಲ್ಯಾಬ್ ಪರೀಕ್ಷೆ ಸೌಲಭ್ಯವಿದೆ ಮತ್ತು ಅಂದೇ ವರದಿ ಸಿಗುತ್ತದೆ.', timestamp: '00:32' },
      { speaker: 'PATIENT', text: 'ಧನ್ಯವಾದಗಳು, ನಾನು ನಾಳೆ ಬರುತ್ತೇನೆ.', timestamp: '00:50' },
      { speaker: 'AI_RECEPTIONIST', text: 'ನಿಮಗೆ ಸ್ವಾಗತ! ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನಮ್ಮ ರಿಸೆಪ್ಷನ್ ತಂಡ ಸದಾ ಸಿದ್ಧವಾಗಿದೆ.', timestamp: '01:05' }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

const getInitialVoiceCalls = (): VoiceCall[] => {
  try {
    const saved = localStorage.getItem('hospital_local_voice_calls');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [...fallbackVoiceCalls];
};

let localVoiceCalls = getInitialVoiceCalls();

export const saveAndNotifyVoiceCall = (newCall: VoiceCall) => {
  const existingIdx = localVoiceCalls.findIndex(c => c.id === newCall.id || c.callId === newCall.callId);
  if (existingIdx >= 0) {
    localVoiceCalls[existingIdx] = { ...localVoiceCalls[existingIdx], ...newCall };
  } else {
    localVoiceCalls.unshift(newCall);
  }
  try {
    localStorage.setItem('hospital_local_voice_calls', JSON.stringify(localVoiceCalls));
  } catch (e) {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('hospital_calls_updated', { detail: newCall }));
  }
};

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
    }).then(res => {
      return handleResponse<Appointment>(res).then(saved => {
        saveAndNotifyAppointment(saved);
        return saved;
      });
    }).catch(async () => {
      // Use Supabase instead of local mock storage
      const newApt = await supabaseApi.bookAppointment({
        patientId: data.patientId || 'pat-1',
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
        source: data.source || 'WEB',
        createdAt: new Date().toISOString()
      } as any);
      
      saveAndNotifyAppointment(newApt as any);
      return newApt as any;
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
        const data = await handleResponse<any>(res);
        if (data.appointment) {
          saveAndNotifyAppointment(data.appointment);
        }
        return data;
      }
      const localResult = processLocalVoiceUtterance(sessionId, utterance);
      if (localResult.appointment) {
        saveAndNotifyAppointment(localResult.appointment);
      }
      return localResult;
    } catch (err) {
      const localResult = processLocalVoiceUtterance(sessionId, utterance);
      if (localResult.appointment) {
        saveAndNotifyAppointment(localResult.appointment);
      }
      return localResult;
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
  getPatientAppointments: () => fetch(`${API_BASE}/patient/appointments`, { headers: getHeaders() }).then(res => handleResponse<Appointment[]>(res)).catch(async () => {
    try {
      const auth = localStorage.getItem('hospital_auth_token');
      // For demo, if they login as pat-1, fetch their supabase appointments
      return await supabaseApi.getPatientAppointments('pat-1') as any;
    } catch {
      return localAppointments.slice(0, 3);
    }
  }),
  cancelPatientAppointment: (id: string) => fetch(`${API_BASE}/patient/appointments/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status: 'CANCELLED' }) }).then(res => handleResponse<Appointment>(res)).catch(async () => {
    try {
      return await supabaseApi.updateAppointmentStatus(id, 'CANCELLED') as any;
    } catch {
      const apt = localAppointments.find(a => a.id === id);
      if (apt) apt.status = 'CANCELLED';
      return apt as Appointment;
    }
  }),
  getPatientNotifications: () => fetch(`${API_BASE}/patient/notifications`, { headers: getHeaders() }).then(res => handleResponse<any[]>(res)).catch(() => [
    { id: "notif-1", title: "Appointment Confirmed", message: "Your OPD appointment with Dr. Rajesh Kumar is confirmed for 10:30 AM.", createdAt: new Date().toISOString() },
    { id: "notif-2", title: "Prescription Ready", message: "Your diagnostic lab reports are ready to download in your profile.", createdAt: new Date(Date.now() - 86400000).toISOString() }
  ]),

  // Doctor Portal
  getDoctorAppointments: () => fetch(`${API_BASE}/doctor/appointments`, { headers: getHeaders() }).then(res => handleResponse<Appointment[]>(res)).catch(async () => {
    try {
      return await supabaseApi.getDoctorAppointments('doc-1') as any;
    } catch {
      return localAppointments;
    }
  }),
  updateDoctorAppointmentStatus: (id: string, status: string) => fetch(`${API_BASE}/doctor/appointments/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status }) }).then(res => handleResponse<Appointment>(res)).catch(async () => {
    try {
      return await supabaseApi.updateAppointmentStatus(id, status) as any;
    } catch {
      const apt = localAppointments.find(a => a.id === id);
      if (apt) apt.status = status as any;
      return apt as Appointment;
    }
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
  getManagementAuditLogs: () => fetch(`${API_BASE}/management/audit-logs`, { headers: getHeaders() }).then(res => handleResponse<any[]>(res)).catch(() => fallbackAuditLogs),

  // AI Voice Calls & Receptionist Portal Cases
  getVoiceCalls: async (params?: { caseStatus?: string; search?: string }): Promise<VoiceCall[]> => {
    const query = new URLSearchParams();
    if (params?.caseStatus && params.caseStatus !== 'ALL') query.set('caseStatus', params.caseStatus);
    if (params?.search) query.set('search', params.search);
    const queryString = query.toString();
    const url = `${API_BASE}/management/calls${queryString ? `?${queryString}` : ''}`;
    try {
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const calls = await handleResponse<VoiceCall[]>(res);
        if (Array.isArray(calls) && calls.length > 0) {
          calls.forEach(c => {
            const idx = localVoiceCalls.findIndex(existing => existing.id === c.id || existing.callId === c.callId);
            if (idx >= 0) localVoiceCalls[idx] = { ...localVoiceCalls[idx], ...c };
            else localVoiceCalls.unshift(c);
          });
          try {
            localStorage.setItem('hospital_local_voice_calls', JSON.stringify(localVoiceCalls));
          } catch (e) {}
        }
        return calls;
      }
    } catch (e) {}

    // Fallback to local filtering
    let results = [...localVoiceCalls];
    if (params?.caseStatus && params.caseStatus !== 'ALL') {
      results = results.filter(c => c.caseStatus === params.caseStatus);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      results = results.filter(c =>
        c.phoneNumber.includes(s) ||
        (c.callerName && c.callerName.toLowerCase().includes(s)) ||
        (c.transcript && c.transcript.toLowerCase().includes(s)) ||
        (c.summary && c.summary.toLowerCase().includes(s))
      );
    }
    return results;
  },

  saveVoiceCall: async (data: Partial<VoiceCall>): Promise<VoiceCall> => {
    const callPayload: VoiceCall = {
      id: data.id || `call-${Date.now().toString().slice(-6)}`,
      callId: data.callId || `vcall_${Date.now()}`,
      callerName: data.callerName || 'Unknown Caller',
      phoneNumber: data.phoneNumber || '9876543210',
      startedAt: data.startedAt || new Date().toISOString(),
      endedAt: data.endedAt || new Date().toISOString(),
      durationSeconds: data.durationSeconds || 60,
      language: data.language || 'KN',
      status: data.status || 'COMPLETED',
      caseStatus: data.caseStatus || 'NEW',
      intent: data.intent || 'APPOINTMENT_BOOKING',
      appointmentId: data.appointmentId,
      bookedAppointmentDetails: data.bookedAppointmentDetails,
      outcome: data.outcome || (data.appointmentId ? 'APPOINTMENT_CREATED' : 'INFORMATION_PROVIDED'),
      summary: data.summary,
      transcript: data.transcript,
      dialogueTurns: data.dialogueTurns || [],
      assignedReceptionist: data.assignedReceptionist,
      receptionistNotes: data.receptionistNotes,
      createdAt: data.createdAt || new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE}/telephony/calls`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(callPayload)
      });
      if (res.ok) {
        const saved = await handleResponse<VoiceCall>(res);
        saveAndNotifyVoiceCall(saved);
        return saved;
      }
    } catch (e) {}

    saveAndNotifyVoiceCall(callPayload);
    return callPayload;
  },

  updateVoiceCallCase: async (
    id: string,
    updates: { caseStatus?: string; assignedReceptionist?: string; receptionistNotes?: string }
  ): Promise<VoiceCall> => {
    try {
      const res = await fetch(`${API_BASE}/management/calls/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const saved = await handleResponse<VoiceCall>(res);
        saveAndNotifyVoiceCall(saved);
        return saved;
      }
    } catch (e) {}

    const call = localVoiceCalls.find(c => c.id === id || c.callId === id);
    if (!call) throw new Error('Voice call case not found');
    if (updates.caseStatus) call.caseStatus = updates.caseStatus as any;
    if (updates.assignedReceptionist !== undefined) call.assignedReceptionist = updates.assignedReceptionist;
    if (updates.receptionistNotes !== undefined) call.receptionistNotes = updates.receptionistNotes;
    saveAndNotifyVoiceCall(call);
    return call;
  },

  closeVoiceCallCase: async (id: string, resolutionNotes?: string): Promise<VoiceCall> => {
    try {
      const res = await fetch(`${API_BASE}/management/calls/${id}/close`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ resolutionNotes })
      });
      if (res.ok) {
        const saved = await handleResponse<VoiceCall>(res);
        saveAndNotifyVoiceCall(saved);
        return saved;
      }
    } catch (e) {}

    const call = localVoiceCalls.find(c => c.id === id || c.callId === id);
    if (!call) throw new Error('Voice call case not found');
    call.caseStatus = 'CLOSED';
    call.closedAt = new Date().toISOString();
    call.closedBy = 'Receptionist On Duty';
    if (resolutionNotes) {
      call.receptionistNotes = call.receptionistNotes
        ? `${call.receptionistNotes}\n[CLOSED]: ${resolutionNotes}`
        : `[CLOSED]: ${resolutionNotes}`;
    }
    saveAndNotifyVoiceCall(call);
    return call;
  },

  synthesizeVoisLabsVoice: async (
    text: string,
    language: 'kn' | 'en' | 'kannada' | 'english' = 'kn',
    voiceId?: string,
    tone: string = 'warm_friendly'
  ): Promise<{ audioBlobUrl?: string; audioBase64?: string; audioFormat?: string; message?: string }> => {
    const res = await fetch(`${API_BASE}/ai/voice/voislabs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, language, voiceId, tone })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Synthesis failed');
    }
    const contentType = res.headers.get('content-type') || 'audio/mpeg';
    if (contentType.includes('application/json')) {
      return handleResponse(res);
    }
    const blob = await res.blob();
    const audioBlobUrl = URL.createObjectURL(blob);
    return { audioBlobUrl, audioFormat: 'mp3' };
  }
};

