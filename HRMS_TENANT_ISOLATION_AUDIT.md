# HRMS Tenant Isolation Audit

## 1. Tenancy Model: Hybrid Database-Per-Tenant Architecture
The codebase supports a dual-tier isolation model:
1. **Shared Multi-Tenant Pool:** Tenancy is logically segregated via foreign keys (`tenantId` and `companyId`) on every organizational record.
2. **Dedicated Database Per Tenant:** The `Tenant` model provides an optional `databaseUrl` column. When populated, queries for enterprise customers can be dynamically routed to dedicated PostgreSQL instances, achieving physical database isolation.

---

## 2. Horizontal Data Isolation Review

### A. Database Queries
- Every operational query in API routes and server actions requires `tenantId`.
- Primary models (`Employee`, `Department`, `Location`, `SalaryRecord`, `Attendance`, `LeaveRequest`, `SupportTicket`, `CompanyModule`) include `tenantId` in composite indexes (`@@index([tenantId, ...])`).

### B. Asset & Storage Isolation
- Uploaded assets (letters, certificates, payslips, company logos) are organized under partitioned directories or database-backed configurations tagged with `tenantId`.

### C. Cross-Tenant Leakage Prevention
- Unit tests (`tests/employee-detail-idor.test.ts`, `tests/scope-idor.test.ts`) assert that out-of-scope requests return `404 Not Found` rather than leaking record existence via `403 Forbidden`.

