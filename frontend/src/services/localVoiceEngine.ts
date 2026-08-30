import { fallbackDepartments, fallbackDoctors } from './mockData';

export interface LocalVoiceResponse {
  sessionId: string;
  state: string;
  promptKannada: string;
  promptEnglish: string;
  collectedSlots: any;
  appointment?: any;
  isCompleted: boolean;
}

interface LocalSession {
  state: string;
  slots: {
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
}

const localSessions = new Map<string, LocalSession>();

export function processLocalVoiceUtterance(sessionId: string, query: string): LocalVoiceResponse {
  let session = localSessions.get(sessionId);
  if (!session) {
    session = {
      state: 'COLLECT_NAME',
      slots: {}
    };
    localSessions.set(sessionId, session);
  }

  const clean = query.trim();
  const lower = clean.toLowerCase();

  // Emergency safety guardrail
  if (lower.includes('chest pain') || lower.includes('heart attack') || lower.includes('emergency') || clean.includes('ಎಮರ್ಜೆನ್ಸಿ') || clean.includes('ತುರ್ತು')) {
    return {
      sessionId,
      state: 'EMERGENCY',
      promptKannada: 'ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಂತೆ ಕಾಣುತ್ತಿದೆ! ದಯವಿಟ್ಟು ತಕ್ಷಣ 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆ ಮಾಡಿ ಅಥವಾ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.',
      promptEnglish: 'This appears to be a medical emergency. Please immediately call 108 ambulance or visit the emergency room right away.',
      collectedSlots: session.slots,
      isCompleted: true
    };
  }

  switch (session.state) {
    case 'INIT':
    case 'GREETING':
    case 'COLLECT_NAME': {
      // If user provided a name
      const name = clean.replace(/^(ನನ್ನ ಹೆಸರು|name is|i am|iam|im)\s*/i, '').trim();
      session.slots.patientName = name || clean;
      session.state = 'COLLECT_PHONE';
      return {
        sessionId,
        state: 'COLLECT_PHONE',
        promptKannada: `ಧನ್ಯವಾದಗಳು ${session.slots.patientName}. ದೃಢೀಕರಣ SMS ಪಡೆಯಲು ನಿಮ್ಮ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.`,
        promptEnglish: `Thank you ${session.slots.patientName}. Please provide your 10-digit mobile number for appointment confirmation.`,
        collectedSlots: session.slots,
        isCompleted: false
      };
    }

    case 'COLLECT_PHONE': {
      const digits = clean.replace(/\D/g, '');
      if (digits.length >= 10) {
        session.slots.patientPhone = digits.slice(-10);
        session.state = 'COLLECT_DEPARTMENT';
        return {
          sessionId,
          state: 'COLLECT_DEPARTMENT',
          promptKannada: 'ಧನ್ಯವಾದಗಳು! ನೀವು ಯಾವ ವಿಭಾಗವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ? (ಉದಾಹರಣೆಗೆ: ಕಾರ್ಡಿಯಾಲಜಿ, ಆರ್ಥೋಪೆಡಿಕ್ಸ್, ಜನರಲ್ ಮೆಡಿಸಿನ್)',
          promptEnglish: 'Thank you! Which clinical department or medical specialty do you need? (e.g. Cardiology, Orthopedics, General Medicine)',
          collectedSlots: session.slots,
          isCompleted: false
        };
      } else {
        return {
          sessionId,
          state: 'COLLECT_PHONE',
          promptKannada: 'ದಯವಿಟ್ಟು ಸರಿಯಾದ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.',
          promptEnglish: 'Please provide a valid 10-digit mobile number.',
          collectedSlots: session.slots,
          isCompleted: false
        };
      }
    }

    case 'COLLECT_DEPARTMENT': {
      let matchedDept = fallbackDepartments.find(d => lower.includes(d.name.toLowerCase()) || lower.includes(d.code.toLowerCase()));
      if (!matchedDept) matchedDept = fallbackDepartments[0]; // default to Cardiology

      session.slots.departmentId = matchedDept.id;
      session.slots.departmentName = matchedDept.name;

      const deptDocs = fallbackDoctors.filter(d => d.departmentId === matchedDept.id || (d.departmentName && d.departmentName.toLowerCase().includes(matchedDept.name.toLowerCase())));
      const chosenDoc = deptDocs[0] || fallbackDoctors[0];
      session.slots.doctorId = chosenDoc.id;
      session.slots.doctorName = chosenDoc.name;

      session.state = 'COLLECT_DATE';
      return {
        sessionId,
        state: 'COLLECT_DATE',
        promptKannada: `${matchedDept.name} ವಿಭಾಗಕ್ಕೆ ${chosenDoc.name} ಲಭ್ಯವಿದ್ದಾರೆ. ನೀವು ಯಾವ ದಿನಾಂಕದಂದು ಬರಲು ಬಯಸುತ್ತೀರಿ? (ಉದಾಹರಣೆಗೆ: ನಾಳೆ / 2026-09-02)`,
        promptEnglish: `In ${matchedDept.name}, ${chosenDoc.name} is available. What date would you prefer to visit? (e.g. Tomorrow or YYYY-MM-DD)`,
        collectedSlots: session.slots,
        isCompleted: false
      };
    }

    case 'COLLECT_DATE': {
      const today = new Date();
      const dateStr = lower.includes('tomorrow') || clean.includes('ನಾಳೆ')
        ? new Date(today.getTime() + 86400000).toISOString().split('T')[0]
        : new Date(today.getTime() + 86400000).toISOString().split('T')[0];
      session.slots.preferredDate = dateStr;
      session.slots.preferredTime = '10:00 AM';
      session.state = 'SUMMARY';

      return {
        sessionId,
        state: 'SUMMARY',
        promptKannada: `ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿ: ${session.slots.patientName}, ವೈದ್ಯರು: ${session.slots.doctorName}, ದಿನಾಂಕ: ${dateStr}, ಸಮಯ: 10:00 AM. ಖಚಿತಪಡಿಸಲು 'ಹೌದು' ಅಥವಾ 'Confirm' ಎಂದು ಹೇಳಿ.`,
        promptEnglish: `Please confirm: ${session.slots.patientName}, Doctor: ${session.slots.doctorName}, Date: ${dateStr}, Time: 10:00 AM. Say 'Yes' or 'Confirm' to book.`,
        collectedSlots: session.slots,
        isCompleted: false
      };
    }

    case 'SUMMARY':
    default: {
      const apptId = `APT-${Date.now().toString().slice(-6)}`;
      session.state = 'CONFIRM_SUCCESS';
      const createdAppt = {
        id: apptId,
        patientName: session.slots.patientName || 'Patient',
        patientPhone: session.slots.patientPhone || '9876543210',
        doctorName: session.slots.doctorName || 'Dr. Ramesh H. S.',
        departmentName: session.slots.departmentName || 'Cardiology',
        preferredDate: session.slots.preferredDate || new Date().toISOString().split('T')[0],
        preferredTime: session.slots.preferredTime || '10:00 AM',
        status: 'CONFIRMED',
        createdAt: new Date().toISOString()
      };

      return {
        sessionId,
        state: 'CONFIRM_SUCCESS',
        promptKannada: `ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಯಶಸ್ವಿಯಾಗಿ ದೃಢಪಟ್ಟಿದೆ! ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ID: ${apptId}. ದಯವಿಟ್ಟು ಸಮಯಕ್ಕೆ 15 ನಿಮಿಷ ಮುಂಚಿತವಾಗಿ ತಲುಪಿ.`,
        promptEnglish: `Your appointment is successfully confirmed! Your Appointment ID is ${apptId}. Please arrive 15 minutes before your slot.`,
        collectedSlots: session.slots,
        appointment: createdAppt,
        isCompleted: true
      };
    }
  }
}
