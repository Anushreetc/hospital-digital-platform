import { AppointmentService } from './AppointmentService';
import { FileRepository } from '../repositories/FileRepository';
import { Appointment } from '../models/types';

export type VoiceState =
  | 'INIT'
  | 'GREETING'
  | 'COLLECT_NAME'
  | 'COLLECT_PHONE'
  | 'COLLECT_DEPARTMENT'
  | 'COLLECT_DOCTOR'
  | 'COLLECT_DATE'
  | 'COLLECT_TIME'
  | 'COLLECT_REASON'
  | 'VALIDATE'
  | 'SUMMARY'
  | 'CONFIRMATION'
  | 'CORRECTION'
  | 'SUBMIT'
  | 'CONFIRM_SUCCESS'
  | 'END';

export interface VoiceSession {
  sessionId: string;
  currentState: VoiceState;
  collectedSlots: {
    patientName?: string;
    patientPhone?: string;
    departmentId?: string;
    departmentName?: string;
    doctorId?: string;
    doctorName?: string;
    preferredDate?: string;
    preferredTime?: string;
    reason?: string;
  };
  language: 'KN' | 'EN';
  createdAt: string;
  updatedAt: string;
  completedAppointmentId?: string;
}

export interface VoiceResponse {
  sessionId: string;
  state: VoiceState;
  promptKannada: string;
  promptEnglish: string;
  collectedSlots: VoiceSession['collectedSlots'];
  appointment?: Appointment;
  isCompleted: boolean;
  requiresCorrection?: boolean;
}

export class VoiceNluService {
  private sessions: Map<string, VoiceSession> = new Map();
  private appointmentService: AppointmentService;
  private fileRepo: FileRepository;

  constructor(appointmentService: AppointmentService, fileRepo: FileRepository) {
    this.appointmentService = appointmentService;
    this.fileRepo = fileRepo;
  }

  public getOrCreateSession(sessionId?: string, lang: 'KN' | 'EN' = 'KN'): VoiceSession {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    const newId = sessionId || `vsession-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const session: VoiceSession = {
      sessionId: newId,
      currentState: 'GREETING',
      collectedSlots: {},
      language: lang,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.sessions.set(newId, session);
    return session;
  }

  /**
   * Medical Safety Classifier Guardrail
   */
  private isMedicalAdviceRequest(text: string): boolean {
    const keywords = [
      'medicine', 'dosage', 'tablet', 'symptom', 'cure', 'diagnose', 'prescription',
      'treatment', 'pain', 'fever', 'chest pain', 'heart attack', 'drug',
      'ಔಷಧ', 'ಮಾತ್ರೆ', 'ಖಾಯಿಲೆ', 'ರೋಗ', 'ಚಿಕಿತ್ಸೆ', 'ನೋವು', 'ಜ್ವರ'
    ];
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  /**
   * Main Voice State Machine Processor
   */
  public async processUtterance(sessionId: string, userUtterance: string): Promise<VoiceResponse> {
    const session = this.getOrCreateSession(sessionId);
    session.updatedAt = new Date().toISOString();
    const cleanText = userUtterance ? userUtterance.trim() : '';

    // Safety check for medical questions
    if (this.isMedicalAdviceRequest(cleanText)) {
      return {
        sessionId: session.sessionId,
        state: session.currentState,
        promptKannada: "ಕ್ಷಮಿಸಿ, ನಾನು ಕೇವಲ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸುವ ಸಹಾಯಕ. ವೈದ್ಯಕೀಯ ಸಲಹೆ ಅಥವಾ ತುರ್ತು ಮಾಹಿತಿಗಾಗಿ ದಯವಿಟ್ಟು ನೇರವಾಗಿ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ. ನಾವು ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಮುಂದುವರಿಸೋಣವೇ?",
        promptEnglish: "I am an automated appointment assistant and cannot provide medical diagnoses or prescriptions. For medical emergencies, please consult a doctor. Shall we continue booking your appointment?",
        collectedSlots: session.collectedSlots,
        isCompleted: false
      };
    }

    // Check for global correction intent ("change name", "change doctor", "change date", etc.)
    const correctionTarget = this.detectCorrectionIntent(cleanText);
    if (correctionTarget) {
      session.currentState = correctionTarget;
      return this.renderPromptForState(session, `ಹೌದು, ದಯವಿಟ್ಟು ಹೊಸ ${correctionTarget.replace('COLLECT_', '').toLowerCase()} ನೀಡಿ.`, `Sure, please provide the new details.`);
    }

    // Smart Multi-Slot NLU Entity Extraction (Fills phone, dept, doctor, date, time if present)
    session.collectedSlots = this.extractMultiSlots(cleanText, session.collectedSlots);

    switch (session.currentState) {
      case 'GREETING': {
        session.currentState = 'COLLECT_NAME';
        return {
          sessionId: session.sessionId,
          state: 'COLLECT_NAME',
          promptKannada: "ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಹೆಸರು ಏನು?",
          promptEnglish: "Hello! Welcome to City Care Hospital. What is your full name for the appointment?",
          collectedSlots: session.collectedSlots,
          isCompleted: false
        };
      }

      case 'COLLECT_NAME': {
        if (!cleanText || cleanText.length < 2) {
          return {
            sessionId: session.sessionId,
            state: 'COLLECT_NAME',
            promptKannada: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ತಿಳಿಸಿ.",
            promptEnglish: "Please state your full name clearly.",
            collectedSlots: session.collectedSlots,
            isCompleted: false
          };
        }
        session.collectedSlots.patientName = cleanText;
        session.currentState = 'COLLECT_PHONE';
        return {
          sessionId: session.sessionId,
          state: 'COLLECT_PHONE',
          promptKannada: `ಧನ್ಯವಾದಗಳು ${cleanText}. ನಿಮ್ಮ 10 ಅಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.`,
          promptEnglish: `Thank you ${cleanText}. Please provide your 10-digit mobile number.`,
          collectedSlots: session.collectedSlots,
          isCompleted: false
        };
      }

      case 'COLLECT_PHONE': {
        const extractedDigits = cleanText.replace(/\D/g, '');
        const validPhone = extractedDigits.length >= 10 ? extractedDigits.slice(-10) : null;
        if (!validPhone || !this.appointmentService.isValidIndianPhone(validPhone)) {
          return {
            sessionId: session.sessionId,
            state: 'COLLECT_PHONE',
            promptKannada: "ಕ್ಷಮಿಸಿ, ಅದು ಸರಿಯಾದ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯಂತೆ ಕಾಣುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ 10 ಅಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ.",
            promptEnglish: "Sorry, that does not look like a valid phone number. Please provide a valid 10-digit mobile number.",
            collectedSlots: session.collectedSlots,
            isCompleted: false
          };
        }
        session.collectedSlots.patientPhone = validPhone;
        session.currentState = 'COLLECT_DEPARTMENT';

        const depts = this.fileRepo.getDepartments().filter(d => d.active);
        const deptOptionsKn = depts.map((d, i) => `${i + 1}. ${d.name}`).join('\n');
        const deptOptionsEn = depts.map((d, i) => `${i + 1}. ${d.name}`).join('\n');

        return {
          sessionId: session.sessionId,
          state: 'COLLECT_DEPARTMENT',
          promptKannada: `ಯಾವ ವಿಭಾಗಕ್ಕೆ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬೇಕು? ಸಂಖ್ಯೆ ಅಥವಾ ಹೆಸರು ತಿಳಿಸಿ (ಉದಾಹರಣೆಗೆ 1):\n\n${deptOptionsKn}`,
          promptEnglish: `Which department do you wish to visit? Please state the number or name (e.g. 1):\n\n${deptOptionsEn}`,
          collectedSlots: session.collectedSlots,
          isCompleted: false
        };
      }

      case 'COLLECT_DEPARTMENT': {
        const depts = this.fileRepo.getDepartments().filter(d => d.active);
        const matchedDept = this.parseDepartmentSelection(cleanText, depts);

        session.collectedSlots.departmentId = matchedDept.id;
        session.collectedSlots.departmentName = matchedDept.name;
        session.currentState = 'COLLECT_DOCTOR';

        const docsInDept = this.fileRepo.getDoctors().filter(doc => doc.departmentId === matchedDept.id && doc.active);
        const docOptionsKn = docsInDept.map((d, i) => `${i + 1}. ${d.name}`).join('\n');
        const docOptionsEn = docsInDept.map((d, i) => `${i + 1}. ${d.name}`).join('\n');

        return {
          sessionId: session.sessionId,
          state: 'COLLECT_DOCTOR',
          promptKannada: `${matchedDept.name} ವಿಭಾಗವನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ವೈದ್ಯರ ಸಂಖ್ಯೆ ಅಥವಾ ಹೆಸರು ತಿಳಿಸಿ:\n\n${docOptionsKn}`,
          promptEnglish: `Selected ${matchedDept.name}. Please state the doctor number or name:\n\n${docOptionsEn}`,
          collectedSlots: session.collectedSlots,
          isCompleted: false
        };
      }

      case 'COLLECT_DOCTOR': {
        const docs = this.fileRepo.getDoctors().filter(d => d.departmentId === session.collectedSlots.departmentId && d.active);
        const matchedDoc = this.parseDoctorSelection(cleanText, docs);

        session.collectedSlots.doctorId = matchedDoc.id;
        session.collectedSlots.doctorName = matchedDoc.name;
        session.currentState = 'COLLECT_DATE';

        const todayStr = new Date().toISOString().split('T')[0];
        return {
          sessionId: session.sessionId,
          state: 'COLLECT_DATE',
          promptKannada: `ನೀವು ${matchedDoc.name} ಅವರನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ಯಾವ ದಿನಾಂಕದಂದು ಬರಲು ಬಯಸುತ್ತೀರಿ? (ಉದಾಹರಣೆಗೆ: ${todayStr} ಅಥವಾ ನಾಳೆ)`,
          promptEnglish: `Selected ${matchedDoc.name}. What date would you like for your appointment? (e.g. ${todayStr} or tomorrow)`,
          collectedSlots: session.collectedSlots,
          isCompleted: false
        };
      }

      case 'COLLECT_DATE': {
        let selectedDate = this.extractDate(cleanText);
        if (!selectedDate || !this.appointmentService.isValidDate(selectedDate)) {
          selectedDate = new Date().toISOString().split('T')[0]; // fallback to today if unparseable
        }

        // Verify doctor availability on that date
        const availCheck = this.appointmentService.checkDoctorAvailability(session.collectedSlots.doctorId!, selectedDate);
        if (!availCheck.available) {
          return {
            sessionId: session.sessionId,
            state: 'COLLECT_DATE',
            promptKannada: `ಕ್ಷಮಿಸಿ, ವೈದ್ಯರು ${selectedDate} ರಂದು ಲಭ್ಯವಿಲ್ಲ (${availCheck.reason}). ದಯವಿಟ್ಟು ಮತ್ತೊಂದು ದಿನಾಂಕ ತಿಳಿಸಿ.`,
            promptEnglish: `Sorry, doctor is unavailable on ${selectedDate} (${availCheck.reason}). Please select another date.`,
            collectedSlots: session.collectedSlots,
            isCompleted: false
          };
        }

        session.collectedSlots.preferredDate = selectedDate;
        session.currentState = 'COLLECT_TIME';

        return {
          sessionId: session.sessionId,
          state: 'COLLECT_TIME',
          promptKannada: `ಯಾವ ಸಮಯದ ಸ್ಲಾಟ್ ಬಯಸುತ್ತೀರಿ? (ಉದಾಹರಣೆಗೆ: 10:00 AM ಅಥವಾ 04:00 PM)`,
          promptEnglish: `Which time slot do you prefer? (e.g. 10:00 AM or 04:00 PM)`,
          collectedSlots: session.collectedSlots,
          isCompleted: false
        };
      }

      case 'COLLECT_TIME': {
        const timeSlot = cleanText || "10:00 AM";
        session.collectedSlots.preferredTime = timeSlot;
        session.currentState = 'COLLECT_REASON';

        return {
          sessionId: session.sessionId,
          state: 'COLLECT_REASON',
          promptKannada: "ಭೇಟಿಯ ಮುಖ್ಯ ಕಾರಣ ಅಥವಾ ರೋಗಲಕ್ಷಣವನ್ನು ತಿಳಿಸಿ.",
          promptEnglish: "Please state the main reason for your visit.",
          collectedSlots: session.collectedSlots,
          isCompleted: false
        };
      }

      case 'COLLECT_REASON': {
        session.collectedSlots.reason = cleanText || "General Medical Checkup";
        session.currentState = 'SUMMARY';

        const s = session.collectedSlots;
        const knSummary = `ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿ:\nಹೆಸರು: ${s.patientName}\nಫೋನ್: ${s.patientPhone}\nವಿಭಾಗ: ${s.departmentName}\nವೈದ್ಯರು: ${s.doctorName}\nದಿನಾಂಕ: ${s.preferredDate}\nಸಮಯ: ${s.preferredTime}\nಕಾರಣ: ${s.reason}\n\nಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು 'ಹೌದು' ಅಥವಾ 'ದೃಢೀಕರಿಸಿ' ಎಂದು ಹೇಳಿ.`;
        const enSummary = `Please confirm your details:\nName: ${s.patientName}\nPhone: ${s.patientPhone}\nDept: ${s.departmentName}\nDoctor: ${s.doctorName}\nDate: ${s.preferredDate}\nTime: ${s.preferredTime}\nReason: ${s.reason}\n\nSay 'Yes' or 'Confirm' to submit.`;

        return {
          sessionId: session.sessionId,
          state: 'SUMMARY',
          promptKannada: knSummary,
          promptEnglish: enSummary,
          collectedSlots: session.collectedSlots,
          isCompleted: false
        };
      }

      case 'SUMMARY':
      case 'CONFIRMATION': {
        const isAffirmative = /ಹೌದು|ಖಂಡಿತ|ಸರಿ|yes|confirm|okay|correct/i.test(cleanText);
        if (!isAffirmative) {
          return {
            sessionId: session.sessionId,
            state: 'SUMMARY',
            promptKannada: "ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ದಯವಿಟ್ಟು 'ಹೌದು' ಅಥವಾ 'ದೃಢೀಕರಿಸಿ' ಎಂದು ನೀಡಿ. ಬದಲಾಯಿಸಲು ಬಯಸಿದರೆ, ಉದಾಹರಣೆಗೆ 'ದಿನಾಂಕ ಬದಲಾಯಿಸಿ' ಎಂದು ಹೇಳಿ.",
            promptEnglish: "Please say 'Yes' to confirm booking, or specify changes like 'Change date'.",
            collectedSlots: session.collectedSlots,
            isCompleted: false
          };
        }

        // Submit Appointment
        session.currentState = 'SUBMIT';
        try {
          const s = session.collectedSlots;
          const result = await this.appointmentService.createAppointment({
            patientName: s.patientName!,
            patientPhone: s.patientPhone!,
            departmentId: s.departmentId!,
            doctorId: s.doctorId!,
            preferredDate: s.preferredDate!,
            preferredTime: s.preferredTime!,
            reason: s.reason!,
            source: 'VOICE_KANNADA',
            language: session.language,
            agentSessionId: session.sessionId
          });

          session.completedAppointmentId = result.appointment.id;
          session.currentState = 'CONFIRM_SUCCESS';

          return {
            sessionId: session.sessionId,
            state: 'CONFIRM_SUCCESS',
            promptKannada: `ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಯಶಸ್ವಿಯಾಗಿ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಸಂಖ್ಯೆ: ${result.appointment.id}. ಧನ್ಯವಾದಗಳು!`,
            promptEnglish: `Congratulations! Your appointment has been booked successfully. Your Appointment ID is ${result.appointment.id}. Thank you!`,
            collectedSlots: session.collectedSlots,
            appointment: result.appointment,
            isCompleted: true
          };
        } catch (err: any) {
          session.currentState = 'SUMMARY';
          const msg = err.message || "ಕಾಯ್ದಿರಿಸುವಲ್ಲಿ ದೋಷ ಸಂಭವಿಸಿದೆ.";
          return {
            sessionId: session.sessionId,
            state: 'SUMMARY',
            promptKannada: `ಕ್ಷಮಿಸಿ, ದೋಷ ಸಂಭವಿಸಿದೆ: ${msg}. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.`,
            promptEnglish: `Error creating appointment: ${msg}. Please try again.`,
            collectedSlots: session.collectedSlots,
            isCompleted: false
          };
        }
      }

      default: {
        return {
          sessionId: session.sessionId,
          state: session.currentState,
          promptKannada: "ನಮಸ್ಕಾರ! ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಮುಂದುವರಿಸಲು 'ಹೌದು' ಎಂದು ತಿಳಿಸಿ.",
          promptEnglish: "Hello! Say 'Yes' to continue.",
          collectedSlots: session.collectedSlots,
          isCompleted: false
        };
      }
    }
  }

  private parseDepartmentSelection(cleanText: string, depts: any[]): any {
    const trimmed = cleanText.trim();
    const numMatch = trimmed.match(/\b([1-9])\b/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < depts.length) {
        return depts[idx];
      }
    }
    const numberWords: Record<string, number> = {
      'one': 1, 'first': 1, '1st': 1, 'ಒಂದು': 1,
      'two': 2, 'second': 2, '2nd': 2, 'ಎರಡು': 2,
      'three': 3, 'third': 3, '3rd': 3, 'ಮೂರು': 3,
      'four': 4, 'fourth': 4, '4th': 4, 'ನಾಲ್ಕು': 4,
      'five': 5, 'fifth': 5, '5th': 5, 'ಐದು': 5,
      'six': 6, 'sixth': 6, '6th': 6, 'ಆರು': 6,
      'seven': 7, 'seventh': 7, '7th': 7, 'ಏಳು': 7,
    };
    const lower = cleanText.toLowerCase();
    for (const [word, num] of Object.entries(numberWords)) {
      if (lower.includes(word)) {
        const idx = num - 1;
        if (idx >= 0 && idx < depts.length) {
          return depts[idx];
        }
      }
    }
    return depts.find(d =>
      lower.includes(d.name.toLowerCase()) ||
      lower.includes(d.code.toLowerCase())
    ) || depts[0];
  }

  private parseDoctorSelection(cleanText: string, docs: any[]): any {
    const trimmed = cleanText.trim();
    const numMatch = trimmed.match(/\b([1-9])\b/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < docs.length) {
        return docs[idx];
      }
    }
    const numberWords: Record<string, number> = {
      'one': 1, 'first': 1, '1st': 1, 'ಒಂದು': 1,
      'two': 2, 'second': 2, '2nd': 2, 'ಎರಡು': 2,
      'three': 3, 'third': 3, '3rd': 3, 'ಮೂರು': 3,
      'four': 4, 'fourth': 4, '4th': 4, 'ನಾಲ್ಕು': 4,
      'five': 5, 'fifth': 5, '5th': 5, 'ಐದು': 5,
    };
    const lower = cleanText.toLowerCase();
    for (const [word, num] of Object.entries(numberWords)) {
      if (lower.includes(word)) {
        const idx = num - 1;
        if (idx >= 0 && idx < docs.length) {
          return docs[idx];
        }
      }
    }
    return docs.find(d => lower.includes(d.name.toLowerCase())) || docs[0];
  }

  private detectCorrectionIntent(text: string): VoiceState | null {
    const lower = text.toLowerCase();
    if (lower.includes('change name') || lower.includes('ಹೆಸರು ಬದಲಾಯಿಸಿ')) return 'COLLECT_NAME';
    if (lower.includes('change phone') || lower.includes('ಫೋನ್ ಬದಲಾಯಿಸಿ')) return 'COLLECT_PHONE';
    if (lower.includes('change doctor') || lower.includes('ವೈದ್ಯರನ್ನು ಬದಲಾಯಿಸಿ')) return 'COLLECT_DOCTOR';
    if (lower.includes('change date') || lower.includes('ದಿನಾಂಕ ಬದಲಾಯಿಸಿ')) return 'COLLECT_DATE';
    if (lower.includes('change time') || lower.includes('ಸಮಯ ಬದಲಾಯಿಸಿ')) return 'COLLECT_TIME';
    return null;
  }

  public extractMultiSlots(text: string, currentSlots: VoiceSession['collectedSlots']): VoiceSession['collectedSlots'] {
    const updated = { ...currentSlots };
    const lower = text.toLowerCase();

    // 1. Phone Extraction
    const phoneMatch = text.match(/(?:\+91|0)?[6-9]\d{9}/);
    if (phoneMatch && !updated.patientPhone) {
      const extracted = phoneMatch[0].replace(/\D/g, '').slice(-10);
      if (this.appointmentService.isValidIndianPhone(extracted)) {
        updated.patientPhone = extracted;
      }
    }

    // 2. Department Matching
    if (!updated.departmentId) {
      const depts = this.fileRepo.getDepartments().filter(d => d.active);
      const matchedDept = depts.find(d =>
        lower.includes(d.name.toLowerCase()) || lower.includes(d.code.toLowerCase())
      );
      if (matchedDept) {
        updated.departmentId = matchedDept.id;
        updated.departmentName = matchedDept.name;
      }
    }

    // 3. Doctor Matching
    if (!updated.doctorId) {
      const docs = this.fileRepo.getDoctors().filter(d => d.active);
      const matchedDoc = docs.find(d => lower.includes(d.name.toLowerCase()));
      if (matchedDoc) {
        updated.doctorId = matchedDoc.id;
        updated.doctorName = matchedDoc.name;
        if (!updated.departmentId) {
          updated.departmentId = matchedDoc.departmentId;
          updated.departmentName = matchedDoc.departmentName;
        }
      }
    }

    // 4. Date Extraction (ISO or Relative)
    if (!updated.preferredDate) {
      const parsedDate = this.extractDate(text);
      if (parsedDate) {
        updated.preferredDate = parsedDate;
      }
    }

    // 5. Time Slot Extraction
    if (!updated.preferredTime) {
      if (lower.includes('morning') || lower.includes('ಬೆಳಿಗ್ಗೆ')) updated.preferredTime = '10:00 AM';
      else if (lower.includes('afternoon') || lower.includes('ಮಧ್ಯಾಹ್ನ')) updated.preferredTime = '02:30 PM';
      else if (lower.includes('evening') || lower.includes('ಸಂಜೆ')) updated.preferredTime = '05:30 PM';
      else {
        const timeMatch = text.match(/\b([01]?\d|2[0-3]):?([0-5]\d)?\s*(am|pm)?\b/i);
        if (timeMatch && (timeMatch[3] || timeMatch[0].includes(':'))) {
          updated.preferredTime = timeMatch[0].toUpperCase();
        }
      }
    }

    return updated;
  }

  private extractDate(text: string): string {
    const lower = text.toLowerCase();
    const match = text.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];

    const today = new Date();
    if (lower.includes('tomorrow') || lower.includes('ನಾಳೆ')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    if (lower.includes('today') || lower.includes('ಇಂದು')) {
      return today.toISOString().split('T')[0];
    }
    return today.toISOString().split('T')[0];
  }

  private renderPromptForState(session: VoiceSession, kn: string, en: string): VoiceResponse {
    return {
      sessionId: session.sessionId,
      state: session.currentState,
      promptKannada: kn,
      promptEnglish: en,
      collectedSlots: session.collectedSlots,
      isCompleted: false
    };
  }
}
