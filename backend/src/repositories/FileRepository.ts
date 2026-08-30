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
    return this.readJson(this.notificationsPath, []).filter(n => n.userId === userId);
  }
  public addNotification(notification: UserNotification): UserNotification {
    const list = this.readJson(this.notificationsPath, []);
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

  // Voice Calls Telephony Storage
  private voiceCallsPath = path.join(DATA_DIR, 'voice_calls.json');
  public getVoiceCalls(): VoiceCall[] {
    return this.readJson(this.voiceCallsPath, []);
  }
  public saveVoiceCall(call: VoiceCall): VoiceCall {
    const list = this.getVoiceCalls();
    const idx = list.findIndex(c => c.callId === call.callId);
    if (idx >= 0) list[idx] = call;
    else list.unshift(call);
    this.writeJson(this.voiceCallsPath, list);
    return call;
  }
}
