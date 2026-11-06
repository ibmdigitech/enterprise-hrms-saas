# iBoo HR MultiSaaS — Enterprise AI Architecture & Implementation Plan

> **Document Version**: 1.0.0  
> **Target Platform**: Next.js 16 (App Router), Prisma ORM, PostgreSQL, Tailwind CSS 4, Radix UI  
> **Branding System**: Teal (`#0D9488`), Gold (`#F59E0B`), Deep Navy (`#0F172A`)  
> **Status**: Approved Architecture & Roadmap

---

## 1. Executive Summary

This architecture document provides the blueprint for transforming **iBoo HR MultiSaaS** into an enterprise-grade, multi-tenant AI-powered Human Resource Management Platform.

### Key Tenets
1. **Zero SQL Generation / Execution**: The AI never generates or runs arbitrary SQL. All interactions flow through pre-defined, typed TypeScript tools with Prisma queries.
2. **Strict Multi-Tenant Scoping**: All queries derive `tenantId` strictly from the authenticated server session, enforcing zero cross-tenant leakage.
3. **Role-Gated Context**: Employees can only see their own records; Managers are restricted to their teams; HR/Admins access only their company; Super Admins manage infrastructure.
4. **Two-Tier Action Model**: Information retrieval is automatic; state-modifying actions (leave applications, letter issuance) produce structured draft payloads that require explicit human approval.
5. **Provider Agnostic**: Unified adapter layer supporting OpenAI, Google Gemini, Anthropic Claude, and local Ollama models with AES-256 encrypted credential storage.

---

## 2. High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│             PRESENTATION LAYER (Next.js 16 App Router)                │
│                                                                        │
│   ┌────────────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│   │ Floating AI Assistant  │  │ AI HR Insights   │  │ Full AI Hub  │   │
│   │ (All pages / drawer)   │  │ (Dashboard panel)│  │ (/ai-hub)    │   │
│   └───────────┬────────────┘  └────────┬─────────┘  └──────┬───────┘   │
└───────────────┼────────────────────────┼───────────────────┼───────────┘
                ▼                        ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CENTRAL AI GATEWAY                              │
│                                                                        │
│   1. Session & Auth Verification (NextAuth v5)                         │
│   2. Tenant Isolation Guard (Strict tenantId derivation)               │
│   3. Role & Permission Resolver (resolvePermissions)                   │
│   4. Rate Limiter & Monthly Token Budget Enforcement                   │
│   5. Security Audit Logging (AIUsageLog)                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                       ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  AI PROVIDER ADAPTERS        │        │  HR TOOL & RAG REGISTRY      │
│                              │        │                              │
│  - Google Gemini (Flash/Pro) │        │  - Employee Self Service     │
│  - OpenAI (GPT-4o)           │        │  - Attendance & Overtime     │
│  - Anthropic Claude 3.5      │        │  - Payroll & Loans           │
│  - Local Ollama (vLLM)       │        │  - Document Extractor (OCR)  │
│  (AES-256 Key Encryption)    │        │  - Policy RAG Vector Store   │
└──────────────────────────────┘        └──────────────────────────────┘
```

---

## 3. Database Schema Models (`prisma/schema.prisma`)

### 3.1 AI Provider & Tenant Settings
```prisma
model AIProviderConfig {
  id                 String       @id @default(cuid())
  provider           String       // "gemini" | "openai" | "anthropic" | "ollama"
  modelName          String       // e.g. "gemini-2.5-flash", "gpt-4o"
  isActive           Boolean      @default(true)
  isDefault          Boolean      @default(false)
  encryptedApiKey    String?      // AES-256-GCM encrypted
  apiBaseUrl         String?      // Custom base URL / Ollama endpoint
  maxOutputTokens    Int          @default(2048)
  temperature        Float        @default(0.2)
  costPerInputToken  Decimal      @default(0) @db.Decimal(10, 8)
  costPerOutputToken Decimal      @default(0) @db.Decimal(10, 8)
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  usageLogs          AIUsageLog[]

  @@unique([provider, modelName])
}

model AITenantSettings {
  id                String   @id @default(cuid())
  tenantId          String   @unique
  tenant            Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  enabled           Boolean  @default(true)
  monthlyTokenLimit Int      @default(500000)
  usedTokensMonth   Int      @default(0)
  allowWebSearch    Boolean  @default(false)
  allowDocGen       Boolean  @default(true)
  defaultLanguage   String   @default("en")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 3.2 Conversations, History & Token Audit
```prisma
model AIConversation {
  id            String      @id @default(cuid())
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  title         String      @default("New Conversation")
  contextModule String?     // "GENERAL" | "EMPLOYEES" | "PAYROLL" | "LEAVES"
  isArchived    Boolean     @default(false)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  messages      AIMessage[]

  @@index([tenantId, userId])
  @@index([createdAt])
}

model AIMessage {
  id             String         @id @default(cuid())
  conversationId String
  conversation   AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String         // "user" | "assistant" | "system" | "tool"
  content        String         @db.Text
  toolCalls      Json?
  toolResults    Json?
  tokensUsed     Int?
  latencyMs      Int?
  createdAt      DateTime       @default(now())

  @@index([conversationId])
}

model AIUsageLog {
  id               String            @id @default(cuid())
  tenantId         String
  tenant           Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userId           String
  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  providerConfigId String?
  providerConfig   AIProviderConfig? @relation(fields: [providerConfigId], references: [id], onDelete: SetNull)
  featureName      String            // "ASSISTANT", "DOC_OCR", "PAYROLL_CHECK"
  inputTokens      Int
  outputTokens     Int
  estimatedCost    Decimal           @default(0) @db.Decimal(10, 6)
  status           String            @default("SUCCESS")
  errorMessage     String?
  createdAt        DateTime          @default(now())

  @@index([tenantId, createdAt])
}
```

---

## 4. Permission-Scoped Tool Architecture

Every AI capability is encapsulated in a discrete tool registered with strict parameter validation (via Zod) and tenant-scoping:

### 4.1 Employee Self-Service Tools
- `get_my_leave_balance`: Returns remaining annual, sick, casual leave balances and upcoming approved requests.
- `get_my_payslip_summary`: Retrieves the user's latest monthly payslip breakdown (basic, allowances, deductions, net salary).
- `get_my_document_status`: Returns expiry countdowns for Emirates ID, Passport, and Visa.
- `draft_leave_application`: Prepares a validated leave request ready for employee submission.

### 4.2 Manager Team Tools
- `get_team_attendance_today`: Summarizes team clock-in status, missing punches, and leaves.
- `get_pending_team_approvals`: Lists leave, travel, and expense requests awaiting the manager's review.
- `summarize_team_performance`: Aggregates team appraisal cycle status and KPI progression.

### 4.3 HR & Admin Workforce Tools
- `get_workforce_visa_pipeline`: Identifies all visas and legal documents expiring within 30, 60, or 90 days.
- `detect_attendance_anomalies`: Flags consecutive unexcused absences, habitual late punches, or excessive overtime.
- `run_payroll_preflight_audit`: Compares monthly payroll figures against previous periods to flag anomalies (>20% variance, negative net pay).
- `generate_hr_letter_draft`: Prepares employment certificates, NOCs, or promotion letters formatted to company letterhead.

---

## 5. UI/UX Design System Specification

### 5.1 Color Scheme & Branding
- **Primary Teal**: `#0D9488` (`teal-600`), accent `#14B8A6` (`teal-500`)
- **Metallic Gold**: `#F59E0B` (`amber-500`), `#D97706` (`amber-600`)
- **Deep Navy Slate**: `#0F172A` (`slate-900`), `#1E293B` (`slate-800`)
- **Accents**: Indigo gradients, subtle frosted borders, smooth drawer transitions with Radix UI.

### 5.2 Interface Components
1. **Floating AI Assistant Drawer (`components/ai/AIAssistantDrawer.tsx`)**:
   - Universal floating button pinned at bottom-right of viewport.
   - Expandable slide-out drawer with message history, quick suggestion pills, streaming markdown responses, and draft action confirmation cards.
2. **AI HR Insights Widget (`app/dashboard/components/AIInsightsWidget.tsx`)**:
   - High-impact widget placed on `/dashboard` showcasing critical workforce alerts (visa expiries, attendance anomalies, pending approvals).
3. **Super Admin AI Control Center (`/super-admin/ai`)**:
   - Configuration dashboard for adding API keys (encrypted), toggling providers, adjusting model parameters, and inspecting token consumption per company.

---

## 6. Implementation Phases

| Phase | Milestone | Deliverables |
|---|---|---|
| **Phase 1** | **Core Gateway & Schema** | Prisma models, encryption utility, multi-provider adapter interface, and session tenant guard. |
| **Phase 2** | **Floating Assistant & UI** | Floating launcher button, streaming chat drawer, markdown/table cards, and self-service tools. |
| **Phase 3** | **Dashboard Insights Panel** | Dashboard AI widget with real-time risk alerts and one-click drilldowns. |
| **Phase 4** | **Document Intelligence & OCR**| Emirates ID, Passport, and Visa data extraction pipeline. |
| **Phase 5** | **Operations & Payroll Checks** | Attendance anomaly detector and payroll preflight validator. |
| **Phase 6** | **Super Admin Platform Controls**| Key management UI, tenant token quotas, usage billing metrics, and end-to-end tests. |

