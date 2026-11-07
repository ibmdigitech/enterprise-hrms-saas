import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";

export interface EntitlementCheckResult {
  entitled: boolean;
  status: "ENABLED" | "TRIAL" | "DISABLED" | "EXPIRED" | "NOT_SUBSCRIBED";
  isCore: boolean;
  reason?: string;
}

/**
 * Checks if a specific tenant is entitled to use a module.
 *
 * Evaluation Order:
 * 1. Is the module a platform Core module? (Core modules are universally available to all active tenants)
 * 2. Does the tenant have an active CompanyModule entry?
 *    - Status ENABLED: Entitled
 *    - Status TRIAL: Checks expiration timestamp against current time
 *    - Status EXPIRED or DISABLED: Not entitled
 * 3. Fallback: Not subscribed
 */
export async function checkTenantModuleEntitlement(
  tenantId: string,
  moduleKey: string
): Promise<EntitlementCheckResult> {
  const normKey = moduleKey.toLowerCase().trim();

  // 1. Fetch Module specification
  const platformModule = await prisma.module.findUnique({
    where: { key: normKey },
    select: { id: true, isCore: true, isActive: true, isPublished: true },
  });

  if (!platformModule || !platformModule.isActive) {
    return {
      entitled: false,
      status: "NOT_SUBSCRIBED",
      isCore: false,
      reason: "Module is inactive or not published.",
    };
  }

  // Core modules (e.g. core-hr, auth) are entitled by default for all tenants
  if (platformModule.isCore) {
    return { entitled: true, status: "ENABLED", isCore: true };
  }

  // 2. Query Tenant-specific CompanyModule entitlement
  const companyModule = await prisma.companyModule.findFirst({
    where: {
      tenantId,
      moduleId: platformModule.id,
    },
  });

  if (!companyModule) {
    return {
      entitled: false,
      status: "NOT_SUBSCRIBED",
      isCore: false,
      reason: "Company has not subscribed to this module.",
    };
  }

  if (companyModule.status === "ENABLED") {
    return { entitled: true, status: "ENABLED", isCore: false };
  }

  if (companyModule.status === "TRIAL") {
    if (companyModule.expiresAt && new Date() > companyModule.expiresAt) {
      return {
        entitled: false,
        status: "EXPIRED",
        isCore: false,
        reason: "Module trial period has expired.",
      };
    }
    return { entitled: true, status: "TRIAL", isCore: false };
  }

  return {
    entitled: false,
    status: companyModule.status as any,
    isCore: false,
    reason: `Module access is ${companyModule.status.toLowerCase()}.`,
  };
}

/**
 * Server-side throwing guard for server actions and API handlers.
 * Guarantees that unentitled tenants cannot execute business operations in unsubscribed modules.
 */
export async function requireModuleEntitlement(moduleKey: string): Promise<void> {
  const user = await requireUser();

  // Super Admins bypass tenant module commercial restrictions
  if (user.role === "SUPER_ADMIN") {
    return;
  }

  if (!user.tenantId) {
    throw new Error("Tenant context missing for module entitlement verification.");
  }

  const result = await checkTenantModuleEntitlement(user.tenantId, moduleKey);
  if (!result.entitled) {
    throw new Error(
      `MODULE_ACCESS_DENIED: Your organization is not entitled to the '${moduleKey}' module. (${result.reason})`
    );
  }
}

