/**
 * Role vocabulary — the single source of truth.
 *
 * IMPORTANT: these values are the roles that actually exist in this
 * codebase (verified by scanning every `role` comparison in app/, components/
 * and scripts/). `User.role` is a plain `String` column in Prisma, so nothing
 * at the database level prevents an arbitrary string from being written.
 * `assertKnownRole()` is the guard that closes that gap.
 */

export const ROLES = {
    SUPER_ADMIN: "SUPER_ADMIN",
    // Platform roles
    PLATFORM_SUPPORT: "PLATFORM_SUPPORT",
    PLATFORM_OPS: "PLATFORM_OPS",
    PLATFORM_FINANCE: "PLATFORM_FINANCE",
    // Company-scoped roles
    COMPANY_ADMIN: "COMPANY_ADMIN",
    HR_MANAGER: "HR_MANAGER",
    DEPARTMENT_MANAGER: "DEPARTMENT_MANAGER",
    EMPLOYEE: "EMPLOYEE",
    // Legacy roles (kept for backward compatibility)
    ADMIN: "ADMIN",
    HR: "HR",
    FINANCE: "FINANCE",
    MANAGER: "MANAGER",
    STAFF: "STAFF",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Roles that are active in this application today.
 * SUPER_ADMIN is reserved and not granted by the seed or by any UI action.
 */
export const KNOWN_ROLES: readonly Role[] = [
    ROLES.SUPER_ADMIN,
    ROLES.PLATFORM_SUPPORT,
    ROLES.PLATFORM_OPS,
    ROLES.PLATFORM_FINANCE,
    ROLES.COMPANY_ADMIN,
    ROLES.HR_MANAGER,
    ROLES.DEPARTMENT_MANAGER,
    ROLES.EMPLOYEE,
    ROLES.ADMIN,
    ROLES.HR,
    ROLES.FINANCE,
    ROLES.MANAGER,
    ROLES.STAFF,
];

/**
 * Roles that may never be removed or demoted while they are the last holder.
 * Prevents an organisation from locking itself out of administration.
 */
export const PROTECTED_ROLES: readonly Role[] = [ROLES.SUPER_ADMIN];

/**
 * Higher number = broader authority. Used for hierarchy comparisons only;
 * every actual authorization decision goes through an explicit permission
 * check so that a broad role never silently implies an unrelated capability.
 */
const ROLE_RANK: Record<Role, number> = {
    [ROLES.EMPLOYEE]: 10,
    [ROLES.STAFF]: 10,
    [ROLES.DEPARTMENT_MANAGER]: 20,
    [ROLES.MANAGER]: 20,
    [ROLES.FINANCE]: 30,
    [ROLES.PLATFORM_FINANCE]: 30,
    [ROLES.HR]: 40,
    [ROLES.HR_MANAGER]: 40,
    [ROLES.ADMIN]: 50,
    [ROLES.COMPANY_ADMIN]: 50,
    [ROLES.PLATFORM_OPS]: 55,
    [ROLES.PLATFORM_SUPPORT]: 55,
    [ROLES.SUPER_ADMIN]: 60,
};

export function isRole(value: unknown): value is Role {
    return typeof value === "string" && (KNOWN_ROLES as readonly string[]).includes(value);
}

/**
 * Normalise an arbitrary string into a known Role.
 * Unknown or missing values collapse to EMPLOYEE — the least-privileged role —
 * so a corrupted or injected role value can never escalate privilege.
 */
export function toRole(value: unknown): Role {
    if (typeof value !== "string") return ROLES.STAFF;
    const normalised = value.trim().toUpperCase();
    if (isRole(normalised)) return normalised;
    return ROLES.STAFF;
}

export function hasAtLeastRole(actual: unknown, required: Role): boolean {
    const a = toRole(actual);
    return ROLE_RANK[a] >= ROLE_RANK[required];
}

export function roleRank(role: unknown): number {
    return ROLE_RANK[toRole(role)];
}

export function isSuperAdmin(role: unknown): boolean {
    return toRole(role) === ROLES.SUPER_ADMIN;
}

/**
 * Returns the Role when it is recognised, otherwise null.
 * Callers that need to distinguish "bad input" from "low privilege" use this
 * instead of `toRole()`.
 */
export function assertKnownRole(value: unknown): Role | null {
    if (typeof value !== "string") return null;
    const normalised = value.trim().toUpperCase();
    return isRole(normalised) ? normalised : null;
}

/**
 * Check if a role is a platform-level role (not company-scoped).
 */
export function isPlatformRole(role: unknown): boolean {
    const r = toRole(role);
    return r === ROLES.SUPER_ADMIN ||
           r === ROLES.PLATFORM_SUPPORT ||
           r === ROLES.PLATFORM_OPS ||
           r === ROLES.PLATFORM_FINANCE;
}

/**
 * Check if a role is a company-scoped role.
 */
export function isCompanyRole(role: unknown): boolean {
    const r = toRole(role);
    return r === ROLES.COMPANY_ADMIN ||
           r === ROLES.HR_MANAGER ||
           r === ROLES.DEPARTMENT_MANAGER ||
           r === ROLES.EMPLOYEE ||
           r === ROLES.ADMIN ||
           r === ROLES.HR ||
           r === ROLES.FINANCE ||
           r === ROLES.MANAGER ||
           r === ROLES.STAFF;
}