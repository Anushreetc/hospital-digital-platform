import { Router, Response } from 'express';
import { FileRepository } from '../repositories/FileRepository';
import { AppointmentService } from '../services/AppointmentService';
import { VoiceTtsService } from '../services/VoiceTtsService';

export const createAiRouter = (
  fileRepo: FileRepository,
  appointmentService: AppointmentService
): Router => {
  const router = Router();
  const ttsService = new VoiceTtsService();

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
      NOT_FOUND: 404
    };
    return res.status(statusMap[code] || defaultStatus).json({
      success: false,
      error: { code, message: err.message || 'An error occurred.' },
      requestId: `req_ai_${Date.now()}`
    });
  };

  // 1. Hospital Info Tool
  router.get('/hospital', (_req, res) => {
    const info = fileRepo.getHospitalInfo();
    sendSuccess(res, {
      name: info.name,
      tagline: info.tagline,
      address: info.address,
      phone: info.phone,
      emergencyPhone: info.emergencyPhone,
      email: info.email,
      operatingHours: info.operatingHours,
      certifications: info.certifications,
      statistics: info.statistics
    });
  });

  // 2. Departments Tool
  router.get('/departments', (_req, res) => {
    const depts = fileRepo.getDepartments().filter(d => d.active).map(d => ({
      id: d.id,
      name: d.name,
      code: d.code,
      description: d.description
    }));
    sendSuccess(res, depts);
  });

  // 3. Services Tool
  router.get('/services', (_req, res) => {
    const services = fileRepo.getServices().filter(s => s.active).map(s => ({
      id: s.id,
      name: s.name,
      shortDescription: s.shortDescription,
      fullDescription: s.fullDescription
    }));
    sendSuccess(res, services);
  });

  // 4. Facilities Tool
  router.get('/facilities', (_req, res) => {
    const facilities = fileRepo.getFacilities().filter(f => f.active).map(f => ({
      id: f.id,
      name: f.name,
      description: f.description
    }));
    sendSuccess(res, facilities);
  });

  // 5. Doctors Directory Tool
  router.get('/doctors', (req, res) => {
    const { department, specialization, name } = req.query as Record<string, string>;
    let docs = fileRepo.getDoctors().filter(d => d.active);

    if (department) {
      const dept = department.toLowerCase();
      docs = docs.filter(d =>
        d.departmentId.toLowerCase() === dept ||
        (d.departmentName && d.departmentName.toLowerCase().includes(dept))
      );
    }
    if (specialization) {
      docs = docs.filter(d => d.specialization.toLowerCase().includes(specialization.toLowerCase()));
    }
    if (name) {
      docs = docs.filter(d => d.name.toLowerCase().includes(name.toLowerCase()));
    }

    const safeDocs = docs.map(d => ({
      id: d.id,
      name: d.name,
      qualification: d.qualification,
      designation: d.designation,
      specialization: d.specialization,
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      experienceYears: d.experienceYears,
      languages: d.languages,
      consultationFee: d.consultationFee,
      shortBio: d.bio
    }));

    sendSuccess(res, safeDocs);
  });

  // 6. Doctor Details Tool
  router.get('/doctors/:id', (req, res) => {
    const doc = fileRepo.getDoctorById(req.params.id);
    if (!doc || !doc.active) return sendError(res, { code: 'NOT_FOUND', message: 'Doctor not found.' });

    sendSuccess(res, {
      id: doc.id,
      name: doc.name,
      qualification: doc.qualification,
      designation: doc.designation,
      specialization: doc.specialization,
      departmentId: doc.departmentId,
      departmentName: doc.departmentName,
      experienceYears: doc.experienceYears,
      languages: doc.languages,
      consultationFee: doc.consultationFee,
      bio: doc.bio
    });
  });

  // 7. Check Doctor Availability Tool
  router.get('/doctors/:doctorId/availability', (req, res) => {
    const { date } = req.query as { date?: string };
    const doctorId = req.params.doctorId;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const check = appointmentService.checkDoctorAvailability(doctorId, targetDate);
    const standardSlots = [
      { time: '09:00 AM', available: check.available },
      { time: '10:00 AM', available: check.available },
      { time: '11:00 AM', available: check.available },
      { time: '12:00 PM', available: check.available },
      { time: '04:00 PM', available: check.available },
      { time: '05:00 PM', available: check.available },
      { time: '06:00 PM', available: check.available }
    ];

    sendSuccess(res, {
      doctorId,
      date: targetDate,
      available: check.available,
      reason: check.reason,
      slots: standardSlots
    });
  });

  // 8. Create Appointment Tool
  router.post('/appointments', async (req, res) => {
    try {
      const {
        patientName,
        phone,
        departmentId,
        doctorId,
        date,
        time,
        reason,
        language
      } = req.body;

      const idempotencyKey = req.headers['idempotency-key'] as string || req.body.idempotencyKey;

      const result = await appointmentService.createAppointment({
        patientName,
        patientPhone: phone,
        departmentId,
        doctorId,
        preferredDate: date,
        preferredTime: time,
        reason,
        source: 'VOICE_KANNADA',
        language: language === 'kn' ? 'KN' : 'EN',
        idempotencyKey
      });

      sendSuccess(res, {
        appointmentId: result.appointment.id,
        patientName: result.appointment.patientName,
        doctorName: result.appointment.doctorName,
        departmentName: result.appointment.departmentName,
        date: result.appointment.preferredDate,
        time: result.appointment.preferredTime,
        status: result.appointment.status,
        isDuplicate: result.isDuplicate
      }, result.isDuplicate ? 200 : 201);
    } catch (err) {
      sendError(res, err);
    }
  });

  // 9. Get Appointment Status Tool
  router.get('/appointments/:id', (req, res) => {
    const appt = appointmentService.getAppointmentById(req.params.id);
    if (!appt) return sendError(res, { code: 'NOT_FOUND', message: 'Appointment ID not found.' });

    sendSuccess(res, {
      appointmentId: appt.id,
      patientName: appt.patientName,
      doctorName: appt.doctorName,
      departmentName: appt.departmentName,
      date: appt.preferredDate,
      time: appt.preferredTime,
      status: appt.status
    });
  });

  // 11. Voice Engine Providers List
  router.get('/voice/providers', (_req, res) => {
    sendSuccess(res, ttsService.getAvailableProviders());
  });

  // 12. Voice Synthesis Route (Kannada Neural Stream / ElevenLabs / Fish Audio)
  router.post('/voice/tts', async (req, res) => {
    try {
      const { text, provider, voiceId, language } = req.body;
      if (!text) return sendError(res, { code: 'VALIDATION_ERROR', message: 'Text prompt required.' });

      let audioBuffer: Buffer;
      if (provider === 'fish_audio') {
        audioBuffer = await ttsService.synthesizeFishAudio(text);
      } else if (provider === 'elevenlabs') {
        audioBuffer = await ttsService.synthesizeElevenLabs(text, voiceId);
      } else {
        const langCode = (language === 'EN' || language === 'en') ? 'en-IN' : 'kn';
        audioBuffer = await ttsService.synthesizeKannadaVoice(text, langCode);
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      return res.send(audioBuffer);
    } catch (err: any) {
      sendError(res, err);
    }
  });

  return router;
};
