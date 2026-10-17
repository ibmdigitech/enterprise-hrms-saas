# Persistent System Memory & Project Context (memmory.md)
## Enterprise Multi-Tenant SaaS HRMS

---

## 1. Project Identifiers & Repository Links

- **Destination SaaS Repo (Target)**: `https://github.com/ibmdigitech/enterprise-hrms-saas.git`
- **Baseline Original Repo (Reference - Do Not Modify)**: `https://github.com/ibmdigitech/HR_SYSTEM.git`
- **Local Working Root**: `c:\Users\lenovo\Desktop\mutisass_hrms\`
  - `HR_SYSTEM-git-check\`: Untouched local clone of original reference application.
  - `saas-repo\`: Active local clone and git workspace for `enterprise-hrms-saas`.

---

## 2. Core Architectural Decisions

1. **Shared Database with Logical Row-Level Separation**:
   - Single PostgreSQL database instance for high cost efficiency and simpler multi-region deployments.
   - Every tenant-scoped model holds a `tenantId` (CUID) column.
   - Prisma Client `$extends` extension enforces tenant filtering transparently.
2. **Tenant Hierarchy**:
   `Tenant -> Companies -> Locations -> Departments -> Employees`.
3. **User Identity vs. Tenant Membership**:
   - `User` represents a global identity (email/password or OAuth).
   - `TenantMembership` links a `User` to a `Tenant` with a designated role (`ADMIN`, `HR`, `FINANCE`, `MANAGER`, `STAFF`).
   - Platform operations are controlled exclusively by `SUPER_ADMIN` at the platform level.
4. **Dynamic Branding Architecture**:
   - Hardcoded `lib/branding.ts` is phased out in favor of dynamic DB-driven brand tokens rendered through CSS custom variables.

---

## 3. Technology Stack Versions

- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3, Radix UI Primitives, Lucide Icons, Sonner notifications
- **Styling**: Tailwind CSS v4, dynamic CSS custom properties for theming
- **Database ORM**: Prisma 6.19.3
- **Authentication**: NextAuth v5 (beta.30), bcryptjs password hashing, brute-force lockout protections
- **Testing**: Vitest 5.0.2

---

## 4. Key Security & Compliance Rules

- Never execute queries on tenant tables without `tenantId`.
- Never trust client-supplied tenant or company IDs without verifying active `TenantMembership`.
- Sensitive audit keys (`password`, `token`, `secret`, `connectionstring`) must always be redacted before logging.
- Retain UAE statutory compliance records (documents, payslips, visa contracts) under tenant-isolated paths.
