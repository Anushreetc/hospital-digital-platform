# Relational Database Schema & Entities

The platform uses a relational entity model compatible with PostgreSQL.

```mermaid
erDiagram
    HOSPITAL ||--o{ DEPARTMENT : contains
    DEPARTMENT ||--o{ DOCTOR : employs
    DOCTOR ||--o{ DOCTOR_AVAILABILITY : schedule
    PATIENT ||--o{ APPOINTMENT : books
    DOCTOR ||--o{ APPOINTMENT : consults
    DOCTOR_APPLICATION ||--|| DOCTOR : creates
    ADMIN_USER ||--o{ AUDIT_LOG : generates

    APPOINTMENT {
        string id PK "APT-YYYYMMDD-XXXX"
        string patient_id FK
        string doctor_id FK
        string department_id FK
        string preferred_date
        string preferred_time
        string reason
        string source
        string status
        timestamp created_at
    }

    DOCTOR_APPLICATION {
        string id PK
        string user_id FK
        string name
        string registration_number
        string status "PENDING_VERIFICATION | APPROVED | REJECTED"
        timestamp created_at
    }
```

## Entities

1. `hospitals`: Name, address, phone, emergency phone, email, hours, map URL, stats.
2. `departments`: ID, name, code, description, icon, active.
3. `doctors`: ID, user_id, name, qualification, designation, specialization, department_id, experience, registration_number, active.
4. `doctor_applications`: ID, user_id, name, email, phone, qualification, specialization, registration_number, bio, status, reviewed_by, reviewed_at.
5. `doctor_availabilities`: ID, doctor_id, weekly_schedule (JSON), unavailabilities (JSON).
6. `patients`: ID, name, email, phone, password_hash, dob, gender.
7. `appointments`: ID (`APT-YYYYMMDD-XXXX`), patient_id, doctor_id, department_id, preferred_date, preferred_time, reason, source, status, notes (JSON), idempotency_key.
8. `admin_users`: ID, username, email, password_hash, role, status, active.
9. `audit_logs`: ID, actor_json, action, entity, entity_id, timestamp, details_json.
