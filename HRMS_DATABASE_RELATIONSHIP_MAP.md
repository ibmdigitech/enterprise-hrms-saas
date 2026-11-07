# HRMS Database Relationship Map

The system uses 109 interrelated Prisma models organized into domain clusters. Below is the structural mapping of the core entities and their relational integrity.

```mermaid
erDiagram
    Tenant ||--o{ Company : "has many legal entities"
    Tenant ||--o{ TenantMembership : "memberships"
    Tenant ||--o| TenantSubscription : "subscription plan"
    Tenant ||--o{ CompanyModule : "purchased modules"
    Tenant ||--o{ SupportTicket : "support inquiries"
    Tenant ||--o{ SubscriptionInvoice : "billing history"
    Tenant ||--o{ Employee : "workforce master"

    Company ||--o{ Location : "branches"
    Company ||--o{ Department : "departments"
    Company ||--o{ Employee : "assigned staff"
    Company ||--o{ CompanyModule : "module entitlements"

    User ||--o| Employee : "linked workforce identity"
    User ||--o{ TenantMembership : "tenant access"
    User ||--o{ RoleRequest : "access requests"
    User ||--o{ SupportTicket : "created tickets"
    User ||--o{ SupportTicketMessage : "authored replies"

    Employee ||--o| SalaryStructure : "active compensation"
    Employee ||--o{ SalaryRecord : "monthly payslips"
    Employee ||--o{ LeaveBalance : "annual quotas"
    Employee ||--o{ LeaveRequest : "leave submissions"
    Employee ||--o{ Attendance : "time logs"
    Employee ||--o{ LetterRequest : "letter submissions"
    Employee ||--o{ Letter : "issued letters"
    Employee ||--o{ LoanApplication : "loans"
    Employee ||--o{ EmployeePromotion : "promotions"
    Employee ||--o{ ExitCase : "exit lifecycle"

    Module ||--o{ CompanyModule : "tenant entitlements"
    SubscriptionPlan ||--o{ TenantSubscription : "active subscriptions"

    LetterRequest ||--o{ LetterApproval : "multi-tier approvals"
    LetterRequest ||--o| Letter : "generates signed doc"
    LetterTemplate ||--o{ Letter : "template schema"
    LetterTemplate ||--o{ LetterRequest : "template schema"

    SupportTicket ||--o{ SupportTicketMessage : "conversation thread"
```

---

## Key Model Structures:

### 1. Tenancy & Organization
- `Tenant`: Multi-tenant boundary (`id`, `name`, `slug`, `status`, `databaseUrl`).
- `Company`: Legal business entity under a tenant (`id`, `tenantId`, `name`, `taxId`, `currency`).
- `TenantMembership`: Join entity linking `User` to `Tenant` with scoped role (`ADMIN`, `HR`, `FINANCE`, `MANAGER`, `STAFF`).

### 2. Commercial & Module Architecture
- `Module`: System capabilities (`id`, `key`, `name`, `category`, `isCore`, `isActive`).
- `CompanyModule`: Entitlement join table between `Tenant`, `Company`, and `Module` with status (`ENABLED`, `DISABLED`, `TRIAL`, `EXPIRED`) and JSON `config`.
- `SubscriptionPlan`: Packaging tiers (`id`, `name`, `slug`, `priceMonthly`, `priceAnnual`, `currency`, limits).
- `TenantSubscription`: Active commercial plan for a tenant.
- `SubscriptionInvoice`: Financial records linked to subscriptions and payment transactions.

### 3. Employee Master & Operations
- `Employee`: Complete employee record with dual lifecycle tracking (`lifecycle`: `PRE_JOINING` to `EXITED`, and `deletedAt` for legal record retention compliance).
- `SalaryStructure` & `SalaryRecord`: Configured salary components and generated payslips.
- `LeaveRequest` & `LeaveApproval`: Hierarchical workflow records.
- `LetterRequest` & `LetterApproval`: 4-step letter governance system.

