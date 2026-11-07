import prisma from "@/lib/prisma";

export class EntitlementError extends Error {
  code = "MODULE_NOT_ENTITLED";
  moduleKey: string;
  moduleName?: string;

  constructor(moduleKey: string, moduleName?: string) {
    super(`Tenant is not subscribed to the '${moduleName || moduleKey}' module.`);
    this.name = "EntitlementError";
    this.moduleKey = moduleKey;
    this.moduleName = moduleName;
  }
}

export interface EntitlementResult {
  entitled: boolean;
  status: "ACTIVE" | "TRIAL" | "EXPIRED" | "NOT_SUBSCRIBED";
  moduleKey: string;
  moduleName: string;
  expiresAt?: Date | null;
  features: string[];
  reason?: string;
}

// Core modules that are permanently entitled to all companies
const PERMANENT_CORE_MODULES = new Set([
  "core_hr",
  "employee_directory",
  "dashboard",
  "settings",
  "organization",
]);

/**
 * Checks whether a tenant is entitled to use a specific HRMS module.
 */
export async function verifyModuleEntitlement(
  tenantId: string,
  moduleKey: string,
  companyId?: string | null
): Promise<EntitlementResult> {
  const normalizedKey = moduleKey.trim().toLowerCase();

  // 1. Permanent core modules are always entitled
  if (PERMANENT_CORE_MODULES.has(normalizedKey)) {
    return {
      entitled: true,
      status: "ACTIVE",
      moduleKey: normalizedKey,
      moduleName: "Core HR",
      features: ["Employee Directory", "Profile Management", "Org Structure"],
    };
  }

  try {
    // 2. Fetch the Module definition from the catalog
    const moduleDef = await prisma.module.findUnique({
      where: { key: normalizedKey },
      select: {
        id: true,
        key: true,
        name: true,
        isCore: true,
        isActive: true,
        features: true,
      },
    });

    if (moduleDef?.isCore) {
      return {
        entitled: true,
        status: "ACTIVE",
        moduleKey: moduleDef.key,
        moduleName: moduleDef.name,
        features: moduleDef.features,
      };
    }

    const moduleName = moduleDef?.name || moduleKey;
    const features = moduleDef?.features || [];

    // 3. Query CompanyModule entitlement record
    const companyModule = await prisma.companyModule.findFirst({
      where: {
        tenantId,
        ...(companyId ? { companyId } : {}),
        module: { key: normalizedKey },
      },
      include: {
        module: { select: { name: true, features: true } },
      },
    });

    if (companyModule) {
      const now = new Date();
      if (companyModule.status === "ENABLED") {
        return {
          entitled: true,
          status: "ACTIVE",
          moduleKey: normalizedKey,
          moduleName: companyModule.module.name,
          features: companyModule.module.features,
          expiresAt: companyModule.expiresAt,
        };
      }

      if (companyModule.status === "TRIAL") {
        const isExpired = companyModule.expiresAt && companyModule.expiresAt < now;
        if (!isExpired) {
          return {
            entitled: true,
            status: "TRIAL",
            moduleKey: normalizedKey,
            moduleName: companyModule.module.name,
            features: companyModule.module.features,
            expiresAt: companyModule.expiresAt,
          };
        }
        return {
          entitled: false,
          status: "EXPIRED",
          moduleKey: normalizedKey,
          moduleName: companyModule.module.name,
          features: companyModule.module.features,
          reason: "Trial period for this module has expired.",
        };
      }
    }

    // 4. Fallback check on Tenant Subscription Plan entitlements
    const tenantSub = await prisma.tenantSubscription.findFirst({
      where: {
        tenantId,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      include: {
        plan: true,
      },
    });

    if (tenantSub?.plan) {
      const plan = tenantSub.plan;
      let planEntitled = false;

      if (normalizedKey === "payroll" || normalizedKey === "payroll_wps") {
        planEntitled = plan.hasPayroll;
      } else if (normalizedKey === "recruitment" || normalizedKey === "recruitment_ats") {
        planEntitled = plan.hasRecruitment;
      } else if (normalizedKey === "visa" || normalizedKey === "compliance") {
        planEntitled = plan.hasCompliance;
      }

      if (planEntitled) {
        return {
          entitled: true,
          status: tenantSub.status === "TRIALING" ? "TRIAL" : "ACTIVE",
          moduleKey: normalizedKey,
          moduleName,
          features,
        };
      }
    }

    return {
      entitled: false,
      status: "NOT_SUBSCRIBED",
      moduleKey: normalizedKey,
      moduleName,
      features,
      reason: "Module is not included in current company subscription.",
    };
  } catch (error) {
    console.error(`Entitlement check error for [${tenantId}:${moduleKey}]:`, error);
    // Safe fallback: allow access during transient db outage for core items, reject premium add-ons
    return {
      entitled: false,
      status: "NOT_SUBSCRIBED",
      moduleKey: normalizedKey,
      moduleName: moduleKey,
      features: [],
      reason: "Unable to verify subscription status.",
    };
  }
}

/**
 * Enforces module entitlement in Server Actions or API routes, throwing an EntitlementError if unauthorized.
 */
export async function requireModuleEntitlement(
  tenantId: string,
  moduleKey: string,
  companyId?: string | null
): Promise<EntitlementResult> {
  const result = await verifyModuleEntitlement(tenantId, moduleKey, companyId);
  if (!result.entitled) {
    throw new EntitlementError(result.moduleKey, result.moduleName);
  }
  return result;
}

/**
 * Retrieves all active entitled module keys for a given tenant.
 */
export async function getTenantEntitledModules(tenantId: string): Promise<string[]> {
  try {
    const companyModules = await prisma.companyModule.findMany({
      where: {
        tenantId,
        status: { in: ["ENABLED", "TRIAL"] },
      },
      include: {
        module: { select: { key: true } },
      },
    });

    const activeKeys = new Set<string>(PERMANENT_CORE_MODULES);
    const now = new Date();

    for (const cm of companyModules) {
      if (cm.status === "ENABLED") {
        activeKeys.add(cm.module.key);
      } else if (cm.status === "TRIAL" && (!cm.expiresAt || cm.expiresAt > now)) {
        activeKeys.add(cm.module.key);
      }
    }

    return Array.from(activeKeys);
  } catch (e) {
    console.error("Failed to fetch tenant entitled modules:", e);
    return Array.from(PERMANENT_CORE_MODULES);
  }
}

