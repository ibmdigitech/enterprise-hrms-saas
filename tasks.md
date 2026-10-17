# SaaS Implementation Tasks & Milestones (tasks.md)
## Structured Roadmap for Enterprise Multi-Tenant Migration

---

## Phase 1: SaaS Data Layer Foundation
- [ ] **Task 1.1**: Update `prisma/schema.prisma` in `saas-repo`:
  - Add `Tenant`, `TenantMembership`, `Company`, `Location`, `Department`, and `TenantSubscription` models.
  - Add nullable `tenantId` and `companyId` relations to all major business models (`Employee`, `User`, `LeaveRequest`, `PayrollRecord`, `AttendanceRecord`, `CompanyDocument`, `SecurityLog`, `AuditLog`).
- [ ] **Task 1.2**: Create baseline migration script (`prisma/migrations/`) with legacy data backfill assigning existing rows to a default tenant and primary company.
- [ ] **Task 1.3**: Run `prisma generate` to update typed client models.

---

## Phase 2: Tenant Isolation & Request Context
- [ ] **Task 2.1**: Implement Tenant Context Middleware in `proxy.ts`:
  - Extract tenant slug from subdomain / custom domain or development header.
  - Resolve tenant ID and inject into `x-resolved-tenant-id` header.
- [ ] **Task 2.2**: Build Scoped Prisma Client Factory in `lib/prisma.ts` using Prisma Client `$extends`:
  - Enforce automatic `tenantId` filtering for all read and write queries.
- [ ] **Task 2.3**: Update `lib/auth/scope.ts` and `lib/auth/guards.ts` to enforce tenant and company boundaries on all Server Actions and API endpoints.

---

## Phase 3: Tenant-Aware Authentication & Membership
- [ ] **Task 3.1**: Extend NextAuth session token in `auth.ts` and `auth.config.ts`:
  - Store active `tenantId`, `companyId`, and tenant-specific role.
- [ ] **Task 3.2**: Implement Tenant Switcher Server Action and UI popover in the top navigation bar.
- [ ] **Task 3.3**: Support invitation and user onboarding flow scoped to tenant organizations.

---

## Phase 4: Dynamic Branding & Organization Settings
- [ ] **Task 4.1**: Refactor `lib/branding.ts` into a dynamic server-side resolver `getTenantBranding(tenantId)` with fallback to default theme.
- [ ] **Task 4.2**: Create Tenant Organization Settings UI:
  - Manage Companies, Locations/Branches, and Departments.
  - Custom branding studio (logo upload, theme color picker, portal title).
- [ ] **Task 4.3**: Integrate quota counter and plan limit banners in Tenant Admin views.

---

## Phase 5: Platform Admin Portal
- [ ] **Task 5.1**: Build `/platform-admin` routes protected by `SUPER_ADMIN` platform role.
- [ ] **Task 5.2**: Tenant Provisioning Wizard (create tenant slug, admin account, plan assignment, default company creation).
- [ ] **Task 5.3**: Global health dashboard: active tenants, employee counts, billing status, and platform error logs.

---

## Phase 6: Testing, QA & Verification
- [ ] **Task 6.1**: Run full Vitest regression suite (`npm test`) to verify all existing UAE HRMS workflows remain 100% operational.
- [ ] **Task 6.2**: Write multi-tenant isolation integration tests verifying cross-tenant IDOR resistance.
- [ ] **Task 6.3**: Verify deployment build (`npm run build`) in `saas-repo`.
