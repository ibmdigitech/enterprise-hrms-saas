# 🏗️ iBoo HR MultiSaaS — Enterprise Architecture Audit & Master Implementation Plan

**Author**: Senior SaaS Architect & Lead Full-Stack Engineer  
**Date**: November 2026  
**Target Platform**: Next.js 16 (App Router), TypeScript 5, Prisma ORM 6 (108 models), Tailwind CSS 4, PostgreSQL 15/18, NextAuth v5  
**Codebase Context**: Multi-Tenant Enterprise HRMS SaaS (88 Page Routes, 75 UI Components, 33 Server Actions)

---

## 1. Executive Architecture Summary

The **iBoo HR MultiSaaS** application has a mature core with enterprise data models spanning employees, attendance, payroll, leaves, loans, promotions, performance, offboarding, training, and role approvals. 

To transition from a feature-rich prototype into a scalable, enterprise-grade, commercially viable multi-tenant SaaS with AI operations, this plan outlines the necessary upgrades across security, AI, background processing, document generation, and frontend consistency.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             SYSTEM STATUS                                │
├──────────────────────────┬───────────────────┬───────────────────────────┤
│ Domain                   │ Status            │ Priority Action           │
├──────────────────────────┼───────────────────┼───────────────────────────┤
│ Multi-Tenant Isolation   │ 🟡 Moderate Risk  │ Enforce Prisma Middleware │
│ AI Assistant Engine      │ 🔴 Missing        │ Deploy AI Gateway & SDK   │
│ Background Jobs / Cron   │ 🔴 Missing        │ Worker Queue / Edge Crons │
│ Document & PDF Engine    │ 🟡 Partial        │ Serverless PDF Renderer   │
│ Client-Side Architecture │ 🟢 Healthy        │ Consolidate Nav State     │
│ Database & Migrations    │ 🟡 Watch Out      │ Move to Prisma Migrate    │
└──────────────────────────┴───────────────────┴───────────────────────────┘
```

---

## 2. Priority Audit Findings & Architectural Upgrades

### 🚨 Module 1: Strict Multi-Tenant Isolation (P0 — Security Critical)
- **Current Vulnerability**: Query filtering (`where: { tenantId }`) is hand-rolled inside individual server actions. Any omitted clause risks data cross-contamination between corporate tenants.
- **Remediation**:
  1. Build a **Prisma Client Extension** (`prisma.$extends`) using query client middleware.
  2. Read active tenant context from session/token on the server.
  3. Automatically enforce `where: { tenantId }` across all `findMany`, `findFirst`, `update`, `delete`, and `count` operations on tenant-bound models.
  4. Exclude platform-level tables explicitly (e.g. `Tenant`, `SubscriptionPlan`, `PlatformSetting`).

---

### 🤖 Module 2: iBoo AI Assistant & Gateway (P1 — Core SaaS Upgrade)
- **Objective**: Embedded contextual AI assistant supporting HR managers, company admins, and employees within authorized boundaries.
- **Architecture**:
  1. **Provider-Agnostic Engine**: Integration layer supporting OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), Google Gemini (Gemini 1.5 Pro / Flash), and local Ollama models.
  2. **Streaming AI Gateway**: Server-Sent Events (SSE) route at `/api/ai/chat` utilizing the unified Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`).
  3. **Strict Tool-Calling (Function Calling)**:
     - `getLeaveBalance(employeeId)`
     - `getUpcomingDocumentExpiries(tenantId, daysAhead)`
     - `getAttendanceExceptions(tenantId, dateRange)`
     - `draftHRLetter(employeeId, templateType)`
     - `summarizePayrollExceptions(tenantId, cycleId)`
  4. **Floating UI Workspace**: Persistent floating action button (FAB) + slide-out drawer matching the iBoo HR brand (Teal `#0D9488`, Gold `#F59E0B`, Navy `#0F172A`).

---

### ⏱️ Module 3: Scheduled Automation & Background Jobs (P1 — Reliability)
- **Objective**: Automate lifecycle transitions, document monitoring, and temporary access revocation without relying on user page requests.
- **Remediation**:
  1. **Cron Endpoint**: `/api/cron/process-schedules` protected by `Bearer ${CRON_SECRET}`.
  2. **Automated Tasks**:
     - Auto-expire temporary role assignments reaching `expiryDate`.
     - Daily document expiry scanning (Visas, Passports, Emirates IDs, Certifications) at 30, 60, and 90-day thresholds.
     - Auto-flag missing daily biometric attendance logs.
     - Send notification digest to HR Managers.

---

### 📄 Module 4: Enterprise PDF Generation Suite (P2 — Operations)
- **Objective**: Server-side programmatic PDF generation replacing browser print stylesheets.
- **Deliverables**:
  1. **Certificate of Training Completion**: Dynamic SVG/PDF with verification QR code and tenant letterhead branding.
  2. **Promotion & Increment Letters**: Auto-filled template rendering signed corporate letterheads.
  3. **Monthly Pay Slips**: Standardized payroll slips showing earnings, deductions, overtime, and WPS compliance.
- **Tech Stack**: `@react-pdf/renderer` or headless Chromium print-to-PDF microservice.

---

### 🎨 Module 5: Frontend Cleanliness & Command Center (P2 — UX)
- **Deprecate Legacy Components**:
  - Retire `components/layout/Sidebar.tsx` in favor of `components/layout/SidebarOptimized.tsx` as the single canonical sidebar.
- **Command Palette Enhancement (`Cmd + K`)**:
  - Global indexing across employees, pending approval items, and quick action shortcuts.

---

## 3. Phased Implementation Roadmap

```mermaid
flowchart TD
    subgraph Phase 1 [Phase 1: Security & Multi-Tenancy]
        P1A["Prisma Tenant Isolation Extension"]
        P1B["Sidebar & Navigation Deduplication"]
    end

    subgraph Phase 2 [Phase 2: Enterprise AI Integration]
        P2A["Install AI SDKs & Provider Adapters"]
        P2B["Implement AI Gateway & Permission-Controlled Tools"]
        P2C["Floating Assistant UI & AI Dashboard Insights"]
    end

    subgraph Phase 3 [Phase 3: Background Automation]
        P3A["Cron Runner for Document Expiries"]
        P3B["Auto-Revocation of Temporary Access"]
    end

    subgraph Phase 4 [Phase 4: PDF & Reporting Engine]
        P4A["Training Certificate Generator with QR"]
        P4B["Payslip & Letterhead PDF Exporter"]
    end

    Phase 1 --> Phase 2
    Phase 2 --> Phase 3
    Phase 3 --> Phase 4
```

---

## 4. Immediate Next Actions

| Step | Action | Impact |
|:---:|:---|:---|
| **1** | Install AI SDK packages (`npm i ai @ai-sdk/openai @ai-sdk/google`) | Enables LLM provider connection |
| **2** | Deploy Floating Chat Widget (`components/ai/ai-chat-drawer.tsx`) | Gives users immediate AI interface |
| **3** | Implement `/api/ai/chat` Route with Role-Scoped Tools | Connects AI to live, authorized HR data |
| **4** | Setup Cron Worker for Expiry Notifications | Eliminates manual compliance audits |

