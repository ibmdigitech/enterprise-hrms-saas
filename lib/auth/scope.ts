/**
 * Organisational scope.
 *
 * A permission answers "may this user perform this capability at all?".
 * Scope answers "over which records?" — the second half of every IDOR check.
 *
 * The schema has no organisation/branch table today, so the only reliable
 * boundary is department + reporting line, both of which already exist on
 * `Employee`. This module derives scope from those fields rather than
 * inventing new tables, so no migration is required.
 */

import prisma from "@/lib/prisma";
import { Role, ROLES, toRole, isPlatformRole, isCompanyRole } from "./roles";
import { resolvePermissions } from "./permissions";

export type ScopeKind = "ALL" | "TENANT" | "COMPANY" | "DEPARTMENT" | "SELF";

export interface AuthorizationSubject {
    userId: string;
    email: string;
    role: Role;
    /** Employee record linked to this User, when one exists. */
    employeeId: string | null;
    department: string | null;
    /** Active SaaS Tenant ID */
    tenantId: string | null;
    /** Active Company ID */
    companyId: string | null;
}

export const SCOPE_KIND_BY_ROLE: Record<Role, ScopeKind> = {
    // Platform roles - full access across all tenants
    [ROLES.SUPER_ADMIN]: "ALL",
    [ROLES.PLATFORM_SUPPORT]: "ALL",
    [ROLES.PLATFORM_OPS]: "ALL",
    [ROLES.PLATFORM_FINANCE]: "ALL",
    // Company-scoped roles
    [ROLES.COMPANY_ADMIN]: "TENANT",
    [ROLES.HR_MANAGER]: "COMPANY",
    [ROLES.DEPARTMENT_MANAGER]: "DEPARTMENT",
    [ROLES.EMPLOYEE]: "SELF",
    // Legacy roles (mapped to new roles)
    [ROLES.ADMIN]: "TENANT",
    [ROLES.HR]: "COMPANY",
    [ROLES.FINANCE]: "COMPANY",
    [ROLES.MANAGER]: "DEPARTMENT",
    [ROLES.STAFF]: "SELF",
};

export function scopeKindForRole(roleInput: unknown): ScopeKind {
    return SCOPE_KIND_BY_ROLE[toRole(roleInput)];
}

/**
 * Builds the subject from the authenticated session by loading the User row
 * server-side. The role is re-read from the database rather than trusted from
 * the JWT, so a stale or forged token cannot grant authority.
 */
export async function buildSubject(
    userId: string,
    email: string,
    activeTenantId: string | null = null
): Promise<AuthorizationSubject | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            employee: { select: { id: true, department: true, tenantId: true, companyId: true } },
            memberships: activeTenantId ? {
                where: { tenantId: activeTenantId, status: "ACTIVE" },
                select: { role: true, tenantId: true }
            } : undefined,
        },
    });
    if (!user) return null;

    // If an active tenant is specified and user has a tenant membership, use that tenant's role
    const activeMembership = user.memberships && user.memberships.length > 0 ? user.memberships[0] : null;
    const effectiveRole = activeMembership ? toRole(activeMembership.role) : toRole(user.role);
    const effectiveTenantId = activeMembership ? activeMembership.tenantId : (user.employee?.tenantId ?? activeTenantId);

    return {
        userId: user.id,
        email: user.email,
        role: effectiveRole,
        employeeId: user.employee?.id ?? null,
        department: user.employee?.department ?? null,
        tenantId: effectiveTenantId,
        companyId: user.employee?.companyId ?? null,
    };
}

/**
 * Returns true when `subject` is permitted to act on the record owned by
 * `owner`. This is the reusable IDOR primitive: call it whenever a request
 * carries an entity id.
 *
 * Rules:
 *  - ALL scope       → anything
 *  - TENANT scope    → records within the same tenant
 *  - COMPANY scope   → records within the same company
 *  - DEPARTMENT      → records whose owner shares the subject's department
 *  - SELF            → only the subject's own employee record
 */
export function canActOnEmployeeRecord(
    subject: AuthorizationSubject,
    owner: { employeeId: string | null; department?: string | null; tenantId?: string | null; companyId?: string | null }
): boolean {
    const kind = scopeKindForRole(subject.role);
    if (kind === "ALL") return true;
    if (kind === "SELF") return owner.employeeId !== null && owner.employeeId === subject.employeeId;
    if (kind === "TENANT") return owner.tenantId !== null && owner.tenantId === subject.tenantId;
    if (kind === "COMPANY") return owner.companyId !== null && owner.companyId === subject.companyId;
    // DEPARTMENT
    if (!owner.employeeId) return false;
    if (owner.employeeId === subject.employeeId) return true;
    if (!subject.department) return false;
    return (owner.department ?? null) === subject.department;
}

/**
 * Applies the subject's scope to an employee `where` clause.
 * `ALL` returns the clause unchanged so callers can compose it freely.
 */
export function scopeEmployeeWhere(
    subject: AuthorizationSubject,
    where: Record<string, unknown> = {}
): Record<string, unknown> {
    const kind = scopeKindForRole(subject.role);
    if (kind === "ALL") return where;
    if (kind === "SELF") {
        return { ...where, ...(subject.employeeId ? { id: subject.employeeId } : { id: "__none__" }) };
    }
    if (kind === "TENANT") {
        return { ...where, ...(subject.tenantId ? { tenantId: subject.tenantId } : { tenantId: "__none__" }) };
    }
    if (kind === "COMPANY") {
        return { ...where, ...(subject.companyId ? { companyId: subject.companyId } : { companyId: "__none__" }) };
    }
    if (!subject.department) {
        // A manager with no department can only see their own record.
        return { ...where, ...(subject.employeeId ? { id: subject.employeeId } : { id: "__none__" }) };
    }
    return { ...where, department: subject.department };
}

/**
 * Applies the subject's scope to a generic tenant-scoped model `where` clause.
 */
export function scopeTenantWhere(
    subject: AuthorizationSubject,
    where: Record<string, unknown> = {}
): Record<string, unknown> {
    const kind = scopeKindForRole(subject.role);
    if (kind === "ALL") return where;
    if (kind === "TENANT" || kind === "COMPANY" || kind === "DEPARTMENT" || kind === "SELF") {
        return { ...where, ...(subject.tenantId ? { tenantId: subject.tenantId } : { tenantId: "__none__" }) };
    }
    return where;
}

/**
 * Applies the subject's scope to a generic company-scoped model `where` clause.
 */
export function scopeCompanyWhere(
    subject: AuthorizationSubject,
    where: Record<string, unknown> = {}
): Record<string, unknown> {
    const kind = scopeKindForRole(subject.role);
    if (kind === "ALL") return where;
    if (kind === "TENANT" || kind === "COMPANY") {
        return { ...where, ...(subject.companyId ? { companyId: subject.companyId } : { companyId: "__none__" }) };
    }
    // DEPARTMENT and SELF should not access company-scoped models directly
    return { ...where, companyId: "__none__" };
}

/**
 * A manager may never approve or act on their own request even though
 * SELF-or-DEPARTMENT scope would technically allow it.
 */
export function isSelfAction(subject: AuthorizationSubject, ownerEmployeeId: string | null): boolean {
    return ownerEmployeeId !== null && subject.employeeId !== null && ownerEmployeeId === subject.employeeId;
}

/** True when the subject can read records outside their own scope. */
export function hasBroadScope(subject: AuthorizationSubject): boolean {
    const { permissions } = resolvePermissions(subject.role);
    return (
        scopeKindForRole(subject.role) === "ALL" ||
        scopeKindForRole(subject.role) === "TENANT" ||
        permissions.has("employees.view") ||
        permissions.has("payroll.payslip.view.all")
    );
}

/**
 * Check if subject can access a specific tenant.
 */
export function canAccessTenant(subject: AuthorizationSubject, tenantId: string): boolean {
    const kind = scopeKindForRole(subject.role);
    if (kind === "ALL") return true;
    return subject.tenantId === tenantId;
}

/**
 * Check if subject can access a specific company.
 */
export function canAccessCompany(subject: AuthorizationSubject, companyId: string): boolean {
    const kind = scopeKindForRole(subject.role);
    if (kind === "ALL") return true;
    if (kind === "TENANT") return subject.tenantId !== null; // Tenant admin can access all companies in tenant
    return subject.companyId === companyId;
}

/**
 * Get the list of tenant IDs the subject can access.
 */
export async function getAccessibleTenantIds(subject: AuthorizationSubject): Promise<string[]> {
    const kind = scopeKindForRole(subject.role);
    if (kind === "ALL") {
        const tenants = await prisma.tenant.findMany({
            where: { status: "ACTIVE" },
            select: { id: true },
        });
        return tenants.map(t => t.id);
    }
    if (subject.tenantId) {
        return [subject.tenantId];
    }
    return [];
}

/**
 * Get the list of company IDs the subject can access.
 */
export async function getAccessibleCompanyIds(subject: AuthorizationSubject): Promise<string[]> {
    const kind = scopeKindForRole(subject.role);
    if (kind === "ALL") {
        const companies = await prisma.company.findMany({
            select: { id: true },
        });
        return companies.map(c => c.id);
    }
    if (kind === "TENANT" && subject.tenantId) {
        const companies = await prisma.company.findMany({
            where: { tenantId: subject.tenantId },
            select: { id: true },
        });
        return companies.map(c => c.id);
    }
    if (subject.companyId) {
        return [subject.companyId];
    }
    return [];
}

export { toRole, isPlatformRole, isCompanyRole };