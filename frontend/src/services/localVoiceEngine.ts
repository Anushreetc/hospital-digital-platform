import { fallbackDepartments, fallbackDoctors, fallbackHospitalInfo } from './mockData';

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
      state: 'GREETING',
      slots: {}
    };
    localSessions.set(sessionId, session);
  }

  const clean = query.trim();
  const lower = clean.toLowerCase();

  // 1. Medical Emergency Guardrail (Immediate 108 Ambulance Alert)
  if (
    lower.includes('chest pain') ||
    lower.includes('heart attack') ||
    lower.includes('severe bleeding') ||
    lower.includes('unconscious') ||
    lower.includes('emergency') ||
    lower.includes('accident') ||
    clean.includes('ಎಮರ್ಜೆನ್ಸಿ') ||
    clean.includes('ತುರ್ತು') ||
    clean.includes('ಎದೆ ನೋವು') ||
    clean.includes('ಉಸಿರಾಟ')
  ) {
    return {
      sessionId,
      state: 'EMERGENCY',
      promptKannada: 'ಇದು ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಂತೆ ಕಾಣುತ್ತಿದೆ! ದಯವಿಟ್ಟು ತಕ್ಷಣ 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆ ಮಾಡಿ ಅಥವಾ ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.',
      promptEnglish: 'This appears to be a medical emergency. Please immediately call 108 ambulance or visit the Emergency Room right away.',
      collectedSlots: session.slots,
      isCompleted: true
    };
  }

  // 2. Hospital Information & Location FAQs
  if (
    lower.includes('where is the hospital') ||
    lower.includes('location') ||
    lower.includes('address') ||
    clean.includes('ವಿಳಾಸ') ||
    clean.includes('ಎಲ್ಲಿದೆ') ||
    lower.includes('ellide') ||
    lower.includes('address enu')
  ) {
    return {
      sessionId,
      state: session.state,
      promptKannada: `ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆ ${fallbackHospitalInfo.address} ನಲ್ಲಿದೆ. ನೀವು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ಬಯಸುವಿರಾ? ನಿಮ್ಮ ಹೆಸರನ್ನು ತಿಳಿಸಿ.`,
      promptEnglish: `City Care Hospital is located at ${fallbackHospitalInfo.address}. Would you like to book an appointment? Please provide your name.`,
      collectedSlots: session.slots,
      isCompleted: false
    };
  }

  // 3. Hospital Timing FAQs
  if (
    lower.includes('timings') ||
    lower.includes('hours') ||
    lower.includes('open') ||
    clean.includes('ಸಮಯ') ||
    clean.includes('ತೆರೆದಿರುತ್ತದೆಯೆ') ||
    lower.includes('timing enu')
  ) {
    return {
      sessionId,
      state: session.state,
      promptKannada: `ನಮ್ಮ ಆಸ್ಪತ್ರೆಯು 24/7 ತುರ್ತು ಸೇವೆಗಳು ಮತ್ತು ಸೋಮವಾರದಿಂದ ಶನಿವಾರದವರೆಗೆ ಬೆಳಿಗ್ಗೆ 8:00 ರಿಂದ ರಾತ್ರಿ 8:00 ರವರೆಗೆ OPD ಸೇವೆಗಳನ್ನು ಒದಗಿಸುತ್ತದೆ. ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗೆ ನಿಮ್ಮ ಹೆಸರು ತಿಳಿಸಿ.`,
      promptEnglish: `Our hospital operates 24/7 Emergency and OPD consultations Mon-Sat from 8:00 AM to 8:00 PM. What is your name to book an appointment?`,
      collectedSlots: session.slots,
      isCompleted: false
    };
  }

  // 4. Multi-Slot Entity Extraction from single utterance
  // Extract Phone Number
  const phoneMatch = clean.match(/(\+?91[\s-]?)?[6-9]\d{9}/);
  if (phoneMatch) {
    session.slots.patientPhone = phoneMatch[0].replace(/\D/g, '').slice(-10);
  }

  // Extract Doctor by Name
  for (const doc of fallbackDoctors) {
    const docLastName = doc.name.split(' ').slice(1).join(' ').toLowerCase();
    const docShortName = doc.name.replace(/dr\.?\s*/i, '').toLowerCase();
    if (lower.includes(docShortName) || (docLastName && lower.includes(docLastName)) || clean.includes(doc.name)) {
      session.slots.doctorId = doc.id;
      session.slots.doctorName = doc.name;
      session.slots.departmentId = doc.departmentId;
      session.slots.departmentName = doc.departmentName;
      break;
    }
  }

  // Extract Department by Name or Symptoms
  if (!session.slots.departmentId) {
    if (lower.includes('heart') || lower.includes('cardio') || lower.includes('bp') || clean.includes('ಹೃದಯ') || clean.includes('ಕಾರ್ಡಿಯಾಲಜಿ')) {
      session.slots.departmentId = 'dept-1';
      session.slots.departmentName = 'Cardiology';
    } else if (lower.includes('brain') || lower.includes('neuro') || lower.includes('headache') || lower.includes('spine') || clean.includes('ಮೆದುಳು') || clean.includes('ನ್ಯೂರಾಲಜಿ')) {
      session.slots.departmentId = 'dept-2';
      session.slots.departmentName = 'Neurology & Neurosurgery';
    } else if (lower.includes('bone') || lower.includes('ortho') || lower.includes('joint') || lower.includes('knee') || clean.includes('ಮೂಳೆ') || clean.includes('ಆರ್ಥೋಪೆಡಿಕ್ಸ್')) {
      session.slots.departmentId = 'dept-3';
      session.slots.departmentName = 'Orthopedics & Joint Replacement';
    } else if (lower.includes('child') || lower.includes('baby') || lower.includes('pedia') || lower.includes('vaccin') || clean.includes('ಮಗು') || clean.includes('ಪೀಡಿಯಾಟ್ರಿಕ್ಸ್')) {
      session.slots.departmentId = 'dept-4';
      session.slots.departmentName = 'Pediatrics & Neonatology';
    } else if (lower.includes('fever') || lower.includes('cold') || lower.includes('general') || clean.includes('ಜ್ವರ') || clean.includes('ಸಾಮಾನ್ಯ')) {
      session.slots.departmentId = 'dept-5';
      session.slots.departmentName = 'General & Internal Medicine';
    }
  }

  // Extract Date
  if (lower.includes('today') || clean.includes('ಇವತ್ತು') || lower.includes('ivathu')) {
    session.slots.preferredDate = new Date().toISOString().split('T')[0];
  } else if (lower.includes('tomorrow') || clean.includes('ನಾಳೆ') || lower.includes('naale')) {
    session.slots.preferredDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  } else {
    const dateMatch = clean.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      session.slots.preferredDate = dateMatch[0];
    }
  }

  // Extract Time Slot
  if (lower.includes('morning') || lower.includes('10 am') || clean.includes('ಬೆಳಿಗ್ಗೆ') || lower.includes('beligge')) {
    session.slots.preferredTime = '10:00 AM';
  } else if (lower.includes('evening') || lower.includes('4 pm') || lower.includes('5 pm') || clean.includes('ಸಂಜೆ') || lower.includes('sanje')) {
    session.slots.preferredTime = '04:00 PM';
  }

  // 5. Intelligent Multi-Turn State Machine
  // If we already have patient name or user gives name
  if (!session.slots.patientName) {
    // Check if user is greeting
    if (
      lower === 'hi' ||
      lower === 'hello' ||
      lower === 'hey' ||
      lower === 'namaskara' ||
      lower === 'namaste' ||
      clean === 'ನಮಸ್ಕಾರ' ||
      clean === 'ಹಲೋ'
    ) {
      return {
        sessionId,
        state: 'GREETING',
        promptKannada: 'ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಲು ನಿಮ್ಮ ಹೆಸರು ಏನು?',
        promptEnglish: 'Namaskara! Welcome to City Care Hospital. What is your full name for the appointment booking?',
        collectedSlots: session.slots,
        isCompleted: false
      };
    }

    // Extract Name cleanly
    const extractedName = clean
      .replace(/^(ನನ್ನ ಹೆಸರು|ನನ್ನ ಹೆಸ್ರು|ಹೆಸರು|my name is|i am|iam|im|this is|call me)\s*/i, '')
      .replace(/[.,!]/g, '')
      .trim();

    session.slots.patientName = extractedName || clean;
  }

  // Step 2: Need Phone Number
  if (!session.slots.patientPhone) {
    session.state = 'COLLECT_PHONE';
    return {
      sessionId,
      state: 'COLLECT_PHONE',
      promptKannada: `ಧನ್ಯವಾದಗಳು ${session.slots.patientName}. ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ದೃಢೀಕರಣ SMS ಪಡೆಯಲು ನಿಮ್ಮ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.`,
      promptEnglish: `Thank you ${session.slots.patientName}. Please provide your 10-digit mobile number for appointment confirmation.`,
      collectedSlots: session.slots,
      isCompleted: false
    };
  }

  // Step 3: Need Department / Doctor
  if (!session.slots.departmentId && !session.slots.doctorId) {
    session.state = 'COLLECT_DEPARTMENT';
    return {
      sessionId,
      state: 'COLLECT_DEPARTMENT',
      promptKannada: 'ಧನ್ಯವಾದಗಳು! ನೀವು ಯಾವ ವಿಭಾಗವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ? ಕಾರ್ಡಿಯಾಲಜಿ (ಹೃದಯ), ನ್ಯೂರಾಲಜಿ (ಮೆದುಳು), ಅಥವಾ ಆರ್ಥೋಪೆಡಿಕ್ಸ್ (ಮೂಳೆ)?',
      promptEnglish: 'Thank you! Which clinical department do you need? Cardiology (Heart), Neurology (Brain), or Orthopedics (Bone)?',
      collectedSlots: session.slots,
      isCompleted: false
    };
  }

  // Auto-assign matching doctor if department is chosen
  if (!session.slots.doctorId && session.slots.departmentId) {
    const deptDocs = fallbackDoctors.filter(d => d.departmentId === session.slots.departmentId);
    const chosenDoc = deptDocs[0] || fallbackDoctors[0];
    session.slots.doctorId = chosenDoc.id;
    session.slots.doctorName = chosenDoc.name;
  }

  // Step 4: Need Preferred Date
  if (!session.slots.preferredDate) {
    session.state = 'COLLECT_DATE';
    const docName = session.slots.doctorName || 'ನಮ್ಮ ತಜ್ಞ ವೈದ್ಯರು';
    const deptName = session.slots.departmentName || 'ವಿಭಾಗ';
    return {
      sessionId,
      state: 'COLLECT_DATE',
      promptKannada: `${deptName} ವಿಭಾಗದಲ್ಲಿ ${docName} ಲಭ್ಯವಿದ್ದಾರೆ. ನೀವು ಯಾವ ದಿನಾಂಕದಂದು ಬರಲು ಬಯಸುತ್ತೀರಿ? (ಉದಾಹರಣೆಗೆ: ನಾಳೆ ಅಥವಾ ಸೋಮವಾರ)`,
      promptEnglish: `In ${deptName}, ${docName} is available. What date would you prefer to visit? (e.g. Tomorrow or next Monday)`,
      collectedSlots: session.slots,
      isCompleted: false
    };
  }

  if (!session.slots.preferredTime) {
    session.slots.preferredTime = '10:00 AM';
  }

  // Step 5: Summary Confirmation & Affirmation Check
  const isAffirmative =
    lower.includes('yes') ||
    lower.includes('confirm') ||
    lower.includes('ok') ||
    lower.includes('sure') ||
    lower.includes('yeah') ||
    lower.includes('haudu') ||
    lower.includes('sari') ||
    lower.includes('correct') ||
    clean.includes('ಹೌದು') ||
    clean.includes('ಸರಿ') ||
    clean.includes('ಖಚಿತಪಡಿಸಿ') ||
    clean.includes('ದೃಢೀಕರಿಸಿ');

  if (session.state !== 'SUMMARY' && !isAffirmative) {
    session.state = 'SUMMARY';
    return {
      sessionId,
      state: 'SUMMARY',
      promptKannada: `ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ: ರೋಗಿ: ${session.slots.patientName}, ವೈದ್ಯರು: ${session.slots.doctorName}, ದಿನಾಂಕ: ${session.slots.preferredDate}, ಸಮಯ: ${session.slots.preferredTime}. ಬುಕಿಂಗ್ ಖಚಿತಪಡಿಸಲು 'ಹೌದು' ಅಥವಾ 'Confirm' ಎಂದು ಹೇಳಿ.`,
      promptEnglish: `Please review details: Patient: ${session.slots.patientName}, Doctor: ${session.slots.doctorName}, Date: ${session.slots.preferredDate}, Time: ${session.slots.preferredTime}. Say 'Yes' or 'Confirm' to finalize booking.`,
      collectedSlots: session.slots,
      isCompleted: false
    };
  }

  // Step 6: Create Confirmed Appointment
  const apptId = `APT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  session.state = 'CONFIRM_SUCCESS';
  const createdAppt = {
    id: apptId,
    patientName: session.slots.patientName,
    patientPhone: session.slots.patientPhone,
    doctorName: session.slots.doctorName || 'Dr. Ramesh H. S.',
    departmentName: session.slots.departmentName || 'Cardiology',
    preferredDate: session.slots.preferredDate,
    preferredTime: session.slots.preferredTime,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString()
  };

  return {
    sessionId,
    state: 'CONFIRM_SUCCESS',
    promptKannada: `ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಯಶಸ್ವಿಯಾಗಿ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ID: ${apptId}. ದಯವಿಟ್ಟು 15 ನಿಮಿಷ ಮುಂಚಿತವಾಗಿ ತಲುಪಿ. ಧನ್ಯವಾದಗಳು!`,
    promptEnglish: `Congratulations! Your appointment has been successfully booked. Your Appointment ID is ${apptId}. Please arrive 15 minutes before your slot. Thank you!`,
    collectedSlots: session.slots,
    appointment: createdAppt,
    isCompleted: true
  };
}
