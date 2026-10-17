# Product Requirements Document (PRD)
## Enterprise Multi-Tenant & Multi-Company SaaS HRMS

---

## 1. Product Vision & Goals

Transform the existing single-instance enterprise HRMS into a modern, production-ready, multi-tenant B2B SaaS platform capable of serving hundreds of enterprise client organizations ("Tenants"). Each tenant may operate one or multiple legally registered entities ("Companies"), manage branch offices or job sites ("Locations"), and organize teams across structured departments and reporting lines.

### Core Objectives
1. **Multi-Tenant Isolation**: Guarantee zero cross-tenant data leakage via automated query-level and schema-level isolation.
2. **Multi-Company & Multi-Location**: Enable corporate groups and conglomerates to manage multiple subsidiaries and sites under a single subscription.
3. **Preserve 100% Core Functionality**: Keep all existing modules (Employees, UAE Payroll & WPS, Attendance, Leaves, Approvals, UAE Visa & Compliance, Letters, Asset tracking, Offboarding, Performance reviews) operational without regression.
4. **Platform Administration**: Provide a centralized control plane for SaaS administrators to onboard tenants, manage plans/quotas, monitor system vitals, and handle customer support securely.
5. **Dynamic White-Labeling & Branding**: Allow tenants to personalize their workspace with custom logos, brand colors, custom subdomains, and localized system metadata.

---

## 2. User Personas & Hierarchy

| Persona | Level | Capabilities & Primary Use Cases |
|---|---|---|
| **Platform Super Admin** | Platform Level | Global system monitoring, provisioning new tenants, configuring subscription tiers, managing billing status, maintenance mode, system-wide health and audit inspection. |
| **Tenant Owner / Admin** | Tenant Level | Full administrative control over their tenant account; manages companies, locations, departments, user invitations, role assignments, branding, and billing/subscription. |
| **Company HR Manager** | Company / Location Level | Manages employee master data, onboarding/offboarding, visa processing, leave approvals, document generation, and disciplinary workflows within assigned companies/locations. |
| **Finance / Payroll Admin** | Company Level | Executes monthly payroll runs, generates WPS SIF files, oversees allowances/deductions, reviews loan applications, and approves travel reimbursements. |
| **Line Manager** | Department / Branch Level | Approves leaves, shift assignments, performance evaluations, and employee change requests for directly reporting team members. |
| **Employee / Staff** | Self Level | Self-service portal: view payslips, clock in/out (attendance), submit leave requests, request official letters, view company policies, and update personal profile. |

---

## 3. Key Feature Specifications

### 3.1. Tenant & Organization Structure
- **Tenant Entity**: Root subscriber entity (e.g., "Al Futtaim Group"). Stores slug (`alfuttaim.hrms.io`), billing contact, subscription tier, and custom branding tokens.
- **Company Entity**: Legal corporate entity (e.g., "Al Futtaim Automotive LLC", "Al Futtaim Retail LLC"). Stores trade license number, tax/VAT ID, base currency, and corporate letterhead.
- **Location Entity**: Physical branch/worksite (e.g., "Dubai Festival City HQ", "Abu Dhabi Branch", "Jebel Ali Warehouse"). Stores physical address, geofence coordinates for biometric clocking, and timezone.
- **Department Entity**: Functional unit (e.g., "Engineering", "Human Resources", "Finance") linked to specific companies or company-wide.

### 3.2. Tenant Identification & Routing
- **Subdomain Routing**: `https://<tenant-slug>.hrms-saas.com`
- **Custom Domains**: `https://hrms.clientdomain.com` (verified via CNAME and SSL handshake).
- **Tenant Context Resolution**: Edge middleware inspects host headers, validates tenant status (ACTIVE vs. SUSPENDED), and injects active context into request headers.
- **Tenant Switcher**: For users belonging to multiple organizations (e.g., consultants, group CFOs), a top-bar dropdown allows switching active tenant without re-authenticating.

### 3.3. Subscription Tiers & Feature Gating
- **Tier Tiers**:
  - **Starter**: Up to 50 employees, 1 company, core HR & Attendance.
  - **Growth**: Up to 250 employees, 3 companies, Payroll, Leaves & UAE Compliance.
  - **Enterprise**: Unlimited employees, multi-company, custom branding, API access, SLA guarantees.
- **Quota Enforcement**: Automated guards block adding employees, creating additional legal companies, or activating premium modules when plan limits are reached.

### 3.4. Dynamic Branding & Customization
- Dynamic brand tokens replacing hardcoded values: `logoUrl`, `faviconUrl`, `primaryColor`, `accentColor`, `portalTitle`, and `footerLegalText`.
- CSS variable injection on document head for theme personalization without client bundle rebuilding.

### 3.5. Security & Isolation Guarantee
- **IDOR Prevention**: Every query for tenant-scoped models must strictly enforce `WHERE tenantId = :currentTenantId`.
- **Compound Unique Constraints**: Email, employeeCode, and requisition IDs must be unique within a tenant/company scope rather than globally.
- **Audit Trails**: Security logs must capture `tenantId`, `actorId`, `ipAddress`, and redacted payload for any cross-organization modifications.

---

## 4. Non-Functional Requirements

- **Performance**: Edge tenant resolution overhead < 15ms. Page TTFB < 200ms.
- **Availability**: 99.9% uptime target with zero cross-tenant impact during single-tenant updates.
- **Compliance & Privacy**: UAE Labor Law adherence, GDPR compliance for personal data redaction, and tenant-isolated storage buckets for uploaded employee documents.
