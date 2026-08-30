# Hospital Digital Platform — Full-Stack Production System

A comprehensive, production-ready **Hospital Digital Platform** comprising a Public Hospital Information Website, Kannada AI Voice Appointment Assistant, RESTful Backend API Engine, Google Sheets & Local Repository Storage, and three dedicated authenticated portals: **Patient Portal**, **Doctor Portal** (with verification approval flow), and **Hospital Management Portal** (with Super Admin approval).

---

## 🌟 Architecture & Features

### 1. Public Hospital Information Website
- **Hero & Emergency**: 24/7 Helpline, NABH accreditation badges, 4 CTAs ("Book Appointment", "Kannada Voice Assistant", "Find Doctor", "Call Emergency").
- **About Hospital**: Overview, Mission, Vision, Strengths, Accreditations, and Statistics.
- **Departments & Services**: Specialty cards (Cardiology, Orthopedics, Neurology, Pediatrics, Gynecology, Gastroenterology) with doctor counts and 24/7 ICU/Diagnostics details.
- **Doctor Directory**: Interactive cards, photos, qualifications, experience, department filtering, and profile modal.
- **Live OPD Schedules**: Weekly availability matrix per doctor.
- **Facilities Gallery**: 3T MRI, 128-slice CT, Modular OTs, ICU & Patient Suites.
- **Appointment Booking System**: Live client & server validation, doctor slot selection, idempotency key duplicate rejection, human-readable ID generation (`APT-YYYYMMDD-XXXX`).
- **Contact & FAQs**: Google Maps embed, WhatsApp link, phone numbers, operating hours, accordion FAQs.

### 2. Kannada AI Voice Appointment Assistant
- Interactive floating assistant (`ಕನ್ನಡ Voice Assistant`) supporting Kannada (`kn-IN`) and English (`en-IN`).
- Speech-to-Text (STT) and Text-to-Speech (TTS) integration using Web Speech API.
- Multi-turn NLU State Machine (`INIT` -> `GREETING` -> `COLLECT_NAME` -> `COLLECT_PHONE` -> `COLLECT_DEPARTMENT` -> `COLLECT_DOCTOR` -> `COLLECT_DATE` -> `COLLECT_TIME` -> `COLLECT_REASON` -> `SUMMARY` -> `SUBMIT` -> `CONFIRM_SUCCESS`).
- **Medical Safety Guardrails**: Automatic classifier preventing medical diagnosis or prescription queries and advising clinical consultation.

### 3. Three Role-Based Authenticated Portals
- **Patient Portal (`/patient/dashboard`)**:
  - Bookings management, appointment status tracking, appointment cancellation, notifications center, profile details.
- **Doctor Portal (`/doctor/dashboard`)**:
  - Doctor registration with `PENDING_VERIFICATION` status requiring Hospital Management approval before becoming active.
  - Daily schedule, patient queue, consultation status updates (`CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
- **Hospital Management Portal (`/management/dashboard`)**:
  - Management registration with `PENDING_VERIFICATION` requiring Super Admin review.
  - KPIs, Doctor Application Review Queue (Approve/Reject), Doctor Management, Patient Directory, Department & Service CMS, User RBAC, and Audit Logs.

---

## 🚀 Quick Start Guide

### 1. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
npm run setup
```
Or individually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Run Development Environment
```bash
npm run dev
```
- Public Website & Portals: `http://localhost:5173`
- Backend API Engine: `http://localhost:5000`
- API Health Check: `http://localhost:5000/health`

### 4. Run Core Tests
```bash
npm run test
```

---

## 🔐 Default Seed Credentials

| Role | Username / Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `superadmin@citycarehospital.example.com` | `SuperAdmin@123` | Full System & Audit Logs |
| **Hospital Admin** | `admin@citycarehospital.example.com` | `HospitalAdmin@123` | Operations & Doctor Approvals |
| **Receptionist** | `reception@citycarehospital.example.com` | `Reception@123` | Appointments & OPD Queue |
| **Sample Doctor** | `doc101@example.com` | `Doctor@123` | Clinical Dashboard |

---

## 📄 Documentation Index

- [ARCHITECTURE.md](ARCHITECTURE.md) — System Architecture & Decoupled Storage Layer
- [API.md](API.md) — Public, Auth, Patient, Doctor, & Management REST APIs
- [DATABASE.md](DATABASE.md) — Relational Data Schema & Entity Models
- [GOOGLE_SHEETS.md](GOOGLE_SHEETS.md) — V1 Google Sheets Appointment Persistence
- [VOICE_AGENT.md](VOICE_AGENT.md) — Kannada Voice Agent State Machine & Safety Protocol
- [SECURITY.md](SECURITY.md) — Security Hardening, JWT, RBAC & Audit Controls
- [DEPLOYMENT.md](DEPLOYMENT.md) — Production Deployment & Build Guide
- [TESTING.md](TESTING.md) — Testing Suite & Acceptance QA Criteria
- [ENVIRONMENT.md](ENVIRONMENT.md) — Environment Variable Specifications
