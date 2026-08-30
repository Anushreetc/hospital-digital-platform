# Kannada Voice Agent Specification

The Kannada Voice Assistant (`ಕನ್ನಡ Voice Assistant`) allows patients to speak in Kannada (or English) to book OPD consultations.

## Conversation State Machine

```text
  [INIT]
    │
    ▼
[GREETING] ──► "ನಮಸ್ಕಾರ! ಸಿಟಿ ಕೇರ್ ಆಸ್ಪತ್ರೆಗೆ ಸುಸ್ವಾಗತ. ನಿಮ್ಮ ಹೆಸರು ಏನು?"
    │
    ▼
[COLLECT_NAME] ──► Extracts patient name
    │
    ▼
[COLLECT_PHONE] ──► Validates 10-digit mobile number
    │
    ▼
[COLLECT_DEPARTMENT] ──► Prompts available departments
    │
    ▼
[COLLECT_DOCTOR] ──► Prompts available active doctors in department
    │
    ▼
[COLLECT_DATE] ──► Checks doctor availability & leave schedule
    │
    ▼
[COLLECT_TIME] ──► Selects time slot
    │
    ▼
[COLLECT_REASON] ──► Captures symptoms / visit reason
    │
    ▼
[SUMMARY] ──► "ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಿ... 'ಹೌದು' ಎಂದು ಹೇಳಿ."
    │
    ▼
[SUBMIT] ──► Calls AppointmentService.createAppointment()
    │
    ▼
[CONFIRM_SUCCESS] ──► Returns Appointment ID (e.g. APT-20260825-0001)
```

## Medical Safety Guardrail
If user query mentions medication, symptoms diagnosis, dosages, or emergency treatment:
- The classifier triggers a safety response:
  *"I am an automated voice assistant for appointment bookings only. For medical emergencies or prescriptions, please consult a clinician immediately."*
