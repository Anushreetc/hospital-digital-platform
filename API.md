# REST API Specification — Hospital Digital Platform

All API requests return a standardized JSON structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "requestId": "req_1724484000000"
}
```

---

## Public Endpoints

### 1. Hospital Information
`GET /api/hospital`
Returns hospital name, tagline, emergency numbers, address, certifications, statistics, operating hours, and map embeds.

### 2. Department Directory
`GET /api/departments`
Returns list of active specialty departments.

### 3. Services Directory
`GET /api/services`
Returns 24/7 ICU, diagnostics, surgery, emergency, and pharmacy service cards.

### 4. Facilities Directory
`GET /api/facilities`
Returns image cards for ICUs, MRI, CT scanner, modular OTs, and deluxe patient rooms.

### 5. Doctors Directory & Availability
`GET /api/doctors?departmentId={deptId}`
`GET /api/doctors/:id`
`GET /api/doctors/:id/availability`

### 6. Book Public Appointment
`POST /api/appointments`
Header: `Idempotency-Key: idemp_123` (Optional)

Request Body:
```json
{
  "patientName": "Ramesh Kumar",
  "patientPhone": "9876543210",
  "departmentId": "dept-cardio",
  "doctorId": "doc-101",
  "preferredDate": "2026-08-25",
  "preferredTime": "10:00 AM",
  "reason": "Regular cardiology checkup",
  "source": "WEBSITE"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "APT-20260825-0001",
    "status": "NEW",
    "patientName": "Ramesh Kumar",
    "patientPhone": "+919876543210",
    "doctorName": "Dr. Rajesh Sharma",
    "createdAt": "2026-08-24T12:00:00.000Z"
  }
}
```

### 7. Kannada Voice Agent Endpoint
`POST /api/voice/appointments`
Request Body:
```json
{
  "sessionId": "vsession-1724484000",
  "utterance": "ನನ್ನ ಹೆಸರು ರಮೇಶ್ ಕುಮಾರ್"
}
```

---

## Authentication Endpoints

- `POST /api/auth/patient/signup`
- `POST /api/auth/patient/login`
- `POST /api/auth/doctor/signup` (Submits `DoctorApplication` in `PENDING_VERIFICATION`)
- `POST /api/auth/doctor/login`
- `POST /api/auth/management/signup` (Submits management account in `PENDING_VERIFICATION`)
- `POST /api/auth/management/login`
- `POST /api/auth/logout`

---

## Portal Protected Endpoints

### Patient Portal (`Authorization: Bearer <token>`)
- `GET /api/patient/appointments`
- `PATCH /api/patient/appointments/:id` (Cancel)
- `GET /api/patient/notifications`

### Doctor Portal (`Authorization: Bearer <token>`)
- `GET /api/doctor/appointments`
- `PATCH /api/doctor/appointments/:id` (Status update: `COMPLETED`, `CANCELLED`, `NO_SHOW`)
- `GET /api/doctor/availability`

### Management Portal (`Authorization: Bearer <token>`)
- `GET /api/management/dashboard`
- `GET /api/management/appointments`
- `PATCH /api/management/appointments/:id`
- `GET /api/management/doctor-applications`
- `PATCH /api/management/doctor-applications/:id` (Approve/Reject application)
- `GET /api/management/doctors`
- `GET /api/management/patients`
- `GET /api/management/audit-logs` (Super Admin)
