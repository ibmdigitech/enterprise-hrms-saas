# Implementation Plan — HRMS SaaS (saas-repo)

**Start Date:** 2026-11-12  
**Repository:** C:\Users\lenovo\Desktop\mutisass_hrms\saas-repo  
**Dev Server:** http://localhost:3000  
**Database:** PostgreSQL (Docker, port 5434 → container 5432)  
**Login Credentials:** admin@company.com / password123 (ADMIN), superadmin@hrms.local / SuperAdmin@123 (SUPER_ADMIN)

---

## Completed This Session

| Item | Status |
|------|--------|
| TypeScript build | PASS — 0 errors, 62 pages generated |
| Prisma schema | 27+ multi-tenant models restored and validated |
| Database | Seeded: Tenant, Company, Location, Departments, SubscriptionPlan, TenantSubscription, Users (admin/manager/staff), TenantMemberships, PlatformUser |
| Dev server | Running on localhost:3000 |
| Super admin user | Created in `user` table with login password SuperAdmin@123 |

---

## Phase 1 — Super Admin Models & Platform Features (Days 1–13)

### 1.1 Super Admin CRUD APIs (Days 1–3)
Create missing API routes for platform models:
- `app/api/platform-users/route.ts` — PlatformUser CRUD
- `app/api/platform-settings/route.ts` — PlatformSetting CRUD
- `app/api/integrations/route.ts` — Integration CRUD
- `app/api/company-modules/route.ts` — CompanyModule CRUD
- `app/api/support-tickets/route.ts` — SupportTicket + SupportTicketMessage CRUD
- `app/api/role-requests/route.ts` — RoleRequest CRUD
- `app/api/company-documents/route.ts` — CompanyDocument CRUD (uses `fileBytes` for storage calc)

### 1.2 Super Admin Dashboard Completion (Days 3–5)
- Verify `/super-admin/dashboard` aggregates: tenant count, company count, active subscriptions, pending role requests, open tickets, AI budget alerts
- Fix `leaveRequest` count where clause to use `employee.tenantId`

### 1.3 Billing & Subscription Management (Days 5–7)
- Wire `SubscriptionInvoice` and `PaymentTransaction` creation on renewal
- Add invoice PDF generation
- Connect `PaymentTransaction` to Stripe/PayPal (currently `MANUAL` default)

### 1.4 Module Enablement (Days 7–9)
- `CompanyModule` toggle per company via `/super-admin/modules`
- Gate feature access: block payroll routes if `TenantSubscription.hasPayroll` is false
- Connect `Module.priceMonthly`/`priceAnnual` to billing

### 1.5 Support Ticket Workflow (Days 9–11)
- Ticket lifecycle: REQUESTED → IN_REVIEW → RESPONDED → RESOLVED → CLOSED
- `SupportTicketMessage` with `visibility` (INTERNAL/PUBLIC)
- Email notifications on ticket updates (pending NOTIFY-001)

### 1.6 Role Request Approval (Days 11–13)
- `RoleRequest` status: PENDING → APPROVED/REJECTED
- On approval, create `TenantMembership` for the user

---

## Phase 2 — AI Implementation (Days 1–8)

### 2.1 AI Module Marketplace Seed (Days 1–2)
Seed `AIModule` records:

| Key | Name | Category | Provider | Price Monthly | Token Allowance |
|-----|------|----------|----------|---------------|-----------------|
| ai_hr_assistant | AI HR Assistant | PRODUCTIVITY | OPENAI | 0 | 500000 |
| ai_cv_parser | AI CV Parser | RECRUITMENT | OPENAI | 49 | 200000 |
| ai_doc_intel | AI Document Intelligence | DOCUMENT | OPENAI | 79 | 300000 |
| ai_payroll | AI Payroll Anomaly Detection | PAYROLL | ANTHROPIC | 99 | 400000 |
| ai_compliance | AI Compliance Advisor | ANALYTICS | GOOGLE | 69 | 250000 |

### 2.2 AI Company Budget Seed (Day 2)
Create `AICompanyBudget` for default tenant:
- `monthlyBudgetAed`: 500
- `hardStopEnabled`: true
- `warningThresholdPercent`: 80

### 2.3 Unify AI Provider Logic (Days 3–4)
Merge `lib/ai/index.ts` `callAIProvider` with `lib/ai/provider.ts` `getLanguageModel` so chat route and server actions use the same provider resolution.

### 2.4 AI Usage Tracking in Chat Route (Days 4–5)
In `app/api/ai/chat/route.ts`:
- Count tokens from `streamText` response
- Write `AIUsageLog` record (tenantId, companyId, userId, aiModuleKey, provider, model, tokens, cost, actionName)
- Update `AICompanyBudget.currentSpendAed`
- Enforce `hardStopEnabled`: reject when budget exceeded

### 2.5 AI Budget Enforcement Middleware (Days 5–6)
Add budget check before every AI API route:
- `GET /api/ai/config` — return remaining budget
- All POST AI routes — check `AICompanyBudget.hardStopEnabled` and `warningThresholdPercent`

### 2.6 Tenant AI Usage Dashboard (Days 6–8)
- Page: `/dashboard/ai-usage` (tenant-scoped)
- Show: current spend vs budget, tokens used this month, top AI modules by usage
- Verify `/super-admin/ai-services` shows cross-tenant AI spend

### 2.7 AI Environment Variables (Day 8)
Add to `.env.example`:
```
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
```

---

## Phase 3 — Critical Migration: GAP-01 (Days 1–4)

### Pre-requisite: Fix 4 Breakages (Day 1)
| # | Location | Issue | Fix |
|---|----------|-------|-----|
| BREAK-1 | `app/api/letters/route.ts:107` | `new Date(null)` → 1970 date | Null guard on `joiningDate` |
| BREAK-2 | `app/payroll/loans/apply/page.tsx:26-28` | `null.getFullYear()` → 500 crash | `joiningDate ?? today` |
| BREAK-3 | `app/settings/page.tsx:151` | False tenure (1970) | Null guard on `joiningDate` |
| BREAK-4 | `app/staff-services/page.tsx:212` | False tenure (1970) | Null guard on `joiningDate` |

### Migration (Days 2–4)
1. Run migration `prisma/migrations/20260928_make_employee_entry_staged/migration.sql` in a transaction with rollback test
2. Update `schema.prisma`: `designation String?`, `department String?`, `joiningDate DateTime?`, `userId String?`, `lifecycle String @default("PRE_JOINING")`
3. Add schema comment pointing to `GAP01_MIGRATION_REVIEW.md`

---

## Phase 4 — Security & Compliance Gaps (Days 1–10)

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| SEC-027 | HIGH | All seeded accounts share `password123`; no forced change | Force password change on first login; one-time activation token |
| SEC-025 | HIGH | `AUTH_SECRET` non-CSPRNG, plaintext in `.env` | `openssl rand -base64 32`; move to secret manager |
| DB-015 | HIGH | `User.role` plain String, no DB enum constraint | Convert to Prisma enum via migration |
| DB-019 | MEDIUM | `SecurityAuditLog` append-only by convention only | Restrict `hr_app` to INSERT+SELECT |
| SEC-016 | MEDIUM | ~15 files use inline `["ADMIN","HR"].includes(role)` | Migrate to `requirePermission` |
| SEC-005/SEC-028 | MEDIUM | Rate limit counters in-process (per-instance) | Swap `SlidingWindowStore` for Redis/Postgres |
| DB-024 | MEDIUM | `DIRECT_URL` holds owner password in `.env` | Secret manager |
| CFG-001 | MEDIUM | Obsolete MongoDB scripts (`scripts/initiate*.js`) | Delete after confirmation |

---

## Phase 5 — Lint & Build Quality (Days 1–10)

| Issue | Count | Fix |
|-------|-------|-----|
| `no-explicit-any` | 49 errors (P1) / 193 errors (P0) | Replace `any` with Prisma payload types per component |
| Build | PASS | Maintain zero-error build |

---

## Phase 6 — SaaS Multi-Tenant Verification (Ongoing)

Verify every application query scopes by `tenantId`:
- Dashboard employee/attendance/payroll/audit queries
- All server actions
- All API routes
- AI usage logs (`AIUsageLog.tenantId`)

Multi-tenant release blockers:
- Resolve active tenant from authenticated context (done via `TenantMembership`)
- Scope every read/write by tenant
- Revise uniqueness constraints (tenant-scoped unique indexes)
- Cross-tenant denial integration tests

---

## Timeline Summary (18 Days)

| Phase | Days | Focus |
|-------|------|-------|
| Phase 1 | 1–13 | Super Admin CRUD APIs, billing, modules, tickets, role requests |
| Phase 2 | 1–8 | AI marketplace seed, budget, usage tracking, chat integration |
| Phase 3 | 1–4 | GAP-01 null guards + migration |
| Phase 4 | 1–10 | Security fixes (password, secrets, enum, audit log, RBAC, rate limiting) |
| Phase 5 | 1–10 | Lint cleanup (49 → 0 `any` errors) |
| Phase 6 | Ongoing | Multi-tenant query scoping verification |

**Parallel execution:** Phase 3 (GAP-01) and Phase 5 (lint) can run in parallel with Phase 1 and Phase 2.

---

## Immediate Next Steps (Today, 2026-11-12)

1. Fix the 4 GAP-01 breakages — null guards on `joiningDate` in letters, loans, settings, staff-services
2. Apply GAP-01 migration — relax `NOT NULL`, add CHECK constraint
3. Seed AI modules — create `AIModule` records + `AICompanyBudget` for default tenant
4. Unify AI provider — merge `lib/ai/index.ts` and `lib/ai/provider.ts`
5. Track AI usage in chat route — write `AIUsageLog`, update `AICompanyBudget`
