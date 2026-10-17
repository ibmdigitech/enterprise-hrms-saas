# SaaS Engineering & Security Rules (rules.md)
## Strict Standards for Enterprise Multi-Tenant HRMS

---

## 1. Zero-Regression Policy (Crucial)

1. **Never Break Existing Features**: The single-tenant HRMS contains complex, mission-critical modules (UAE WPS payroll formulas, EOSB gratuity accrual, biometric attendance reconciliation, exit interview workflows, offer letter generators). You must NEVER remove or rewrite these algorithms. Extend them by supplying the tenant context.
2. **Backward-Compatible Schema Changes**:
   - When adding `tenantId` or `companyId` to existing tables, columns MUST initially be nullable (`String?`).
   - Run a data migration to assign legacy data to a `DEFAULT_TENANT` and `DEFAULT_COMPANY`.
   - Never drop existing columns or alter enum types without fallback bridges.

---

## 2. Tenant Isolation Rules

1. **No Bare Queries on Tenant Models**:
   - `prisma.employee.findMany()` without a `tenantId` in the `where` clause is strictly forbidden in user-facing code.
   - All tenant queries must go through the scoped Prisma extension or explicitly verify `where: { tenantId: session.tenantId, ... }`.
2. **Never Trust Client-Supplied Tenant Identifiers**:
   - Never trust a `tenantId` received in `request.body` or query string without validating it against the authenticated user's active `TenantMembership`.
3. **Compound Foreign Keys & Cascading Deletes**:
   - When deleting or archiving a tenant or company, cascade deletes must be strictly guarded or soft-deleted to avoid accidental loss of compliance records (e.g., UAE 5-year employment document retention laws).

---

## 3. Authentication & Authorization Rules

1. **Role Resolution**:
   - Roles (`ADMIN`, `HR`, `FINANCE`, `MANAGER`, `STAFF`) are scoped to the active `TenantMembership`, not static on `User`.
   - `SUPER_ADMIN` is strictly reserved for Platform Operations and cannot be assigned through standard tenant UI.
2. **Session Guard Integrity**:
   - Always re-fetch the user's role and membership status server-side from the database for high-privilege mutations. Never trust an unverified client token payload.
3. **Audit Trail Mandate**:
   - Any modification to roles, permissions, tenant subscriptions, bank account numbers, or employee salaries MUST write an entry to `SecurityLog` with the actor's `tenantId`, `userId`, IP address, and sanitized metadata (passwords and tokens redacted).

---

## 4. UI/UX & Dynamic Styling Rules

1. **No Hardcoded Brand Names or Logos**:
   - Do NOT use hardcoded `"IbmDigitech"` strings or `/assets/logo.svg` paths in components.
   - Always consume `useBranding()` or the server-side `getTenantBranding()` utility.
2. **Tenant Theme Isolation**:
   - Custom tenant colors must be rendered via CSS variables (e.g., `--tenant-primary: #...;`) injected in layout headers. Do not write inline styles that bypass the design system.
3. **Accessible & Responsive Form Factors**:
   - Maintain mobile and desktop compatibility with clean Radix UI primitives and Tailwind CSS.
