# HRMS RBAC and Permission Audit

## 1. Overview
The RBAC architecture in [`lib/auth/permissions.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/lib/auth/permissions.ts) is built on an enterprise least-privilege matrix. Permissions are represented as strongly typed string literals (over 130 granular capabilities).

---

## 2. Platform vs. Tenant Roles

### A. Platform Roles (Super Admin Control Plane)
Platform users exist outside tenant data boundaries and manage the multi-tenant infrastructure.
- **`SUPER_ADMIN`**: Full platform control (`platform.*` capabilities, module marketplace, pricing plans, global users, tenant provisioning, system logs).
- **`PLATFORM_SUPPORT`**: Support desk oversight, ticket resolution, tenant diagnostics.
- **`PLATFORM_FINANCE`**: Subscription billing, invoice monitoring, payment reconciliation.

### B. Tenant Roles (Customer Organization Level)
Tenant users belong to a specific `Tenant` and `Company`:
- **`ADMIN` (Tenant Admin)**: Full administrative authority over the subscribed modules of their company. Can invite users, adjust company settings, manage approval policies.
- **`HR` (HR Manager)**: Manages workforce lifecycle (recruitment, onboarding, employee master, promotions, letter generation, compliance).
- **`FINANCE`**: Access to payroll runs, salary structures, loan approvals, financial settlements, WPS export.
- **`MANAGER` (Department Manager)**: Scoped strictly to their assigned `department` or direct `reportees`. Can approve leaves, letter requests, loan recommendations, performance appraisals.
- **`STAFF` (Employee)**: Restricted to Self-Service (`SELF` scope). Can view own profile, submit leave/letter/loan requests, download own payslips, mark own attendance.

---

## 3. Scope IDOR Primitives (`lib/auth/scope.ts`)
The system enforces data boundary scopes dynamically:
1. **`ALL` Scope:** (Admin, HR) Can query across all departments within the tenant.
2. **`DEPARTMENT` Scope:** (Manager) Prisma `where` clause is automatically intersected with `{ department: caller.department }`.
3. **`SELF` Scope:** (Employee) Prisma `where` clause is strictly pinned to `{ employeeId: caller.employeeId }` or `{ userId: caller.id }`.

This prevents horizontal privilege escalation (IDOR) at the database layer.

