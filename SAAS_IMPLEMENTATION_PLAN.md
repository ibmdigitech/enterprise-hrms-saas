# SAAS ARCHITECTURE AUDIT & MULTI-TENANT IMPLEMENTATION PLAN

**Target Repository**: `https://github.com/ibmdigitech/enterprise-hrms-saas.git`  
**Reference Original Repository**: `https://github.com/ibmdigitech/HR_SYSTEM.git`  
**Date**: October 2026  
**Status**: Initial Baseline Cloned & Committed to Remote; System Audit & Architecture Plan Prepared

---

## 1. Executive Summary & Audit Context

The objective is to convert the enterprise HRMS (`HR_SYSTEM`) into an enterprise-grade, production-ready, multi-tenant, multi-company SaaS platform (`enterprise-hrms-saas`) **without breaking or rewriting any of the extensive existing HRMS workflows** (Employees, Attendance, Leaves, Approvals, Payroll, UAE Visa & Compliance, Letters, Staff Services, Offboarding, Performance, etc.).

### Current Repository State (Audited from Baseline)
- **Framework**: Next.js 16.1.1 (App Router), React 19.2.3, TypeScript 5, TailwindCSS 4.
- **ORM / Database**: Prisma 6.19.3 targeting PostgreSQL (via `DATABASE_URL` and `DIRECT_URL`).
- **Auth**: NextAuth v5 (beta.30) using JWT sessions, `@auth/prisma-adapter`, bcrypt password hashing, and brute-force lockout policies (`lib/auth/rate-limit.ts`).
- **Access Control & Guarding**:
  - `lib/auth/roles.ts`: `SUPER_ADMIN`, `ADMIN`, `HR`, `FINANCE`, `MANAGER`, `STAFF`.
  - `lib/auth/permissions.ts`: Granular permission catalog with role defaults and explicit user overrides.
  - `lib/auth/scope.ts`: Current organizational boundary is coarse (`ALL`, `DEPARTMENT`, `SELF`). **No Tenant, Company, Location, or Branch entities exist in the current schema.**
  - `lib/auth/guards.ts` & `lib/auth/page-guard.ts`: Strict server-side verification re-fetching the user from the database on every request.
  - `proxy.ts` & `auth.config.ts`: Edge session gate for web and `/api/**` routes with unauthenticated public route whitelisting (`/login`, `/api/health`, `/activate/[token]`).
- **Audit & Observability**:
  - `lib/auth/audit.ts`: Dedicated append-only security audit log with strict credential redaction (`SENSITIVE_KEYS`).
  - `AuditLog`: Prisma model historically tied to `employeeId` (recently relaxed to optional).
- **Branding**:
  - `lib/branding.ts`: Static configuration file hardcoding `"IbmDigitech"`, `"IbmDigitech LLC"`, logo, and contact information.

---

## 2. Key Architecture Gaps for Multi-Tenant SaaS

| Component | Current State | Required SaaS Target State |
|---|---|---|
| **Tenant Model** | Non-existent. Single database instance shared implicitly. | Dedicated `Tenant` model with slug, custom domain, subscription status, plan limits, settings. |
| **Multi-Company Model** | Only flat department strings and `CompanyDocument` exist. | Hierarchical `Company` model belonging to `Tenant`, supporting multiple legal entities per tenant. |
| **Location / Branch** | `workLocation` is an unvalidated string on `Employee`. | Explicit `Location` model under `Company` (with address, country/emirate, timezones). |
| **Department Model** | Unstructured plain strings (`Employee.department`). | Formal `Department` model belonging to `Company` / `Tenant` with parent-child support. |
| **Tenant Isolation** | None (Single-tenant). | Row-Level Security (RLS) & Prisma Client Extension enforcing `tenantId` filtering automatically on every query, mutation, and unique constraint. |
| **User Identity & Memberships** | `User.email` is globally unique. Single role per user. | Global or scoped `User`, with a `TenantMember` / `TenantUserRole` model allowing a user to access multiple tenants/companies or role per tenant. |
| **Platform Administration** | `SUPER_ADMIN` acts within the single app. | Dedicated Platform Admin Portal (`/platform-admin` or subdomain) managing tenants, billing, feature toggles, impersonation, and global system health. |
| **Branding & Config** | Hardcoded in `lib/branding.ts`. | Dynamic per-tenant branding (company name, logo, primary color, favicon, custom domains) loaded via tenant context. |
| **Feature Gating & Subscriptions** | None. All features are open to anyone with the right role. | Subscription tiering (Starter, Professional, Enterprise) and quota enforcement (max employees, storage, module toggles). |

---

## 3. SaaS Hierarchy & Data Architecture

```text
Platform (Super Admin / Global Operations)
   │
   ├── Tenant (SaaS Organization / Subscriber)
   │      │
   │      ├── TenantSubscription & Plan (Limits: maxEmployees, activeModules)
   │      ├── TenantSettings & Dynamic Branding (Logo, Colors, Domain)
   │      │
   │      ├── Company (Legal Entity A)
   │      │      ├── Location / Branch (HQ, Dubai Office, Abu Dhabi Office)
   │      │      │      └── Department (IT, HR, Operations)
   │      │      │             └── Employee Master Data
   │      │      └── Company (Legal Entity B - Subsidiary)
   │      │
   │      └── Tenant Memberships / Scoped RBAC (Tenant Admin, HR, Manager, Staff)
   │
   └── Platform Admin (Global Metrics, Tenant Provisioning, Support Impersonation)
```

---

## 4. Multi-Tenant Phased Implementation Roadmap

### Phase 1: SaaS Schema Foundation & Non-Destructive Migrations
1. **Define Core SaaS Models**:
   - `Tenant`: `id`, `name`, `slug`, `domain`, `status` (ACTIVE, SUSPENDED, TRIAL), `planId`, `createdAt`.
   - `Company`: `id`, `tenantId`, `name`, `registrationNumber`, `taxId`, `currency`, `logoUrl`, `isPrimary`.
   - `Location`: `id`, `tenantId`, `companyId`, `name`, `code`, `country`, `state`, `city`, `timezone`.
   - `Department`: `id`, `tenantId`, `companyId`, `name`, `code`, `parentId`.
   - `TenantSubscription`: `id`, `tenantId`, `plan`, `maxEmployees`, `modulesAllowed`, `expiresAt`.
2. **Add Multi-Tenant Foreign Keys**:
   - Add `tenantId String?` and `companyId String?` to `Employee`, `User`, `LeaveRequest`, `Payroll`, `AttendanceRecord`, `Document`, `AuditLog`, `SecurityLog`, etc.
   - Default migration assigns existing data to a default `Tenant ("Primary Tenant")` and `Company ("Default Company")` so existing functionality continues uninterrupted.
   - Update unique constraints to compound keys (e.g., `@@unique([tenantId, email])`, `@@unique([tenantId, employeeCode])`).

### Phase 2: Tenant Resolution & Request Context
1. **Tenant Middleware Resolution**:
   - Extract tenant context from:
     - Subdomain: `tenant1.hrms.io`
     - Custom Domain: `hrms.customer.com`
     - Header / Session cookie: `x-tenant-id` (for development and multi-tenant user switching)
   - Attach verified `tenantId` to Next.js headers / request context.
2. **Prisma Client Multi-Tenant Extension**:
   - Wrap Prisma queries with `$extends` query client extension that automatically injects `where: { tenantId }` into all reads, creates, updates, and deletes for tenant-scoped models.
   - Prevents catastrophic data leaks (IDOR across tenants).

### Phase 3: Auth & Identity Refactoring
1. **Tenant-Aware Authentication**:
   - Support login by tenant subdomain or unified login with tenant selection if user belongs to multiple organizations.
   - Update NextAuth `auth.config.ts` and `auth.ts` to include active `tenantId`, `companyId`, and tenant-specific role in session token.
2. **Scoped RBAC**:
   - Update `lib/auth/scope.ts` and `lib/auth/guards.ts` to evaluate `tenantId` and `companyId` boundaries in addition to department.

### Phase 4: Dynamic Tenant Branding & Settings
1. **Dynamic Branding Provider**:
   - Replace static `lib/branding.ts` references with a Tenant Branding Provider / Context hook that fetches custom logos, primary colors, system titles, and legal footers.
2. **Tenant Settings UI**:
   - Tenant Admins can configure their company profiles, branches, departments, leave policies, and visual themes.

### Phase 5: Platform Administration & Tenant Provisioning
1. **Super Admin Dashboard (`/platform-admin`)**:
   - Tenant overview: Active tenants, user counts, employee usage against quota.
   - Tenant Creation Wizard: Provision new tenant slug, admin credentials, seed default department and company structures.
   - Tenant Suspension / Plan upgrades.
   - Read-only impersonation or support mode with full security audit trails.

### Phase 6: Comprehensive Verification & Regression Testing
1. **Baseline HRMS Regression Suite**:
   - Run Vitest suite on all UAE payroll, leave calculation, attendance import, and exit lifecycle modules to ensure 100% backward compatibility.
2. **Multi-Tenant Isolation Tests**:
   - Verify that Tenant A users cannot query or mutate Tenant B records even if IDs are guessed or forged.
3. **CI/CD Pipeline Setup**:
   - Configure GitHub Actions in `enterprise-hrms-saas` for type-checking, linting, testing, and automated preview deployments.

---

### Current Status & Progress Tracking

- [x] **Phase 1: Multi-Tenant & Database-Per-Tenant Schema Foundation**
  - Added `Tenant`, `TenantMembership`, `Company`, `Location`, `Department`, `TenantSubscription` models.
  - Added `databaseUrl` to `Tenant` model for dedicated database-per-tenant support.
  - Linked `Employee`, `Attendance`, `LeaveRequest`, and `SalaryRecord` to `tenantId` and `companyId` with composite indexes.
  - Created [`scripts/saas-migration-backfill.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/scripts/saas-migration-backfill.ts) for zero-downtime legacy data migration.
  - Validated and compiled typed Prisma client (`npx prisma generate`).
- [x] **Phase 2: Database-Per-Tenant Pool & Scoped Prisma Client**
  - Created [`lib/tenant/database-pool.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/lib/tenant/database-pool.ts) to manage connection pools to separate databases.
  - Created [`lib/tenant/provision-database.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/lib/tenant/provision-database.ts) for automated `CREATE DATABASE` and migration provisioning.
  - Created [`lib/tenant/scoped-prisma.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/lib/tenant/scoped-prisma.ts) for query isolation.
  - Updated Edge [`proxy.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/proxy.ts) and [`lib/tenant/context.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/lib/tenant/context.ts) for request header tenant resolution.
  - Updated [`lib/auth/scope.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/lib/auth/scope.ts) with multi-tenant awareness.
- [x] **Phase 3: Tenant-Aware NextAuth Authentication & Session Extension**
  - Included `tenantId`, `companyId`, and `tenantSlug` in [`next-auth.d.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/next-auth.d.ts).
  - Extended JWT and Session callbacks in [`auth.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/auth.ts) and [`auth.config.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/auth.config.ts).
  - Built Top-Bar [`components/tenant/tenant-switcher.tsx`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/components/tenant/tenant-switcher.tsx).
- [x] **Phase 4: Dynamic Branding Provider & Tenant Organization Settings**
  - Upgraded [`lib/branding.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/lib/branding.ts) into dynamic `getTenantBranding(tenantId)` with fallback.
- [x] **Phase 5: Platform Super Admin Control Plane**
  - Built `/platform-admin` dashboard route protected by `SUPER_ADMIN` role.
  - Implemented real-time platform metrics (Active Tenants, Dedicated DBs, Employees).
  - Built automated Tenant Creation Modal and Server Actions (`app/platform-admin/actions.ts`).
- [x] **Phase 6: Multi-Tenant Isolation Tests & CI/CD**
  - Created [`tests/multi-tenant-isolation.test.ts`](file:///c:/Users/lenovo/Desktop/mutisass_hrms/saas-repo/tests/multi-tenant-isolation.test.ts) covering model registries, zero-leakage scoped queries, and cross-tenant IDOR boundaries.
  - Executed Vitest test suite with 100% pass rate.

---

## 5. Immediate Next Actions

1. Implement **Phase 3: NextAuth Tenant Session Token Extension** (`auth.ts` / `auth.config.ts`).
2. Build the **Top-Bar Tenant Switcher UI** and Company Selector in `components/`.
3. Build the **Dynamic Branding Provider** replacing static constants in `lib/branding.ts`.

