# Testing & Verification Guide

## Running Automated Tests

Run backend core Vitest unit and integration tests:

```bash
npm run test
```

## Critical End-to-End Acceptance Test Checklist

1. **Public Booking Test**:
   - Open `#appointment` on public site.
   - Select Cardiology -> Dr. Rajesh Sharma -> preferred date -> time slot.
   - Enter name & 10-digit Indian mobile.
   - Submit -> Verify `APT-YYYYMMDD-XXXX` confirmation ID generated.

2. **Doctor Approval Workflow Test**:
   - Doctor registers at `/doctor/signup` -> Status `PENDING_VERIFICATION`.
   - Hospital Admin logs in at `/management/login` -> Opens Doctor Registrations -> Clicks "Approve Doctor".
   - Doctor logs in at `/doctor/login` -> Dashboard opens successfully & doctor appears on Public Doctors page.

3. **Kannada Voice Agent Test**:
   - Open Kannada Voice Assistant widget.
   - Speak / type responses -> Verify slot progression and confirmation output.

4. **Audit Trail Verification**:
   - Log in as Super Admin (`superadmin@citycarehospital.example.com` / `SuperAdmin@123`).
   - Open Audit Logs -> Verify status change and user actions recorded.
