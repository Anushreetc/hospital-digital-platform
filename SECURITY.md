# Security Controls & Compliance

1. **Authentication & Password Protection**:
   - `bcryptjs` salted password hashing (10 salt rounds).
   - Stateless JWT tokens signed with a 256-bit secret key (`JWT_SECRET`).
   - Sensitive user fields (e.g. `passwordHash`) stripped from all API responses.

2. **Role-Based Access Control (RBAC)**:
   - Middleware `requireRoles('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN')` validates token roles server-side.
   - Doctor accounts require `HOSPITAL_ADMIN` verification (`APPROVED`) before accessing clinical endpoints.
   - Management accounts enter `PENDING_VERIFICATION` requiring `SUPER_ADMIN` approval.

3. **Rate Limiting & Input Sanitization**:
   - Express rate limiter (`express-rate-limit`) restricting requests to 100 per 15-minute window per IP.
   - Server-side input validation on phone numbers, date formats, string lengths, and script injection.

4. **Audit Trails**:
   - Immutable audit logging (`AuditLog`) capturing actor ID, role, timestamp, action type, and modified entity.
