/**
 * Effective permission resolution — the ONE authoritative resolver.
 *
 * Resolution order (per RBAC-001 remediation):
 *
 *   User
 *    └─> Role                  (User.role, string column — normalised safely)
 *        └─> Role Permissions   (static grant table below)
 *            └─> User Overrides (DENY wins, then ALLOW)
 *                └─> Scope      (organisational boundary, see scope.ts)
 *                    └─> Effective permissions
 *
 * Design rules:
 *  - DENY always beats ALLOW. An override can remove a capability a role grants.
 *  - An unrecognised or missing role resolves to EMPLOYEE (least privilege).
 *  - Nothing here trusts a client-supplied value; callers pass the server-side
 *    role loaded from the database.
 */

import { Role, ROLES, toRole } from "./roles";

/* ------------------------------------------------------------------ */
/* Permission catalog                                                  */
/* ------------------------------------------------------------------ */

export const PERMISSIONS = {
    // Platform Administration
    PLATFORM_TENANTS_VIEW: "platform.tenants.view",
    PLATFORM_TENANTS_CREATE: "platform.tenants.create",
    PLATFORM_TENANTS_MANAGE: "platform.tenants.manage",
    PLATFORM_TENANTS_SUSPEND: "platform.tenants.suspend",
    PLATFORM_TENANTS_DELETE: "platform.tenants.delete",
    PLATFORM_DASHBOARD_VIEW: "platform.dashboard.view",
    PLATFORM_BILLING_VIEW: "platform.billing.view",
    PLATFORM_BILLING_MANAGE: "platform.billing.manage",
    PLATFORM_PLANS_VIEW: "platform.plans.view",
    PLATFORM_PLANS_MANAGE: "platform.plans.manage",
    PLATFORM_MODULES_VIEW: "platform.modules.view",
    PLATFORM_MODULES_MANAGE: "platform.modules.manage",
    PLATFORM_USERS_VIEW: "platform.users.view",
    PLATFORM_USERS_MANAGE: "platform.users.manage",
    PLATFORM_ROLES_VIEW: "platform.roles.view",
    PLATFORM_ROLES_MANAGE: "platform.roles.manage",
    PLATFORM_TICKETS_VIEW: "platform.tickets.view",
    PLATFORM_TICKETS_MANAGE: "platform.tickets.manage",
    PLATFORM_AUDIT_VIEW: "platform.audit.view",
    PLATFORM_INTEGRATIONS_VIEW: "platform.integrations.view",
    PLATFORM_INTEGRATIONS_MANAGE: "platform.integrations.manage",
    PLATFORM_SETTINGS_VIEW: "platform.settings.view",
    PLATFORM_SETTINGS_MANAGE: "platform.settings.manage",
    PLATFORM_HEALTH_VIEW: "platform.health.view",
    PLATFORM_TENANT_HEALTH: "platform.tenant.health",
    PLATFORM_TENANT_IMPERSONATE: "platform.tenant.impersonate",

    // System
    SYSTEM_CONFIG: "system.config",
    SYSTEM_AUDIT_VIEW: "system.audit.view",
    SYSTEM_BACKUP_VIEW: "system.backup.view",
    SYSTEM_USER_MANAGE: "system.user.manage",
    SYSTEM_SEED: "system.seed",

    // Company Administration (Company-scoped)
    COMPANY_VIEW: "company.view",
    COMPANY_CREATE: "company.create",
    COMPANY_EDIT: "company.edit",
    COMPANY_SUSPEND: "company.suspend",
    COMPANY_REACTIVATE: "company.reactivate",
    COMPANY_ARCHIVE: "company.archive",
    COMPANY_BRANCHES_VIEW: "company.branches.view",
    COMPANY_BRANCHES_MANAGE: "company.branches.manage",
    COMPANY_USERS_VIEW: "company.users.view",
    COMPANY_USERS_INVITE: "company.users.invite",
    COMPANY_USERS_MANAGE: "company.users.manage",
    COMPANY_USERS_DISABLE: "company.users.disable",
    COMPANY_SUBSCRIPTION_VIEW: "company.subscription.view",
    COMPANY_SUBSCRIPTION_MANAGE: "company.subscription.manage",
    COMPANY_MODULES_VIEW: "company.modules.view",
    COMPANY_MODULES_MANAGE: "company.modules.manage",
    COMPANY_USAGE_VIEW: "company.usage.view",
    COMPANY_ACTIVITY_VIEW: "company.activity.view",
    COMPANY_SETTINGS_VIEW: "company.settings.view",
    COMPANY_SETTINGS_MANAGE: "company.settings.manage",

    // Subscription & Billing (Company-scoped)
    SUBSCRIPTION_PLANS_VIEW: "subscription.plans.view",
    SUBSCRIPTION_PLANS_MANAGE: "subscription.plans.manage",
    SUBSCRIPTIONS_VIEW: "subscriptions.view",
    SUBSCRIPTIONS_ASSIGN: "subscriptions.assign",
    SUBSCRIPTIONS_UPGRADE: "subscriptions.upgrade",
    SUBSCRIPTIONS_DOWNGRADE: "subscriptions.downgrade",
    SUBSCRIPTIONS_RENEW: "subscriptions.renew",
    SUBSCRIPTIONS_CANCEL: "subscriptions.cancel",
    SUBSCRIPTIONS_EXPIRE: "subscriptions.expire",
    BILLING_INVOICES_VIEW: "billing.invoices.view",
    BILLING_INVOICES_MANAGE: "billing.invoices.manage",
    BILLING_PAYMENTS_VIEW: "billing.payments.view",
    BILLING_PAYMENTS_RECORD: "billing.payments.record",
    BILLING_RECEIPTS_VIEW: "billing.receipts.view",

    // Employees
    EMPLOYEES_VIEW: "employees.view",
    EMPLOYEES_CREATE: "employees.create",
    EMPLOYEES_EDIT: "employees.edit",
    EMPLOYEES_DELETE: "employees.delete",
    EMPLOYEES_IMPORT: "employees.import",
    EMPLOYEES_EXPORT: "employees.export",
    EMPLOYEES_APPROVE: "employees.approve",

    // Promotions (Employee Lifecycle)
    EMPLOYEE_PROMOTION_VIEW: "employees.promotion.view",
    EMPLOYEE_PROMOTION_CREATE: "employees.promotion.create",
    EMPLOYEE_PROMOTION_APPROVE: "employees.promotion.approve",
    EMPLOYEE_PROMOTION_APPLY: "employees.promotion.apply",

    // Attendance
    ATTENDANCE_VIEW: "attendance.view",
    ATTENDANCE_MARK: "attendance.mark",
    ATTENDANCE_MANAGE: "attendance.manage",
    ATTENDANCE_IMPORT: "attendance.import",
    ATTENDANCE_EXPORT: "attendance.export",
    ATTENDANCE_SHIFT_MANAGE: "attendance.shift.manage",
    ATTENDANCE_MACHINE: "attendance.machine",

    // Leave
    LEAVE_VIEW: "leave.view",
    LEAVE_APPLY: "leave.apply",
    LEAVE_APPROVE: "leave.approve",
    LEAVE_MANAGE: "leave.manage",

    // Payroll
    PAYROLL_VIEW: "payroll.view",
    PAYROLL_GENERATE: "payroll.generate",
    PAYROLL_STRUCTURE_MANAGE: "payroll.structure.manage",
    PAYROLL_PAYSLIP_VIEW_ALL: "payroll.payslip.view.all",
    PAYROLL_EXPORT: "payroll.export",
    PAYROLL_OVERTIME_MANAGE: "payroll.overtime.manage",
    PAYROLL_LOCK: "payroll.lock",
    PAYROLL_SETTLE: "payroll.settle",
    PAYROLL_UNLOCK: "payroll.unlock",

    // Loans
    LOAN_VIEW: "loan.view",
    LOAN_APPLY: "loan.apply",
    LOAN_APPROVE: "loan.approve",
    LOAN_MANAGE: "loan.manage",

    // Letters
    LETTER_VIEW: "letter.view",
    LETTER_GENERATE: "letter.generate",
    LETTER_APPROVE: "letter.approve",
    LETTER_TEMPLATE_MANAGE: "letter.template.manage",

    // Visa & compliance
    VISA_VIEW: "visa.view",
    VISA_MANAGE: "visa.manage",

    // Business travel & air ticket entitlement
    TRAVEL_VIEW: "travel.view",
    TRAVEL_VIEW_ALL: "travel.view.all",
    TRAVEL_REQUEST: "travel.request",
    TRAVEL_REQUEST_ANY: "travel.request.any",
    TRAVEL_APPROVE: "travel.approve",
    TRAVEL_ENTITLEMENT_MANAGE: "travel.entitlement.manage",

    // Requests & services
    REQUEST_VIEW: "request.view",
    REQUEST_CREATE: "request.create",
    REQUEST_APPROVE: "request.approve",
    SERVICE_VIEW: "service.view",
    SERVICE_CREATE: "service.create",
    SERVICE_APPROVE: "service.approve",

    // Recruitment
    RECRUITMENT_VIEW: "recruitment.view",
    RECRUITMENT_CREATE: "recruitment.create",
    RECRUITMENT_EDIT: "recruitment.edit",
    RECRUITMENT_APPROVE: "recruitment.approve",
    RECRUITMENT_INTERVIEW: "recruitment.interview",
    RECRUITMENT_OFFER: "recruitment.offer",
    RECRUITMENT_CONVERT: "recruitment.convert",

    // Performance
    PERFORMANCE_VIEW: "performance.view",
    PERFORMANCE_REVIEW: "performance.review",
    PERFORMANCE_APPROVE: "performance.approve",

    // Training
    TRAINING_VIEW: "training.view",
    TRAINING_MANAGE: "training.manage",

    // Exit
    RESIGNATION_VIEW: "resignation.view",
    RESIGNATION_CREATE: "resignation.create",
    RESIGNATION_APPROVE: "resignation.approve",
    TERMINATION_VIEW: "termination.view",
    TERMINATION_CREATE: "termination.create",
    TERMINATION_APPROVE: "termination.approve",
    EXIT_CLEARANCE: "exit.clearance",
    EXIT_SETTLEMENT: "exit.settlement",
    EXIT_COMPLETE: "exit.complete",
    EXIT_INTERVIEW: "exit.interview",

    // Notifications
    NOTIFICATION_VIEW: "notification.view",
    NOTIFICATION_MANAGE: "notification.manage",

    // Settings
    SETTINGS_VIEW: "settings.view",
    SETTINGS_MANAGE: "settings.manage",
    SERVICE_CONFIG_MANAGE: "service.config.manage",

    // Access control
    ACCESS_REQUEST: "access.request",
    ACCESS_APPROVE: "access.approve",

    // Recruitment (legacy)
    RECRUITMENT_MANAGE: "recruitment.manage",

    // Modules
    MODULES_VIEW: "modules.view",
    MODULES_MANAGE: "modules.manage",
    COMPANY_MODULES_ASSIGN: "company.modules.assign",

    // Support
    SUPPORT_TICKETS_VIEW: "support.tickets.view",
    SUPPORT_TICKETS_CREATE: "support.tickets.create",
    SUPPORT_TICKETS_MANAGE: "support.tickets.manage",
    SUPPORT_TICKETS_ASSIGN: "support.tickets.assign",
    SUPPORT_TICKETS_RESOLVE: "support.tickets.resolve",

    // Integrations
    INTEGRATIONS_VIEW: "integrations.view",
    INTEGRATIONS_MANAGE: "integrations.manage",
    INTEGRATIONS_CONFIGURE: "integrations.configure",

    // Finance & Administration
    FINANCE_VIEW: "finance.view",
    FINANCE_MANAGE: "finance.manage",
    BUDGET_VIEW: "budget.view",
    BUDGET_MANAGE: "budget.manage",
    PETTY_CASH_VIEW: "pettycash.view",
    PETTY_CASH_MANAGE: "pettycash.manage",
    EXPENSE_VIEW: "expense.view",
    EXPENSE_MANAGE: "expense.manage",
    PROCUREMENT_VIEW: "procurement.view",
    PROCUREMENT_MANAGE: "procurement.manage",
    INVENTORY_VIEW: "inventory.view",
    INVENTORY_MANAGE: "inventory.manage",
    ACCOUNTS_PAYABLE_VIEW: "accountspayable.view",
    ACCOUNTS_PAYABLE_MANAGE: "accountspayable.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/* ------------------------------------------------------------------ */
/* Role → permission grants                                            */
/* ------------------------------------------------------------------ */

/** Capabilities every authenticated account has, regardless of role. */
const BASE_GRANTS: readonly Permission[] = [
    PERMISSIONS.NOTIFICATION_VIEW,
    PERMISSIONS.ACCESS_REQUEST,
    PERMISSIONS.EMPLOYEE_PROMOTION_VIEW,
    PERMISSIONS.SUPPORT_TICKETS_VIEW,
    PERMISSIONS.SUPPORT_TICKETS_CREATE,
];

/** Self-service capabilities for a regular employee (EMPLOYEE). */
const EMPLOYEE_GRANTS: readonly Permission[] = [
    ...BASE_GRANTS,
    PERMISSIONS.RESIGNATION_CREATE,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.LEAVE_VIEW,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.LOAN_VIEW,
    PERMISSIONS.LOAN_APPLY,
    PERMISSIONS.LETTER_VIEW,
    PERMISSIONS.VISA_VIEW,
    PERMISSIONS.TRAVEL_VIEW,
    PERMISSIONS.TRAVEL_REQUEST,
    PERMISSIONS.REQUEST_VIEW,
    PERMISSIONS.REQUEST_CREATE,
    PERMISSIONS.SERVICE_VIEW,
    PERMISSIONS.SERVICE_CREATE,
    PERMISSIONS.PERFORMANCE_VIEW,
    PERMISSIONS.TRAINING_VIEW,
];

/** Team scope additions for a department manager (DEPARTMENT_MANAGER). */
const DEPARTMENT_MANAGER_GRANTS: readonly Permission[] = [
    ...EMPLOYEE_GRANTS,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.REQUEST_APPROVE,
    PERMISSIONS.SERVICE_APPROVE,
    PERMISSIONS.EMPLOYEES_APPROVE,
    PERMISSIONS.EMPLOYEE_PROMOTION_CREATE,
    PERMISSIONS.ATTENDANCE_EXPORT,
    PERMISSIONS.LETTER_VIEW,
    PERMISSIONS.VISA_VIEW,
    PERMISSIONS.TRAVEL_VIEW_ALL,
    PERMISSIONS.TRAVEL_APPROVE,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.PERFORMANCE_REVIEW,
];

/** HR Manager capabilities (HR_MANAGER). */
const HR_MANAGER_GRANTS: readonly Permission[] = [
    ...DEPARTMENT_MANAGER_GRANTS,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_CREATE,
    PERMISSIONS.EMPLOYEES_EDIT,
    PERMISSIONS.EMPLOYEE_PROMOTION_CREATE,
    PERMISSIONS.EMPLOYEE_PROMOTION_APPROVE,
    PERMISSIONS.EMPLOYEE_PROMOTION_APPLY,
    PERMISSIONS.EMPLOYEES_IMPORT,
    PERMISSIONS.EMPLOYEES_EXPORT,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.ATTENDANCE_IMPORT,
    PERMISSIONS.ATTENDANCE_EXPORT,
    PERMISSIONS.ATTENDANCE_SHIFT_MANAGE,
    PERMISSIONS.ATTENDANCE_MACHINE,
    PERMISSIONS.LEAVE_MANAGE,
    PERMISSIONS.LETTER_GENERATE,
    PERMISSIONS.LETTER_APPROVE,
    PERMISSIONS.LETTER_TEMPLATE_MANAGE,
    PERMISSIONS.VISA_MANAGE,
    PERMISSIONS.TRAVEL_VIEW_ALL,
    PERMISSIONS.TRAVEL_REQUEST_ANY,
    PERMISSIONS.TRAVEL_APPROVE,
    PERMISSIONS.TRAVEL_ENTITLEMENT_MANAGE,
    PERMISSIONS.REQUEST_APPROVE,
    PERMISSIONS.SERVICE_APPROVE,
    PERMISSIONS.RECRUITMENT_VIEW,
    PERMISSIONS.RECRUITMENT_CREATE,
    PERMISSIONS.RECRUITMENT_EDIT,
    PERMISSIONS.RECRUITMENT_APPROVE,
    PERMISSIONS.RECRUITMENT_INTERVIEW,
    PERMISSIONS.RECRUITMENT_OFFER,
    PERMISSIONS.EXIT_CLEARANCE,
    PERMISSIONS.EXIT_SETTLEMENT,
    PERMISSIONS.RESIGNATION_VIEW,
    PERMISSIONS.RESIGNATION_CREATE,
    PERMISSIONS.RESIGNATION_APPROVE,
    PERMISSIONS.TERMINATION_VIEW,
    PERMISSIONS.TERMINATION_CREATE,
    PERMISSIONS.TERMINATION_APPROVE,
    PERMISSIONS.PERFORMANCE_APPROVE,
    PERMISSIONS.TRAINING_MANAGE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.COMPANY_VIEW,
    PERMISSIONS.COMPANY_BRANCHES_VIEW,
    PERMISSIONS.COMPANY_USERS_VIEW,
    PERMISSIONS.COMPANY_SUBSCRIPTION_VIEW,
    PERMISSIONS.COMPANY_MODULES_VIEW,
    PERMISSIONS.COMPANY_USAGE_VIEW,
    PERMISSIONS.COMPANY_ACTIVITY_VIEW,
];

/** Company Administrator capabilities (COMPANY_ADMIN). */
const COMPANY_ADMIN_GRANTS: readonly Permission[] = [
    ...HR_MANAGER_GRANTS,
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.PAYROLL_GENERATE,
    PERMISSIONS.PAYROLL_STRUCTURE_MANAGE,
    PERMISSIONS.PAYROLL_PAYSLIP_VIEW_ALL,
    PERMISSIONS.PAYROLL_EXPORT,
    PERMISSIONS.PAYROLL_OVERTIME_MANAGE,
    PERMISSIONS.LOAN_VIEW,
    PERMISSIONS.LOAN_APPROVE,
    PERMISSIONS.LOAN_MANAGE,
    PERMISSIONS.PAYROLL_LOCK,
    PERMISSIONS.PAYROLL_SETTLE,
    PERMISSIONS.RECRUITMENT_CONVERT,
    PERMISSIONS.EXIT_COMPLETE,
    PERMISSIONS.EXIT_INTERVIEW,
    PERMISSIONS.PERFORMANCE_VIEW,
    PERMISSIONS.PERFORMANCE_REVIEW,
    PERMISSIONS.TRAINING_VIEW,
    PERMISSIONS.NOTIFICATION_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.SERVICE_CONFIG_MANAGE,
    PERMISSIONS.LETTER_TEMPLATE_MANAGE,
    PERMISSIONS.COMPANY_EDIT,
    PERMISSIONS.COMPANY_BRANCHES_MANAGE,
    PERMISSIONS.COMPANY_USERS_INVITE,
    PERMISSIONS.COMPANY_USERS_MANAGE,
    PERMISSIONS.COMPANY_USERS_DISABLE,
    PERMISSIONS.COMPANY_SUBSCRIPTION_MANAGE,
    PERMISSIONS.COMPANY_MODULES_MANAGE,
    PERMISSIONS.COMPANY_SETTINGS_MANAGE,
    PERMISSIONS.SUBSCRIPTION_PLANS_VIEW,
    PERMISSIONS.BILLING_INVOICES_VIEW,
    PERMISSIONS.BILLING_PAYMENTS_VIEW,
    PERMISSIONS.BILLING_RECEIPTS_VIEW,
    PERMISSIONS.MODULES_VIEW,
    PERMISSIONS.COMPANY_MODULES_ASSIGN,
    PERMISSIONS.SUPPORT_TICKETS_MANAGE,
    PERMISSIONS.SUPPORT_TICKETS_ASSIGN,
    PERMISSIONS.SUPPORT_TICKETS_RESOLVE,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.BUDGET_VIEW,
    PERMISSIONS.BUDGET_MANAGE,
    PERMISSIONS.PETTY_CASH_VIEW,
    PERMISSIONS.PETTY_CASH_MANAGE,
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_MANAGE,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ACCOUNTS_PAYABLE_VIEW,
    PERMISSIONS.ACCOUNTS_PAYABLE_MANAGE,
];

/** Platform Finance capabilities (PLATFORM_FINANCE). */
const PLATFORM_FINANCE_GRANTS: readonly Permission[] = [
    ...BASE_GRANTS,
    PERMISSIONS.PLATFORM_BILLING_VIEW,
    PERMISSIONS.PLATFORM_BILLING_MANAGE,
    PERMISSIONS.PLATFORM_PLANS_VIEW,
    PERMISSIONS.BILLING_INVOICES_VIEW,
    PERMISSIONS.BILLING_INVOICES_MANAGE,
    PERMISSIONS.BILLING_PAYMENTS_VIEW,
    PERMISSIONS.BILLING_PAYMENTS_RECORD,
    PERMISSIONS.BILLING_RECEIPTS_VIEW,
    PERMISSIONS.SUBSCRIPTION_PLANS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_ASSIGN,
];

/** Platform Operations capabilities (PLATFORM_OPS). */
const PLATFORM_OPS_GRANTS: readonly Permission[] = [
    ...PLATFORM_FINANCE_GRANTS,
    PERMISSIONS.PLATFORM_TENANTS_VIEW,
    PERMISSIONS.PLATFORM_DASHBOARD_VIEW,
    PERMISSIONS.PLATFORM_TENANTS_CREATE,
    PERMISSIONS.PLATFORM_TENANTS_MANAGE,
    PERMISSIONS.PLATFORM_TENANTS_SUSPEND,
    PERMISSIONS.PLATFORM_MODULES_VIEW,
    PERMISSIONS.PLATFORM_MODULES_MANAGE,
    PERMISSIONS.PLATFORM_INTEGRATIONS_VIEW,
    PERMISSIONS.PLATFORM_INTEGRATIONS_MANAGE,
    PERMISSIONS.PLATFORM_HEALTH_VIEW,
    PERMISSIONS.PLATFORM_TENANT_HEALTH,
    PERMISSIONS.SYSTEM_BACKUP_VIEW,
    PERMISSIONS.SYSTEM_AUDIT_VIEW,
];

/** Platform Support capabilities (PLATFORM_SUPPORT). */
const PLATFORM_SUPPORT_GRANTS: readonly Permission[] = [
    ...PLATFORM_OPS_GRANTS,
    PERMISSIONS.PLATFORM_USERS_VIEW,
    PERMISSIONS.PLATFORM_USERS_MANAGE,
    PERMISSIONS.PLATFORM_ROLES_VIEW,
    PERMISSIONS.PLATFORM_ROLES_MANAGE,
    PERMISSIONS.PLATFORM_TICKETS_VIEW,
    PERMISSIONS.PLATFORM_TICKETS_MANAGE,
    PERMISSIONS.PLATFORM_AUDIT_VIEW,
    PERMISSIONS.PLATFORM_SETTINGS_VIEW,
    PERMISSIONS.PLATFORM_SETTINGS_MANAGE,
    PERMISSIONS.PLATFORM_TENANT_IMPERSONATE,
    PERMISSIONS.SUPPORT_TICKETS_VIEW,
    PERMISSIONS.SUPPORT_TICKETS_CREATE,
    PERMISSIONS.SUPPORT_TICKETS_MANAGE,
    PERMISSIONS.SUPPORT_TICKETS_ASSIGN,
    PERMISSIONS.SUPPORT_TICKETS_RESOLVE,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.BUDGET_VIEW,
    PERMISSIONS.BUDGET_MANAGE,
    PERMISSIONS.PETTY_CASH_VIEW,
    PERMISSIONS.PETTY_CASH_MANAGE,
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_MANAGE,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ACCOUNTS_PAYABLE_VIEW,
    PERMISSIONS.ACCOUNTS_PAYABLE_MANAGE,
];

/** SYSTEM_SEED is deliberately NOT in any static grant — see guards.ts. */
const SUPER_ADMIN_GRANTS: readonly Permission[] = [
    ...PLATFORM_SUPPORT_GRANTS,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_SEED,
    PERMISSIONS.PLATFORM_TENANTS_DELETE,
];

// Legacy role grants (for backward compatibility)
/** @deprecated Use EMPLOYEE_GRANTS */
const STAFF_GRANTS: readonly Permission[] = EMPLOYEE_GRANTS;

/** @deprecated Use DEPARTMENT_MANAGER_GRANTS */
const MANAGER_GRANTS: readonly Permission[] = DEPARTMENT_MANAGER_GRANTS;

/** @deprecated Use HR_MANAGER_GRANTS */
const HR_GRANTS: readonly Permission[] = HR_MANAGER_GRANTS;

/** Legacy Finance role (FINANCE) - has full tenant-level payroll and loan capabilities */
const FINANCE_GRANTS: readonly Permission[] = [
    ...BASE_GRANTS,
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.PAYROLL_GENERATE,
    PERMISSIONS.PAYROLL_STRUCTURE_MANAGE,
    PERMISSIONS.PAYROLL_PAYSLIP_VIEW_ALL,
    PERMISSIONS.PAYROLL_EXPORT,
    PERMISSIONS.PAYROLL_OVERTIME_MANAGE,
    PERMISSIONS.LOAN_VIEW,
    PERMISSIONS.LOAN_APPROVE,
    PERMISSIONS.LOAN_MANAGE,
    PERMISSIONS.PAYROLL_LOCK,
    PERMISSIONS.PAYROLL_SETTLE,
    PERMISSIONS.RECRUITMENT_OFFER,
    PERMISSIONS.EXIT_SETTLEMENT,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.BUDGET_VIEW,
    PERMISSIONS.BUDGET_MANAGE,
    PERMISSIONS.PETTY_CASH_VIEW,
    PERMISSIONS.PETTY_CASH_MANAGE,
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_MANAGE,
    PERMISSIONS.PROCUREMENT_VIEW,
    PERMISSIONS.PROCUREMENT_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ACCOUNTS_PAYABLE_VIEW,
    PERMISSIONS.ACCOUNTS_PAYABLE_MANAGE,
];

/** Legacy Administrator role (ADMIN) - union of HR, FINANCE and system administration */
const ADMIN_GRANTS: readonly Permission[] = [
    ...HR_GRANTS,
    ...FINANCE_GRANTS,
    ...COMPANY_ADMIN_GRANTS,
    PERMISSIONS.EMPLOYEES_DELETE,
    PERMISSIONS.ACCESS_APPROVE,
    PERMISSIONS.SYSTEM_USER_MANAGE,
    PERMISSIONS.SYSTEM_AUDIT_VIEW,
    PERMISSIONS.SYSTEM_BACKUP_VIEW,
    PERMISSIONS.PAYROLL_UNLOCK,
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
    [ROLES.EMPLOYEE]: EMPLOYEE_GRANTS,
    [ROLES.STAFF]: STAFF_GRANTS,
    [ROLES.DEPARTMENT_MANAGER]: DEPARTMENT_MANAGER_GRANTS,
    [ROLES.MANAGER]: MANAGER_GRANTS,
    [ROLES.FINANCE]: FINANCE_GRANTS,
    [ROLES.PLATFORM_FINANCE]: PLATFORM_FINANCE_GRANTS,
    [ROLES.HR]: HR_GRANTS,
    [ROLES.HR_MANAGER]: HR_MANAGER_GRANTS,
    [ROLES.ADMIN]: ADMIN_GRANTS,
    [ROLES.COMPANY_ADMIN]: COMPANY_ADMIN_GRANTS,
    [ROLES.PLATFORM_OPS]: PLATFORM_OPS_GRANTS,
    [ROLES.PLATFORM_SUPPORT]: PLATFORM_SUPPORT_GRANTS,
    [ROLES.SUPER_ADMIN]: SUPER_ADMIN_GRANTS,
};

/* ------------------------------------------------------------------ */
/* Overrides                                                           */
/* ------------------------------------------------------------------ */

export interface PermissionOverrides {
    /** Capabilities explicitly removed for this user. Wins over everything. */
    deny?: readonly string[];
    /** Capabilities explicitly added for this user. Applied after deny. */
    allow?: readonly string[];
}

/* ------------------------------------------------------------------ */
/* Effective permission resolution                                     */
/* ------------------------------------------------------------------ */

export interface EffectivePermissions {
    role: Role;
    /** Final capability set after role grants + overrides. */
    permissions: ReadonlySet<string>;
    /** True when every catalogued permission is granted (SUPER_ADMIN). */
    isSuperAdmin: boolean;
}

export function resolvePermissions(
    roleInput: unknown,
    overrides?: PermissionOverrides | null
): EffectivePermissions {
    const role = toRole(roleInput);
    const resolved = new Set<string>(
        role === ROLES.SUPER_ADMIN
            ? (Object.values(PERMISSIONS) as string[])
            : (ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS[ROLES.EMPLOYEE])
    );

    // ALLOW is applied first so that DENY can always override it below.
    for (const p of overrides?.allow ?? []) {
        if (typeof p === "string" && p.length > 0) resolved.add(p);
    }
    for (const p of overrides?.deny ?? []) {
        if (typeof p === "string") resolved.delete(p);
    }

    return { role, permissions: resolved, isSuperAdmin: role === ROLES.SUPER_ADMIN };
}

export function hasPermission(
    roleInput: unknown,
    permission: Permission | string,
    overrides?: PermissionOverrides | null
): boolean {
    return resolvePermissions(roleInput, overrides).permissions.has(permission);
}

export function hasAnyPermission(
    roleInput: unknown,
    required: readonly (Permission | string)[],
    overrides?: PermissionOverrides | null
): boolean {
    if (required.length === 0) return false;
    const { permissions } = resolvePermissions(roleInput, overrides);
    return required.some((p) => permissions.has(p));
}

export function hasAllPermissions(
    roleInput: unknown,
    required: readonly (Permission | string)[],
    overrides?: PermissionOverrides | null
): boolean {
    if (required.length === 0) return false;
    const { permissions } = resolvePermissions(roleInput, overrides);
    return required.every((p) => permissions.has(p));
}

/** Every permission granted to a role, sorted — used by the settings UI. */
export function listPermissionsForRole(roleInput: unknown): string[] {
    return [...resolvePermissions(roleInput).permissions].sort();
}

export function listAllRoles(): Role[] {
    return Object.keys(ROLE_PERMISSIONS) as Role[];
}