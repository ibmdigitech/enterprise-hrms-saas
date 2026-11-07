# HRMS Current Architecture Audit

## 1. Executive Summary & Stack Assessment
The **IBM DigiTech Enterprise HRMS** is an enterprise-grade full-stack Next.js application built on modern, secure architectural foundations. It combines relational transactional integrity via PostgreSQL and Prisma ORM with strict Role-Based Access Control (RBAC), multi-tenant tenancy hierarchies, and fine-grained authorization guards.

### Current Technology Versions (Verified):
- **Framework:** Next.js `16.1.1` (App Router architecture with server actions and streaming server components)
- **Frontend Core:** React `19.2.3`, React DOM `19.2.3`, Tailwind CSS `v3.4`, Radix UI primitives (`@radix-ui/react-*`), Framer Motion `14.6.0`, Sonner `2.0.7`, Recharts `3.8.1`, Lucide React `0.562.0`
- **Database & Data Layer:** PostgreSQL with Prisma Client & CLI `6.19.3` (109 models defined)
- **Authentication & Sessions:** NextAuth `5.0.0-beta.30` with `@auth/prisma-adapter` and bcryptjs `3.0.3`
- **AI Integration Foundation:** Vercel AI SDK `ai@7.0.163`, `@ai-sdk/openai@4.0.109`, `@ai-sdk/google@4.0.112`, `@ai-sdk/react@4.0.167`
- **Document & PDF Processing:** `pdf-lib@1.17.1`, `jspdf@4.0.0`, `jspdf-autotable@5.0.7`
- **Validation & Forms:** Zod `4.3.5`, React Hook Form `7.91.0`, `@hookform/resolvers`

---

## 2. Architecture Layers & Directory Structure

```
mutisass_hrms/saas-repo/
├── app/                           # Next.js App Router (Pages, Layouts, Server Actions)
│   ├── (modules)/                 # Domain modules: employees, payroll, attendance, leaves, etc.
│   ├── api/                       # REST/HTTP Route Handlers (Auth, PDF, AI, Cron, Search)
│   ├── dashboard/                 # Role-based dashboard & approvals
│   ├── super-admin/               # Super Admin Platform Management Portal
│   ├── support/                   # Tenant-facing Support Desk & SLA ticketing
│   └── lib/actions/               # Server Actions partitioned by business domain
├── components/                    # Reusable UI component libraries
│   ├── ui/                        # Radix UI + Tailwind styled atomic components
│   ├── layout/                    # NavigationLinks, Sidebar, Header, Breadcrumbs
│   ├── super-admin/               # SuperAdminSidebar, charts, filters
│   ├── payroll/, leave/, etc.     # Module-specific view components
│   └── ai/                        # AI Assistant chat drawer
├── lib/                           # Core utilities, services & domain engines
│   ├── auth/                      # Guards, Permissions (130+ capabilities), Scopes, Auditing
│   ├── letters/                   # Variable resolution, bilingual engine & PDF generator
│   ├── pdf/                       # PDF-lib generation utilities
│   ├── support/                   # Deterministic SLA calculation engine
│   └── prisma.ts                  # Global PrismaClient singleton
└── prisma/
    └── schema.prisma              # 109 Models defining multi-tenant SaaS schema
```

---

## 3. Authentication & Session Management
1. **NextAuth v5 Beta Integration:** Authentication operates through JWT/Session strategy with database persistence via PrismaAdapter.
2. **Session User Context:** User sessions securely hydrate user profile, role, `tenantId`, `companyId`, `employeeId`, and department scope.
3. **Password Security:** Credentials hashed using `bcryptjs` with salt factor 10. Password reset tokens and security audit flags tracked in database.

---

## 4. Multi-Tenant Architecture & Isolation
The application operates on an enterprise **Hybrid Multi-Tenant Model**:
1. **Tenant (Top-Level Account):** Represents the customer organization (e.g., Al Futtaim Group). Identified by unique `slug` (subdomain) and optional dedicated PostgreSQL connection string (`databaseUrl`) for database-per-tenant isolation.
2. **Company (Legal Entity):** Belongs to a `Tenant`. Represents subsidiaries or branches (e.g., Al Futtaim Automotive LLC).
3. **Data Isolation Enforcement:**
   - Every operational query is guarded by `tenantId` and `companyId`.
   - Backend queries utilize scoping primitives (`scopeEmployeeWhere`, `scopeWhereClause`) preventing horizontal Insecure Direct Object References (IDOR).
   - Foreign keys enforce `onDelete: Cascade` or `onDelete: SetNull` ensuring multi-tenant referential integrity.

---

## 5. Background Jobs & Scheduled Tasks
- Automated cron handlers mounted under `app/api/cron/`:
  - `app/api/cron/health/route.ts`: Periodic system connectivity and database health diagnostics.
  - `app/api/cron/invoice-notifications/route.ts`: Subscription invoice reminders and overdue status transitions.
  - `app/api/cron/maintenance/route.ts`: Automated cleanup of expired sessions and temporary tokens.
- Tracked in database via `BackgroundJob` and `ApplicationError` models.

