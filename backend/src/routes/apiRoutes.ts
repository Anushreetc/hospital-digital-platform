import { Router, Response } from 'express';
import { FileRepository } from '../repositories/FileRepository';
import { AppointmentService } from '../services/AppointmentService';
import { VoiceNluService } from '../services/VoiceNluService';
import { AuthService } from '../services/AuthService';
import { createAuthMiddleware, requireRoles, AuthenticatedRequest } from '../middleware/authMiddleware';

export const createApiRouter = (
  fileRepo: FileRepository,
  appointmentService: AppointmentService,
  voiceService: VoiceNluService,
  authService: AuthService
): Router => {
  const router = Router();
  const authenticate = createAuthMiddleware(authService);

  const sendSuccess = (res: Response, data: any, status = 200) => res.status(status).json({ success: true, data });

  const sendError = (res: Response, err: any, defaultStatus = 400) => {
    const code = err.code || 'INTERNAL_ERROR';
    const statusMap: Record<string, number> = {
      VALIDATION_ERROR: 400,
      INVALID_PHONE: 400,
      INVALID_DATE: 400,
      INVALID_TIME: 400,
      DOCTOR_UNAVAILABLE: 400,
      DUPLICATE_REQUEST: 409,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      NOT_FOUND: 404
    };
    return res.status(statusMap[code] || defaultStatus).json({
      success: false,
      error: { code, message: err.message || 'An error occurred.' },
      requestId: `req_${Date.now()}`
    });
  };

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================
  router.get('/hospital', (_req, res) => sendSuccess(res, fileRepo.getHospitalInfo()));
  router.get('/departments', (_req, res) => sendSuccess(res, fileRepo.getDepartments().filter(d => d.active)));
  router.get('/services', (_req, res) => sendSuccess(res, fileRepo.getServices().filter(s => s.active).sort((a, b) => a.displayOrder - b.displayOrder)));
  router.get('/facilities', (_req, res) => sendSuccess(res, fileRepo.getFacilities().filter(f => f.active).sort((a, b) => a.displayOrder - b.displayOrder)));
  
  router.get('/doctors', (req, res) => {
    const { departmentId } = req.query;
    let docs = fileRepo.getDoctors().filter(d => d.active);
    if (departmentId) docs = docs.filter(d => d.departmentId === departmentId);
    sendSuccess(res, docs);
  });

  router.get('/doctors/:id', (req, res) => {
    const doc = fileRepo.getDoctorById(req.params.id);
    if (!doc) return sendError(res, { code: 'NOT_FOUND', message: 'Doctor not found.' });
    sendSuccess(res, doc);
  });

  router.get('/doctors/:id/availability', (req, res) => {
    const avail = fileRepo.getAvailabilityByDoctorId(req.params.id);
    sendSuccess(res, avail || { doctorId: req.params.id, weeklySchedule: [], unavailabilities: [] });
  });

  router.post('/appointments', async (req, res) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string || req.body.idempotencyKey;
      const result = await appointmentService.createAppointment({
        ...req.body,
        idempotencyKey,
        source: req.body.source || 'WEBSITE'
      });
      sendSuccess(res, result.appointment, result.isDuplicate ? 200 : 201);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/voice/appointments', async (req, res) => {
    try {
      const { sessionId, utterance } = req.body;
      const response = await voiceService.processUtterance(sessionId, utterance);
      sendSuccess(res, response);
    } catch (err) {
      sendError(res, err);
    }
  });

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================
  // 1. Patient Auth
  router.post('/auth/patient/signup', async (req, res) => {
    try {
      const result = await authService.patientSignup(req.body);
      sendSuccess(res, result, 201);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/auth/patient/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.patientLogin(email, password);
      sendSuccess(res, result);
    } catch (err) {
      sendError(res, err);
    }
  });

  // 2. Doctor Auth
  router.post('/auth/doctor/signup', async (req, res) => {
    try {
      const result = await authService.doctorSignup(req.body);
      sendSuccess(res, result, 201);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/auth/doctor/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.doctorLogin(email, password);
      sendSuccess(res, result);
    } catch (err) {
      sendError(res, err);
    }
  });

  // 3. Management Auth
  router.post('/auth/management/signup', async (req, res) => {
    try {
      const result = await authService.managementSignup(req.body);
      sendSuccess(res, result, 201);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/auth/management/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await authService.managementLogin(email, password);
      sendSuccess(res, result);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/auth/logout', (_req, res) => sendSuccess(res, { message: 'Logged out successfully.' }));

  // ==========================================
  // PATIENT PORTAL ENDPOINTS
  // ==========================================
  router.get('/patient/appointments', authenticate, requireRoles('PATIENT'), (req: AuthenticatedRequest, res) => {
    const patientPhone = req.user!.email; // match by phone/email or patientId
    const patient = fileRepo.getPatientById(req.user!.userId);
    const normalizedPhone = patient ? appointmentService.normalizePhone(patient.phone) : '';
    
    const appointments = fileRepo.getAppointments().filter(a =>
      a.patientId === req.user!.userId ||
      (normalizedPhone && a.patientPhone === normalizedPhone)
    );
    sendSuccess(res, appointments);
  });

  router.patch('/patient/appointments/:id', authenticate, requireRoles('PATIENT'), async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body;
      if (status !== 'CANCELLED') {
        return sendError(res, { code: 'VALIDATION_ERROR', message: 'Patients can only cancel appointments.' });
      }
      const updated = await appointmentService.updateStatus(req.params.id, 'CANCELLED', {
        id: req.user!.userId,
        name: req.user!.name,
        role: 'PATIENT'
      });
      sendSuccess(res, updated);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get('/patient/notifications', authenticate, requireRoles('PATIENT'), (req: AuthenticatedRequest, res) => {
    sendSuccess(res, fileRepo.getNotificationsForUser(req.user!.userId));
  });

  // ==========================================
  // DOCTOR PORTAL ENDPOINTS
  // ==========================================
  router.get('/doctor/appointments', authenticate, requireRoles('DOCTOR'), (req: AuthenticatedRequest, res) => {
    const doctor = fileRepo.getDoctorByUserId(req.user!.userId);
    if (!doctor) return sendSuccess(res, []);
    const appointments = fileRepo.getAppointments().filter(a => a.doctorId === doctor.id);
    sendSuccess(res, appointments);
  });

  router.patch('/doctor/appointments/:id', authenticate, requireRoles('DOCTOR'), async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body;
      const updated = await appointmentService.updateStatus(req.params.id, status, {
        id: req.user!.userId,
        name: req.user!.name,
        role: 'DOCTOR'
      });
      sendSuccess(res, updated);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get('/doctor/availability', authenticate, requireRoles('DOCTOR'), (req: AuthenticatedRequest, res) => {
    const doctor = fileRepo.getDoctorByUserId(req.user!.userId);
    if (!doctor) return sendError(res, { code: 'NOT_FOUND', message: 'Doctor profile not found.' });
    const avail = fileRepo.getAvailabilityByDoctorId(doctor.id);
    sendSuccess(res, avail || { doctorId: doctor.id, weeklySchedule: [], unavailabilities: [] });
  });

  // ==========================================
  // HOSPITAL MANAGEMENT PORTAL ENDPOINTS
  // ==========================================
  router.get('/management/dashboard', authenticate, requireRoles('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'), (_req, res) => {
    const appointments = fileRepo.getAppointments();
    const doctors = fileRepo.getDoctors();
    const doctorApps = fileRepo.getDoctorApplications();
    const patients = fileRepo.getPatients();
    const todayStr = new Date().toISOString().split('T')[0];

    sendSuccess(res, {
      todayAppointmentsCount: appointments.filter(a => a.preferredDate === todayStr).length,
      totalDoctorsCount: doctors.filter(d => d.active).length,
      pendingDoctorApplicationsCount: doctorApps.filter(a => a.status === 'PENDING_VERIFICATION').length,
      totalPatientsCount: patients.length,
      statusCounts: {
        NEW: appointments.filter(a => a.status === 'NEW').length,
        CONTACTED: appointments.filter(a => a.status === 'CONTACTED').length,
        CONFIRMED: appointments.filter(a => a.status === 'CONFIRMED').length,
        CANCELLED: appointments.filter(a => a.status === 'CANCELLED').length,
        COMPLETED: appointments.filter(a => a.status === 'COMPLETED').length,
        NO_SHOW: appointments.filter(a => a.status === 'NO_SHOW').length
      },
      recentAppointments: appointments.slice(0, 5)
    });
  });

  router.get('/management/appointments', authenticate, requireRoles('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'), (req, res) => {
    const { search, doctor, department, status, date, source } = req.query as Record<string, string>;
    const list = appointmentService.getAppointments({ search, doctor, department, status, date, source });
    sendSuccess(res, list);
  });

  router.patch('/management/appointments/:id', authenticate, requireRoles('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body;
      const updated = await appointmentService.updateStatus(req.params.id, status, {
        id: req.user!.userId,
        name: req.user!.name,
        role: req.user!.role
      });
      sendSuccess(res, updated);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/management/appointments/:id/notes', authenticate, requireRoles('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'), async (req: AuthenticatedRequest, res) => {
    try {
      const { text } = req.body;
      const updated = await appointmentService.addNote(req.params.id, text, {
        id: req.user!.userId,
        name: req.user!.name,
        role: req.user!.role
      });
      sendSuccess(res, updated);
    } catch (err) {
      sendError(res, err);
    }
  });

  // Doctor Application Approvals
  router.get('/management/doctor-applications', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (_req, res) => {
    sendSuccess(res, fileRepo.getDoctorApplications());
  });

  router.patch('/management/doctor-applications/:id', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res) => {
    try {
      const { status } = req.body; // 'APPROVED' or 'REJECTED'
      const app = fileRepo.getDoctorApplicationById(req.params.id);
      if (!app) return sendError(res, { code: 'NOT_FOUND', message: 'Doctor application not found.' });

      app.status = status;
      app.reviewedBy = req.user!.name;
      app.reviewedAt = new Date().toISOString();
      fileRepo.saveDoctorApplication(app);

      if (status === 'APPROVED') {
        // Activate doctor user account & create active doctor record!
        const user = fileRepo.getUserById(app.userId);
        if (user) {
          user.active = true;
          fileRepo.saveUser(user);
        }

        const newDoctor = fileRepo.saveDoctor({
          id: `doc-${Date.now()}`,
          userId: app.userId,
          name: app.name,
          email: app.email,
          phone: app.phone,
          photoUrl: app.photoUrl,
          qualification: app.qualification,
          designation: app.designation,
          specialization: app.specialization,
          departmentId: app.departmentId,
          departmentName: app.departmentName,
          experienceYears: app.experienceYears,
          registrationNumber: app.registrationNumber,
          bio: app.bio,
          languages: app.languages,
          active: true
        });

        // Initialize default availability
        fileRepo.saveAvailability({
          id: `avail-${Date.now()}`,
          doctorId: newDoctor.id,
          weeklySchedule: [
            { dayOfWeek: 'Monday', slots: [{ startTime: '09:00 AM', endTime: '01:00 PM' }] },
            { dayOfWeek: 'Wednesday', slots: [{ startTime: '09:00 AM', endTime: '01:00 PM' }] },
            { dayOfWeek: 'Friday', slots: [{ startTime: '09:00 AM', endTime: '01:00 PM' }] }
          ],
          unavailabilities: []
        });
      }

      fileRepo.addAuditLog({
        id: `audit-${Date.now()}`,
        actor: { id: req.user!.userId, name: req.user!.name, role: req.user!.role },
        action: `DOCTOR_APPLICATION_${status}`,
        entity: 'DoctorApplication',
        entityId: app.id,
        timestamp: new Date().toISOString(),
        details: { applicantName: app.name }
      });

      sendSuccess(res, app);
    } catch (err) {
      sendError(res, err);
    }
  });

  // Doctor Directory Management
  router.get('/management/doctors', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (_req, res) => {
    sendSuccess(res, fileRepo.getDoctors());
  });

  router.post('/management/doctors', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res) => {
    const doc = fileRepo.saveDoctor({ id: `doc-${Date.now()}`, ...req.body });
    sendSuccess(res, doc, 201);
  });

  router.patch('/management/doctors/:id', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (req: AuthenticatedRequest, res) => {
    const existing = fileRepo.getDoctorById(req.params.id);
    if (!existing) return sendError(res, { code: 'NOT_FOUND', message: 'Doctor not found.' });
    const updated = fileRepo.saveDoctor({ ...existing, ...req.body });
    sendSuccess(res, updated);
  });

  // Patients Directory
  router.get('/management/patients', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (_req, res) => {
    const patients = fileRepo.getPatients().map(({ passwordHash, ...p }) => p);
    sendSuccess(res, patients);
  });

  // CMS: Departments, Services, Facilities, Hospital Content
  router.get('/management/departments', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (_req, res) => sendSuccess(res, fileRepo.getDepartments()));
  router.post('/management/departments', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (req, res) => sendSuccess(res, fileRepo.saveDepartment({ id: `dept-${Date.now()}`, ...req.body }), 201));

  router.get('/management/services', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (_req, res) => sendSuccess(res, fileRepo.getServices()));
  router.post('/management/services', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (req, res) => sendSuccess(res, fileRepo.saveService({ id: `srv-${Date.now()}`, ...req.body }), 201));

  router.get('/management/facilities', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (_req, res) => sendSuccess(res, fileRepo.getFacilities()));
  router.post('/management/facilities', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (req, res) => sendSuccess(res, fileRepo.saveFacility({ id: `fac-${Date.now()}`, ...req.body }), 201));

  router.get('/management/content', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (_req, res) => sendSuccess(res, fileRepo.getHospitalInfo()));
  router.patch('/management/content', authenticate, requireRoles('HOSPITAL_ADMIN', 'SUPER_ADMIN'), (req, res) => sendSuccess(res, fileRepo.updateHospitalInfo(req.body)));

  // Users & Audit Logs
  router.get('/management/users', authenticate, requireRoles('SUPER_ADMIN'), (_req, res) => sendSuccess(res, fileRepo.getUsers().map(({ passwordHash, ...u }) => u)));
  router.patch('/management/users/:id', authenticate, requireRoles('SUPER_ADMIN'), (req, res) => {
    const user = fileRepo.getUserById(req.params.id);
    if (!user) return sendError(res, { code: 'NOT_FOUND', message: 'User not found.' });
    const updated = fileRepo.saveUser({ ...user, ...req.body });
    const { passwordHash, ...safe } = updated;
    sendSuccess(res, safe);
  });

  router.get('/management/audit-logs', authenticate, requireRoles('SUPER_ADMIN'), (_req, res) => sendSuccess(res, fileRepo.getAuditLogs()));

  return router;
};
