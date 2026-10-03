import fs from 'fs';
import path from 'path';
import {
  HospitalInfo,
  Department,
  Doctor,
  DoctorApplication,
  PatientUser,
  DoctorAvailability,
  ServiceItem,
  FacilityItem,
  Appointment,
  AdminUser,
  AuditLog,
  UserNotification,
  VoiceCall
} from '../models/types';
import {
  defaultHospitalInfo,
  defaultDepartments,
  defaultDoctors,
  defaultAvailabilities,
  defaultServices,
  defaultFacilities,
  getInitialAdminUsers
} from '../utils/seedData';

const DATA_DIR = path.join(__dirname, '../../data');

export class FileRepository {
  private hospitalInfoPath = path.join(DATA_DIR, 'hospital_info.json');
  private departmentsPath = path.join(DATA_DIR, 'departments.json');
  private doctorsPath = path.join(DATA_DIR, 'doctors.json');
  private doctorAppsPath = path.join(DATA_DIR, 'doctor_applications.json');
  private patientsPath = path.join(DATA_DIR, 'patients.json');
  private availabilitiesPath = path.join(DATA_DIR, 'availabilities.json');
  private servicesPath = path.join(DATA_DIR, 'services.json');
  private facilitiesPath = path.join(DATA_DIR, 'facilities.json');
  private appointmentsPath = path.join(DATA_DIR, 'appointments.json');
  private usersPath = path.join(DATA_DIR, 'users.json');
  private auditLogsPath = path.join(DATA_DIR, 'audit_logs.json');
  private notificationsPath = path.join(DATA_DIR, 'notifications.json');

  constructor() {
    this.ensureDataDir();
    this.seedDefaultsIfMissing();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private readJson<T>(filePath: string, fallback: T): T {
    try {
      if (!fs.existsSync(filePath)) {
        this.writeJson(filePath, fallback);
        return fallback;
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
      return fallback;
    }
  }

  private writeJson<T>(filePath: string, data: T): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err);
    }
  }

  private seedDefaultsIfMissing() {
    if (!fs.existsSync(this.hospitalInfoPath)) this.writeJson(this.hospitalInfoPath, defaultHospitalInfo);
    if (!fs.existsSync(this.departmentsPath)) this.writeJson(this.departmentsPath, defaultDepartments);
    if (!fs.existsSync(this.doctorsPath)) this.writeJson(this.doctorsPath, defaultDoctors);
    if (!fs.existsSync(this.doctorAppsPath)) this.writeJson(this.doctorAppsPath, []);
    if (!fs.existsSync(this.patientsPath)) this.writeJson(this.patientsPath, []);
    if (!fs.existsSync(this.availabilitiesPath)) this.writeJson(this.availabilitiesPath, defaultAvailabilities);
    if (!fs.existsSync(this.servicesPath)) this.writeJson(this.servicesPath, defaultServices);
    if (!fs.existsSync(this.facilitiesPath)) this.writeJson(this.facilitiesPath, defaultFacilities);
    if (!fs.existsSync(this.usersPath)) this.writeJson(this.usersPath, getInitialAdminUsers());
    if (!fs.existsSync(this.appointmentsPath)) this.writeJson(this.appointmentsPath, []);
    if (!fs.existsSync(this.auditLogsPath)) this.writeJson(this.auditLogsPath, []);
    if (!fs.existsSync(this.notificationsPath)) this.writeJson(this.notificationsPath, []);
  }

  // Hospital Info
  public getHospitalInfo(): HospitalInfo {
    return this.readJson(this.hospitalInfoPath, defaultHospitalInfo);
  }
  public updateHospitalInfo(info: HospitalInfo): HospitalInfo {
    this.writeJson(this.hospitalInfoPath, info);
    return info;
  }

  // Departments
  public getDepartments(): Department[] {
    return this.readJson(this.departmentsPath, defaultDepartments);
  }
  public getDepartmentById(id: string): Department | undefined {
    return this.getDepartments().find(d => d.id === id);
  }
  public saveDepartment(dept: Department): Department {
    const list = this.getDepartments();
    const idx = list.findIndex(d => d.id === dept.id);
    if (idx >= 0) list[idx] = dept;
    else list.push(dept);
    this.writeJson(this.departmentsPath, list);
    return dept;
  }

  // Doctors
  public getDoctors(): Doctor[] {
    return this.readJson(this.doctorsPath, defaultDoctors);
  }
  public getDoctorById(id: string): Doctor | undefined {
    return this.getDoctors().find(d => d.id === id);
  }
  public getDoctorByUserId(userId: string): Doctor | undefined {
    return this.getDoctors().find(d => d.userId === userId);
  }
  public saveDoctor(doc: Doctor): Doctor {
    const list = this.getDoctors();
    const idx = list.findIndex(d => d.id === doc.id);
    if (idx >= 0) list[idx] = doc;
    else list.push(doc);
    this.writeJson(this.doctorsPath, list);
    return doc;
  }

  // Doctor Applications (Approval Flow)
  public getDoctorApplications(): DoctorApplication[] {
    return this.readJson(this.doctorAppsPath, []);
  }
  public getDoctorApplicationById(id: string): DoctorApplication | undefined {
    return this.getDoctorApplications().find(a => a.id === id);
  }
  public saveDoctorApplication(app: DoctorApplication): DoctorApplication {
    const list = this.getDoctorApplications();
    const idx = list.findIndex(a => a.id === app.id);
    if (idx >= 0) list[idx] = app;
    else list.unshift(app);
    this.writeJson(this.doctorAppsPath, list);
    return app;
  }

  // Patients
  public getPatients(): PatientUser[] {
    return this.readJson(this.patientsPath, []);
  }
  public getPatientById(id: string): PatientUser | undefined {
    return this.getPatients().find(p => p.id === id);
  }
  public getPatientByEmail(email: string): PatientUser | undefined {
    return this.getPatients().find(p => p.email.toLowerCase() === email.toLowerCase());
  }
  public savePatient(patient: PatientUser): PatientUser {
    const list = this.getPatients();
    const idx = list.findIndex(p => p.id === patient.id);
    if (idx >= 0) list[idx] = patient;
    else list.push(patient);
    this.writeJson(this.patientsPath, list);
    return patient;
  }

  // Availabilities
  public getAvailabilities(): DoctorAvailability[] {
    return this.readJson(this.availabilitiesPath, defaultAvailabilities);
  }
  public getAvailabilityByDoctorId(doctorId: string): DoctorAvailability | undefined {
    return this.getAvailabilities().find(a => a.doctorId === doctorId);
  }
  public saveAvailability(avail: DoctorAvailability): DoctorAvailability {
    const list = this.getAvailabilities();
    const idx = list.findIndex(a => a.id === avail.id || a.doctorId === avail.doctorId);
    if (idx >= 0) list[idx] = avail;
    else list.push(avail);
    this.writeJson(this.availabilitiesPath, list);
    return avail;
  }

  // Services & Facilities
  public getServices(): ServiceItem[] {
    return this.readJson(this.servicesPath, defaultServices);
  }
  public saveService(service: ServiceItem): ServiceItem {
    const list = this.getServices();
    const idx = list.findIndex(s => s.id === service.id);
    if (idx >= 0) list[idx] = service;
    else list.push(service);
    this.writeJson(this.servicesPath, list);
    return service;
  }
  public getFacilities(): FacilityItem[] {
    return this.readJson(this.facilitiesPath, defaultFacilities);
  }
  public saveFacility(facility: FacilityItem): FacilityItem {
    const list = this.getFacilities();
    const idx = list.findIndex(f => f.id === facility.id);
    if (idx >= 0) list[idx] = facility;
    else list.push(facility);
    this.writeJson(this.facilitiesPath, list);
    return facility;
  }

  // Appointments
  public getAppointments(): Appointment[] {
    return this.readJson(this.appointmentsPath, []);
  }
  public getAppointmentById(id: string): Appointment | undefined {
    return this.getAppointments().find(a => a.id === id);
  }
  public getAppointmentByIdempotencyKey(key: string): Appointment | undefined {
    if (!key) return undefined;
    return this.getAppointments().find(a => a.idempotencyKey === key);
  }
  public saveAppointment(appointment: Appointment): Appointment {
    const list = this.getAppointments();
    const idx = list.findIndex(a => a.id === appointment.id);
    if (idx >= 0) list[idx] = appointment;
    else list.unshift(appointment);
    this.writeJson(this.appointmentsPath, list);
    return appointment;
  }

  // Admin / Management Users
  public getUsers(): AdminUser[] {
    return this.readJson(this.usersPath, getInitialAdminUsers());
  }
  public getUserById(id: string): AdminUser | undefined {
    return this.getUsers().find(u => u.id === id);
  }
  public getUserByUsername(username: string): AdminUser | undefined {
    return this.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase());
  }
  public saveUser(user: AdminUser): AdminUser {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.id === user.id);
    if (idx >= 0) list[idx] = user;
    else list.push(user);
    this.writeJson(this.usersPath, list);
    return user;
  }

  // Notifications
  public getNotificationsForUser(userId: string): UserNotification[] {
    return this.readJson<UserNotification[]>(this.notificationsPath, []).filter(n => n.userId === userId);
  }
  public addNotification(notification: UserNotification): UserNotification {
    const list = this.readJson<UserNotification[]>(this.notificationsPath, []);
    list.unshift(notification);
    this.writeJson(this.notificationsPath, list);
    return notification;
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.readJson(this.auditLogsPath, []);
  }
  public addAuditLog(log: AuditLog): AuditLog {
    const list = this.getAuditLogs();
    list.unshift(log);
    this.writeJson(this.auditLogsPath, list);
    return log;
  }

  // Voice Calls Telephony & AI Receptionist Storage
  private voiceCallsPath = path.join(DATA_DIR, 'voice_calls.json');

  private getDefaultVoiceCalls(): VoiceCall[] {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    return [
      {
        id: 'call-101',
        callId: 'vcall_kn_appt_101',
        callerName: 'ರಾಮೇಶ್ ಗೌಡ (Ramesh Gowda)',
        phoneNumber: '9845012345',
        startedAt: twoHoursAgo,
        endedAt: twoHoursAgo,
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
        createdAt: twoHoursAgo
      },
      {
        id: 'call-102',
        callId: 'vcall_en_ortho_102',
        callerName: 'Meera Sharma',
        phoneNumber: '9900112233',
        startedAt: fourHoursAgo,
        endedAt: fourHoursAgo,
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
        summary: 'Patient Meera Sharma booked consultation with Orthopedic specialist Dr. Suresh Rao for persistent knee joint pain.',
        transcript: 'AI Receptionist: Hello! Welcome to City Care Hospital. How may I assist you today?\nPatient: Hi, I need to consult an orthopedic specialist for my knee pain.\nAI Receptionist: Certainly. Dr. Suresh Rao in Orthopedics is available. May I have your full name and 10-digit phone number?\nPatient: Meera Sharma, 9900112233.\nAI Receptionist: Thank you Meera. Your appointment with Dr. Suresh Rao has been booked for tomorrow at 04:00 PM. ID: APT-20260921-002.',
        dialogueTurns: [
          { speaker: 'AI_RECEPTIONIST', text: 'Hello! Welcome to City Care Hospital. How may I assist you today?', timestamp: '00:02' },
          { speaker: 'PATIENT', text: 'Hi, I need to consult an orthopedic specialist for my knee pain.', timestamp: '00:14' },
          { speaker: 'AI_RECEPTIONIST', text: 'Certainly. Dr. Suresh Rao in Orthopedics is available. May I have your full name and 10-digit phone number?', timestamp: '00:26' },
          { speaker: 'PATIENT', text: 'Meera Sharma, 9900112233.', timestamp: '00:40' },
          { speaker: 'AI_RECEPTIONIST', text: 'Thank you Meera. Your appointment with Dr. Suresh Rao has been booked for tomorrow at 04:00 PM. ID: APT-20260921-002.', timestamp: '01:10' }
        ],
        createdAt: fourHoursAgo
      },
      {
        id: 'call-103',
        callId: 'vcall_kn_mri_103',
        callerName: 'ಸುರೇಶ್ ಕುಮಾರ್ (Suresh Kumar)',
        phoneNumber: '9886077889',
        startedAt: yesterday,
        endedAt: yesterday,
        durationSeconds: 84,
        language: 'BILINGUAL',
        status: 'COMPLETED',
        caseStatus: 'CLOSED',
        intent: 'GENERAL_OPD',
        assignedReceptionist: 'Priya Sharma (Admin)',
        receptionistNotes: 'Explained 3T MRI brain scan preparation guidelines. Patient will arrive at 9 AM with fasting. Case resolved.',
        closedAt: yesterday,
        closedBy: 'Priya Sharma (Admin)',
        outcome: 'INFORMATION_PROVIDED',
        summary: 'Inquiry regarding 3T MRI diagnostic scan timings, pricing, and required fasting preparations.',
        transcript: 'AI Receptionist: ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ / Welcome to City Care Hospital.\nPatient: ಸರ್, ಎಂಆರ್‌ಐ ಸ್ಕ್ಯಾನ್ ಸಮಯ ಮತ್ತು ಪೂರ್ವಸಿದ್ಧತೆ ಏನು?\nAI Receptionist: ನಮ್ಮಲ್ಲಿ 24 ಗಂಟೆಗಳ ಕಾಲ 3T MRI ಸ್ಕ್ಯಾನ್ ಸೌಲಭ್ಯವಿದೆ. ಪರೀಕ್ಷೆಗೆ 4 ಗಂಟೆಗಳ ಮುನ್ನ ಉಪವಾಸವಿರಬೇಕು.\nPatient: ಧನ್ಯವಾದಗಳು, ನಾನು ನಾಳೆ ಬರುತ್ತೇನೆ.\nAI Receptionist: ನಿಮಗೆ ಸ್ವಾಗತ! ನಮ್ಮ ರಿಸೆಪ್ಷನ್ ಸಂಖ್ಯೆ 080-23456789.',
        dialogueTurns: [
          { speaker: 'AI_RECEPTIONIST', text: 'ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ / Welcome to City Care Hospital.', timestamp: '00:02' },
          { speaker: 'PATIENT', text: 'ಸರ್, ಎಂಆರ್‌ಐ ಸ್ಕ್ಯಾನ್ ಸಮಯ ಮತ್ತು ಪೂರ್ವಸಿದ್ಧತೆ ಏನು?', timestamp: '00:15' },
          { speaker: 'AI_RECEPTIONIST', text: 'ನಮ್ಮಲ್ಲಿ 24 ಗಂಟೆಗಳ ಕಾಲ 3T MRI ಸ್ಕ್ಯಾನ್ ಸೌಲಭ್ಯವಿದೆ. ಪರೀಕ್ಷೆಗೆ 4 ಗಂಟೆಗಳ ಮುನ್ನ ಉಪವಾಸವಿರಬೇಕು.', timestamp: '00:32' },
          { speaker: 'PATIENT', text: 'ಧನ್ಯವಾದಗಳು, ನಾನು ನಾಳೆ ಬರುತ್ತೇನೆ.', timestamp: '00:50' },
          { speaker: 'AI_RECEPTIONIST', text: 'ನಿಮಗೆ ಸ್ವಾಗತ! ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನಮ್ಮ ರಿಸೆಪ್ಷನಿಸ್ಟ್ ತಂಡ ಸದಾ ಸಿದ್ಧವಾಗಿದೆ.', timestamp: '01:05' }
        ],
        createdAt: yesterday
      }
    ];
  }

  public getVoiceCalls(): VoiceCall[] {
    const list = this.readJson<VoiceCall[]>(this.voiceCallsPath, []);
    if (!list || list.length === 0) {
      const defaults = this.getDefaultVoiceCalls();
      this.writeJson(this.voiceCallsPath, defaults);
      return defaults;
    }
    return list;
  }

  public getVoiceCallById(idOrCallId: string): VoiceCall | undefined {
    return this.getVoiceCalls().find(c => c.id === idOrCallId || c.callId === idOrCallId);
  }

  public saveVoiceCall(call: VoiceCall): VoiceCall {
    const list = this.getVoiceCalls();
    if (!call.caseStatus) {
      call.caseStatus = 'NEW';
    }
    const idx = list.findIndex(c => c.callId === call.callId || c.id === call.id);
    if (idx >= 0) list[idx] = { ...list[idx], ...call };
    else list.unshift(call);
    this.writeJson(this.voiceCallsPath, list);
    return call;
  }
}
