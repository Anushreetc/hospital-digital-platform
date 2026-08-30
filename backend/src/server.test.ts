import { describe, it, expect, beforeEach } from 'vitest';
import { AppointmentService } from './services/AppointmentService';
import { FileRepository } from './repositories/FileRepository';
import { GoogleSheetsRepository } from './repositories/GoogleSheetsRepository';
import { AuthService } from './services/AuthService';
import { VoiceNluService } from './services/VoiceNluService';

describe('Hospital Backend Core Tests', () => {
  let fileRepo: FileRepository;
  let sheetsRepo: GoogleSheetsRepository;
  let appointmentService: AppointmentService;
  let authService: AuthService;
  let voiceService: VoiceNluService;

  beforeEach(() => {
    fileRepo = new FileRepository();
    sheetsRepo = new GoogleSheetsRepository();
    appointmentService = new AppointmentService(fileRepo, sheetsRepo);
    authService = new AuthService(fileRepo);
    voiceService = new VoiceNluService(appointmentService, fileRepo);
  });

  describe('Appointment ID Generation & Phone Normalization', () => {
    it('normalizes 10-digit Indian phone numbers to +91', () => {
      expect(appointmentService.normalizePhone('9876543210')).toBe('+919876543210');
      expect(appointmentService.isValidIndianPhone('9876543210')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(appointmentService.isValidIndianPhone('12345')).toBe(false);
      expect(appointmentService.isValidIndianPhone('0000000000')).toBe(false);
    });
  });

  describe('Appointment Creation & Validation', () => {
    it('successfully creates an appointment with valid fields', async () => {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const result = await appointmentService.createAppointment({
        patientName: 'Test Patient',
        patientPhone: uniquePhone,
        departmentId: 'dept-cardio',
        doctorId: 'doc-101',
        preferredDate: todayStr,
        preferredTime: '10:00 AM',
        reason: 'Regular Cardiology Checkup'
      });

      expect(result.appointment.id).toMatch(/^APT-\d{8}-\d{4}$/);
      expect(result.appointment.patientName).toBe('Test Patient');
      expect(result.appointment.status).toBe('NEW');
    });

    it('prevents duplicate active appointments for same patient/doctor/date', async () => {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const uniquePhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
      const apptData = {
        patientName: 'Duplicate Test',
        patientPhone: uniquePhone,
        departmentId: 'dept-cardio',
        doctorId: 'doc-101',
        preferredDate: todayStr,
        preferredTime: '10:00 AM',
        reason: 'Joint pain check'
      };

      await appointmentService.createAppointment(apptData);

      await expect(appointmentService.createAppointment(apptData)).rejects.toMatchObject({
        code: 'DUPLICATE_REQUEST'
      });
    });
  });

  describe('Appointment Status State Machine', () => {
    it('allows valid status transitions (NEW -> CONTACTED -> CONFIRMED)', async () => {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const uniquePhone = `96${Math.floor(10000000 + Math.random() * 90000000)}`;
      const created = await appointmentService.createAppointment({
        patientName: 'State Machine Test',
        patientPhone: uniquePhone,
        departmentId: 'dept-cardio',
        doctorId: 'doc-101',
        preferredDate: todayStr,
        preferredTime: '11:00 AM',
        reason: 'Fever'
      });

      const actor = { id: 'usr-admin', name: 'Admin', role: 'HOSPITAL_ADMIN' };

      const contacted = await appointmentService.updateStatus(created.appointment.id, 'CONTACTED', actor);
      expect(contacted.status).toBe('CONTACTED');

      const confirmed = await appointmentService.updateStatus(created.appointment.id, 'CONFIRMED', actor);
      expect(confirmed.status).toBe('CONFIRMED');
    });

    it('rejects invalid status transitions (COMPLETED -> CONFIRMED)', async () => {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const uniquePhone = `95${Math.floor(10000000 + Math.random() * 90000000)}`;
      const created = await appointmentService.createAppointment({
        patientName: 'State Machine Fail Test',
        patientPhone: uniquePhone,
        departmentId: 'dept-cardio',
        doctorId: 'doc-101',
        preferredDate: todayStr,
        preferredTime: '11:00 AM',
        reason: 'Checkup'
      });

      const actor = { id: 'usr-admin', name: 'Admin', role: 'HOSPITAL_ADMIN' };
      await appointmentService.updateStatus(created.appointment.id, 'CONFIRMED', actor);
      await appointmentService.updateStatus(created.appointment.id, 'COMPLETED', actor);

      await expect(appointmentService.updateStatus(created.appointment.id, 'CONFIRMED', actor)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('Admin Auth & Password Validation', () => {
    it('authenticates valid admin credentials', async () => {
      const res = await authService.managementLogin('superadmin@citycarehospital.example.com', 'SuperAdmin@123');
      expect(res.token).toBeDefined();
      expect(res.user.role).toBe('SUPER_ADMIN');
    });

    it('rejects invalid admin passwords', async () => {
      await expect(authService.managementLogin('superadmin@citycarehospital.example.com', 'WrongPassword')).rejects.toMatchObject({
        code: 'UNAUTHORIZED'
      });
    });
  });

  describe('Kannada Voice Agent Engine', () => {
    it('progresses voice state machine from GREETING to COLLECT_NAME', async () => {
      const session = voiceService.getOrCreateSession();
      const res = await voiceService.processUtterance(session.sessionId, 'ನಮಸ್ಕಾರ');
      expect(res.state).toBe('COLLECT_NAME');
      expect(res.promptKannada).toContain('ಹೆಸರು ಏನು');
    });
  });

  describe('Telephony & n8n / Vapi Webhook Integration', () => {
    it('handles Vapi tool-call to search doctors and create appointment', async () => {
      const { TelephonyService } = await import('./services/TelephonyService');
      const telephonyService = new TelephonyService(fileRepo, appointmentService);

      // Search Doctors tool call
      const searchRes = await telephonyService.handleVapiToolCall({
        message: {
          type: 'tool-calls',
          toolCalls: [
            {
              id: 'tc-test-1',
              function: {
                name: 'searchDoctors',
                arguments: JSON.stringify({ department: 'Cardiology' })
              }
            }
          ]
        }
      });
      expect(searchRes.results).toBeDefined();
      expect(searchRes.results[0].result.success).toBe(true);
      expect(searchRes.results[0].result.data.length).toBeGreaterThan(0);

      // n8n Webhook Action
      const n8nRes = await telephonyService.handleN8nWebhook({
        action: 'getDepartments'
      });
      expect(n8nRes.success).toBe(true);
      expect(n8nRes.count).toBeGreaterThan(0);
    });
  });
});

