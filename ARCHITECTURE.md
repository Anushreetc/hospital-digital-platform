# System Architecture — Hospital Digital Platform

## High-Level Architecture Diagram

```text
                                ┌───────────────────────────┐
                                │   PUBLIC HOSPITAL SITE    │
                                │   (React + TS + Vite + TW)│
                                └─────────────┬─────────────┘
                                              │
     ┌───────────────────────────┐            │            ┌───────────────────────────┐
     │   Kannada Voice Agent     ├────────────┼────────────┤   AUTH LANDING / MODAL    │
     │ (Web Audio/STT/TTS + NLU) │            │            │  [Patient|Doctor|Admin]   │
     └─────────────┬─────────────┘            │            └─────────────┬─────────────┘
                   │                          │                          │
                   └──────────────────────────┼──────────────────────────┘
                                              ▼
                                ┌───────────────────────────┐
                                │    Express REST API       │
                                │ (Node.js + TS + Middleware│
                                └─────────────┬─────────────┘
                                              │
                                              ▼
                                ┌───────────────────────────┐
                                │    AppointmentService     │
                                │ (Central Domain Service)  │
                                └─────────────┬─────────────┘
                                              │
                             ┌────────────────┴────────────────┐
                             ▼                                 ▼
               ┌───────────────────────────┐     ┌───────────────────────────┐
               │   PostgreSQL / Data Repo  │     │ Google Sheets Sync (V1)   │
               └───────────────────────────┘     └───────────────────────────┘
```

## Architectural Design Principles

1. **Decoupled Business Domain Layer**:
   - `AppointmentService` encapsulates all appointment creation, phone normalization, date/time validation, doctor availability checks, idempotency, and status machine state transitions.
   - Public Website, Patient Portal, Doctor Portal, Management Portal, and the Kannada Voice Assistant **all consume the exact same underlying `AppointmentService`**.

2. **Repository Abstraction Pattern**:
   - Storage implementations implement repository interfaces (`FileRepository`, `GoogleSheetsRepository`, `PostgreSQLRepository`).
   - Upgrading from Google Sheets V1 / JSON storage to PostgreSQL requires zero changes to domain services or frontend components.

3. **Multi-Portal Access Control (RBAC)**:
   - Stateless JWT authentication headers (`Bearer <token>`).
   - Role-Based Access Control enforcing rules for `PATIENT`, `DOCTOR`, `RECEPTIONIST`, `HOSPITAL_ADMIN`, `SUPER_ADMIN`.
   - Doctor Signups undergo a mandatory `DoctorApplication` review (`PENDING_VERIFICATION` -> `APPROVED` -> `ACTIVE`) before appearing on the public directory or accessing clinical schedules.
