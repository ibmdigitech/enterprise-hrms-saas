# HRMS Missing Features and Gaps

Following our comprehensive audit of the code, database schema, and live endpoints, the following architectural gaps must be addressed to fulfill the Enterprise Modular SaaS Platform transformation:

---

## 1. Module Marketplace & Packaging Gaps
1. **Frontend-Only vs. Backend Module Entitlement:**
   - While `Module` and `CompanyModule` models exist, module checking is currently evaluated primarily at the UI navigation layer.
   - **Requirement:** A centralized backend entitlement engine (`lib/entitlements/verify.ts`) that enforces subscription checks across API routes, server actions, and export buttons, returning a clean "Module Not Subscribed" paywall when unentitled.
2. **Dynamic Module Catalogue Lifecycle:**
   - In `/super-admin/modules`, Super Admin can toggle modules, but cannot dynamically publish new modules, define pricing tiers, bundle modules, or specify fine-grained module dependencies.
   - **Requirement:** Upgrade `/super-admin/modules` into a comprehensive **Module Marketplace** with monthly/annual pricing, trial configuration, feature lists, and dependency resolution.

---

## 2. Dedicated AI Services Marketplace Gaps
1. **Scattered AI Integration:**
   - AI currently exists as a single chat drawer (`components/ai/ai-chat-drawer.tsx` and `app/api/ai/chat/route.ts`).
   - It is not structured as an independently monetizable, tiered module in the Super Admin marketplace.
2. **Missing AI Commercial Controls:**
   - No company-specific token consumption counters.
   - No monthly AI spending budget or hard usage limits.
   - No multi-provider selection (OpenAI, Google Gemini, Anthropic) managed via Super Admin credentials vault.
   - **Requirement:** Create `AIModule`, `AIUsageLog`, and `AICompanyBudget` entities with a dedicated `/super-admin/ai-services` control plane.

---

## 3. Company-Level Module Management & Upgrade Experience
1. **Customer Paywall & Self-Service Upgrades:**
   - Inside `/settings/billing` and the tenant dashboard, companies need a clear **"Subscribed Modules"** hub.
   - If an employee or admin attempts to access an unpurchased module (e.g. Recruitment or Performance), they should see an upgrade page rather than a broken screen or error.

