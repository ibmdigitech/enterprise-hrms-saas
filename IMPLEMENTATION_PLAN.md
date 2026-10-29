# Enterprise HRMS SaaS – Super Admin & Multi-Company Implementation Plan

## Project Status
**Repository**: https://github.com/ibmdigitech/enterprise-hrms-saas  
**Date**: October 2026  
**Current Phase**: Phase 1 - Foundation & Schema (In Progress)

---

## ✅ Completed Work (Phase 1 - Foundation)

### 1. Prisma Schema Extensions
**File**: `prisma/schema.prisma`

Added the following new models:
- **Module** - SaaS feature modules catalog
- **CompanyModule** - Company-specific module entitlements
- **SupportTicket** & **SupportTicketMessage** - Support ticketing system
- **PlatformUser** - Platform-level users (Super Admin, Support, Ops, Finance)
- **PlatformSetting** - Platform-wide configuration
- **Integration** - Platform/tenant integrations (Email, SMS, Payment, AI, etc.)
- **BackgroundJob** - Background job tracking
- **IntegrationHealth** - Integration health monitoring
- **ApplicationError** - Application error tracking

### 2. Role System Overhaul
**File**: `lib/auth/roles.ts`

New role hierarchy:
```
SUPER_ADMIN (60) - Platform owner, full access
├── PLATFORM_SUPPORT (55) - Platform support team
├── PLATFORM_OPS (55) - Platform operations
├── PLATFORM_FINANCE (30) - Platform billing/finance
├── COMPANY_ADMIN (50) - Company administrator
├── HR_MANAGER (40) - HR management
├── DEPARTMENT_MANAGER (20) - Team/department manager
├── EMPLOYEE (10) - Self-service employee
└── Legacy roles (ADMIN, HR, FINANCE, MANAGER, STAFF) - Backward compatibility
```

### 3. Permission System Rewrite
**File**: `lib/auth/permissions.ts`

Comprehensive permission catalog with:
- Platform-level permissions (tenants, billing, plans, modules, users, roles, tickets, audit, integrations, settings, health)
- Company-scoped permissions (company CRUD, branches, users, subscription, modules, usage, activity, settings)
- Subscription & billing permissions
- Module management permissions
- Support ticket permissions
- Integration permissions
- All existing HRMS permissions preserved

Role grant mappings updated for new role hierarchy with backward compatibility.

### 4. Scope/Authorization System
**File**: `lib/auth/scope.ts`

New scope kinds: `ALL`, `TENANT`, `COMPANY`, `DEPARTMENT`, `SELF`

Added helper functions:
- `scopeTenantWhere()` - Tenant-scoped query filtering
- `scopeCompanyWhere()` - Company-scoped query filtering
- `canAccessTenant()` / `canAccessCompany()` - Access checks
- `getAccessibleTenantIds()` / `getAccessibleCompanyIds()` - Accessible resource lists

### 5. Authorization Guards
**File**: `lib/auth/guards.ts`

New guard functions:
- `requirePlatformRole()` - Require any platform role
- `requireCompanyRole()` - Require any company role
- `requireTenantAccess(tenantId)` - Tenant-level access control
- `requireCompanyAccess(companyId)` - Company-level access control
- Updated `validateRoleChange()` for new role hierarchy
- Updated `assignableRoles()` for new role hierarchy

---

## 📋 Implementation Phases

### Phase 2: Super Admin Portal UI (Next)
**Route Group**: `/super-admin` (or extend `/platform-admin`)

#### 2.1 Layout & Navigation
- [ ] Create `(super-admin)` route group layout
- [ ] Responsive sidebar navigation with collapsible groups
- [ ] Top header with platform branding
- [ ] Dark/light mode support
- [ ] Mobile-responsive drawer navigation

#### 2.2 Screens to Implement

| Priority | Screen | Route | Description |
|----------|--------|-------|-------------|
| P0 | Dashboard | `/super-admin/dashboard` | Platform statistics, companies, employees, subscriptions, revenue, pending requests, alerts |
| P0 | Companies | `/super-admin/companies` | Search, filter, create, edit, suspend, reactivate, archive companies |
| P0 | Add Company | `/super-admin/companies/new` | Multi-step onboarding wizard (details, admin invite, subscription, modules) |
| P0 | Company Details | `/super-admin/companies/[id]` | Overview, branches, users, subscription, modules, usage, activity, settings |
| P0 | Company Admins | `/super-admin/companies/[id]/admins` | Invite, manage, disable, reset administrator access |
| P0 | Subscription Plans | `/super-admin/plans` | CRUD for plans, prices, limits, trial, billing cycles |
| P0 | Subscriptions | `/super-admin/subscriptions` | Assign, upgrade, downgrade, renew, cancel, expire |
| P0 | Billing | `/super-admin/billing` | Invoices, payment status, receipts, transaction history |
| P0 | Modules | `/super-admin/modules` | Manage SaaS modules and company entitlements |
| P0 | Platform Users | `/super-admin/users` | Super Admin and authorized support accounts |
| P0 | Roles & Permissions | `/super-admin/roles` | Platform and company role matrices |
| P0 | Support Tickets | `/super-admin/tickets` | Company requests, issues, status, resolution |
| P0 | Audit Logs | `/super-admin/audit` | Searchable security and administrative events |
| P0 | Integrations | `/super-admin/integrations` | Email, attendance devices, AI services, payment providers |
| P0 | Platform Settings | `/super-admin/settings` | Branding, security policies, notification templates, general config |
| P0 | System Health | `/super-admin/health` | Failed jobs, integration status, errors, monitoring |

### Phase 3: Multi-Tenant Architecture Enforcement
- [ ] Prisma middleware/extension for automatic tenant filtering
- [ ] Row-level security policies (if using PostgreSQL RLS)
- [ ] Tenant context derivation from authenticated membership
- [ ] Company switching for multi-company users
- [ ] Secure support access (explicit, audited)

### Phase 4: Company Admin Portal
**Route Group**: `/company/[companyId]` or similar branded workspace

- [ ] Branded workspace per company
- [ ] Navigation based on subscription entitlements + user permissions
- [ ] All existing HRMS modules (Employee Mgmt, Organization, Recruitment, Attendance, Leave, Payroll, etc.)
- [ ] Module visibility based on `CompanyModule` entitlements

### Phase 5: Database Migrations & Data Backfill
- [ ] Generate Prisma migration for new models
- [ ] Safe data backfill scripts for existing tenants
- [ ] Default module seeding
- [ ] Default platform settings seeding
- [ ] Integration configuration seeding

### Phase 6: API & Server Actions
- [ ] Super Admin API routes for all CRUD operations
- [ ] Company onboarding workflow server actions
- [ ] Subscription management actions
- [ ] Billing/invoice actions
- [ ] Module entitlement actions
- [ ] Support ticket actions
- [ ] Platform settings actions
- [ ] Integration configuration actions

### Phase 7: Testing
- [ ] Super Admin access tests
- [ ] Company Admin access restriction tests
- [ ] Company A vs Company B isolation tests
- [ ] Company creation & admin invitation tests
- [ ] Multi-company membership switching tests
- [ ] Subscription expiration & module access tests
- [ ] Employee/payroll/document authorization tests
- [ ] Audit logging tests
- [ ] Responsive UI tests
- [ ] Existing HRMS regression tests

### Phase 8: Documentation & Deployment
- [ ] Environment variable documentation
- [ ] README with setup/deployment instructions
- [ ] API documentation
- [ ] Migration guide for existing deployments

---

## 🎯 Immediate Next Steps

### Step 1: Generate Prisma Migration
```bash
cd saas-repo
npx prisma migrate dev --name add-super-admin-models
```

### Step 2: Create Super Admin Route Group Structure
```
app/
  (super-admin)/
    layout.tsx          # Super Admin layout with sidebar
    dashboard/
      page.tsx          # Dashboard
      actions.ts        # Dashboard server actions
      DashboardClient.tsx
    companies/
      page.tsx          # Companies list
      actions.ts        # Company CRUD actions
      CompaniesClient.tsx
      new/
        page.tsx        # Multi-step onboarding wizard
        OnboardingWizard.tsx
      [id]/
        page.tsx        # Company details
        actions.ts
        CompanyDetailsClient.tsx
        admins/
          page.tsx      # Company administrators
          actions.ts
    plans/
      page.tsx          # Subscription plans
      plans-client.tsx  # Existing - enhance
      plan-actions.ts   # Existing - enhance
    subscriptions/
      page.tsx
      actions.ts
    billing/
      page.tsx          # Existing - enhance
      billing-client.tsx
      billing-actions.ts
    modules/
      page.tsx
      actions.ts
    users/
      page.tsx
      actions.ts
    roles/
      page.tsx
      actions.ts
    tickets/
      page.tsx
      actions.ts
    audit/
      page.tsx          # Existing - enhance
    integrations/
      page.tsx
      actions.ts
    settings/
      page.tsx
      actions.ts
    health/
      page.tsx
      actions.ts
```

### Step 3: Create Shared UI Components
- [ ] `components/super-admin/Sidebar.tsx` - Responsive sidebar
- [ ] `components/super-admin/Header.tsx` - Top header
- [ ] `components/super-admin/DataTable.tsx` - Searchable, filterable, paginated tables
- [ ] `components/super-admin/KPICard.tsx` - Dashboard metrics cards
- [ ] `components/super-admin/ModuleCard.tsx` - Module management
- [ ] `components/super-admin/SubscriptionCard.tsx` - Subscription display

---

## 🔧 Technical Decisions

### Route Group Choice: `/super-admin` vs `/platform-admin`
**Decision**: Use `/super-admin` as new route group, keep `/platform-admin` as alias or redirect
- Cleaner separation from existing platform admin
- Clearer semantics for "Super Admin" role
- Can coexist during transition

### Database Strategy
- **Additive migrations only** - No destructive changes
- **Default data seeding** - Core modules, platform settings, default plans
- **Backward compatibility** - Legacy roles map to new permissions

### Tenant Isolation
- Prisma `$extends` middleware for automatic `tenantId`/`companyId` injection
- Server-side authorization on every sensitive operation
- No client-trusted company IDs

### UI Framework
- **Radix UI** + **Tailwind CSS 4** (existing)
- **shadcn/ui** patterns (existing)
- **Responsive**: Desktop sidebar, Tablet collapsible, Mobile drawer
- **Theme**: Light/Dark with CSS variables

---

## 📦 Dependencies to Verify
- [ ] `@radix-ui/react-*` components available
- [ ] `sonner` for toasts
- [ ] `zod` for validation
- [ ] `date-fns` for date formatting
- [ ] `recharts` or similar for analytics charts
- [ ] `lucide-react` for icons (already used)

---

## 🚀 Deployment Checklist
- [ ] Run Prisma migration on staging
- [ ] Seed default modules and platform settings
- [ ] Create initial SUPER_ADMIN user
- [ ] Configure environment variables for new features
- [ ] Test multi-tenant isolation
- [ ] Verify existing HRMS functionality unaffected
- [ ] Load test platform admin endpoints
- [ ] Document rollback procedure

---

## 📝 Notes

### Existing Assets to Reuse
- `/platform-admin` dashboard, billing, plans, audit - enhance rather than rebuild
- `lib/branding.ts` - dynamic tenant branding
- `components/tenant/tenant-switcher.tsx` - multi-tenant switching
- `lib/tenant/scoped-prisma.ts` - tenant isolation
- All existing HRMS modules and workflows

### Risk Mitigation
- **No breaking changes** to existing user-facing routes
- **Feature flags** for gradual rollout
- **Comprehensive audit logging** for all admin actions
- **MFA requirement** for SUPER_ADMIN accounts

---

*Last Updated: October 2026*  
*Next Review: After Phase 2 completion*