"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100),
  slug: z
    .string()
    .min(1, "Subdomain is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  adminEmail: z.string().email("Valid email required"),
  contactEmail: z.string().email("Valid contact email required").optional().or(z.literal("")),
  adminName: z.string().min(1, "Admin name required"),
  planTier: z.string().min(1).default("STARTER"),
  tradeLicenseNumber: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().default("AED"),
  logoUrl: z.string().url().optional().or(z.literal("")),
  moduleIds: z.array(z.string()).optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  contactEmail: z.string().email("Valid contact email required").optional().or(z.literal("")),
  currency: z.string().optional(),
  tradeLicenseNumber: z.string().optional(),
  taxId: z.string().optional(),
  timezone: z.string().optional(),
});

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "updatedAt", "name", "slug", "status"]);

export interface CompanyListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CompanyListResult {
  companies: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getCompaniesAction(params: CompanyListParams = {}): Promise<CompanyListResult> {
  await requireSuperAdmin("platform.tenants.view");

  const {
    page = 1,
    limit = 20,
    search = "",
    status = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const safeSortBy = ALLOWED_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
  const safeSortOrder = sortOrder === "asc" ? "asc" : "desc";

  const where: any = {};

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { contactEmail: { contains: q, mode: "insensitive" } },
      {
        companies: {
          some: {
            OR: [
              { tradeLicenseNumber: { contains: q, mode: "insensitive" } },
              { taxId: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  const [companies, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        subscription: {
          include: { plan: true },
        },
        _count: {
          select: {
            companies: true,
            employees: true,
            locations: true,
            memberships: true,
          },
        },
      },
      orderBy: { [safeSortBy]: safeSortOrder },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    companies,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function getCompanyAction(tenantId: string) {
  await requireSuperAdmin("platform.tenants.view");

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscription: {
        include: { plan: true },
      },
      companies: {
        include: {
          locations: true,
          departments: true,
          _count: { select: { employees: true } },
        },
      },
      memberships: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true, image: true } },
        },
        where: { status: "ACTIVE" },
      },
      companyModules: {
        include: { module: true },
      },
      invoices: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { transactions: true },
      },
      supportTickets: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          employees: true,
          locations: true,
          departments: true,
          memberships: true,
        },
      },
    },
  });

  if (!tenant) return null;

  return tenant;
}

export async function createCompanyAction(input: z.infer<typeof companySchema>) {
  await requireSuperAdmin("platform.tenants.create");

  const validated = companySchema.parse(input);
  const sanitizedSlug = validated.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
  if (!sanitizedSlug) {
    throw new Error("Subdomain must contain lowercase letters, numbers, or hyphens.");
  }

  const existing = await prisma.tenant.findUnique({
    where: { slug: sanitizedSlug },
  });
  if (existing) {
    throw new Error(`Subdomain '${sanitizedSlug}' is already taken.`);
  }

  const normalizedAdminEmail = validated.adminEmail.toLowerCase().trim();
  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedAdminEmail },
  });
  if (existingEmail) {
    throw new Error(`User with email '${validated.adminEmail}' already exists.`);
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { id: validated.planTier },
        { slug: { equals: validated.planTier, mode: "insensitive" } },
        { name: { equals: validated.planTier, mode: "insensitive" } },
      ],
    },
  });

  const normalizedTier = (plan?.slug || validated.planTier || "STARTER").toUpperCase();

  const planLimitsMap: Record<
    string,
    {
      maxEmployees: number;
      maxCompanies: number;
      maxLocations: number;
      hasRecruitment: boolean;
      hasCustomTheme: boolean;
      hasApiAccess: boolean;
    }
  > = {
    STARTER: { maxEmployees: 50, maxCompanies: 1, maxLocations: 2, hasRecruitment: false, hasCustomTheme: false, hasApiAccess: false },
    GROWTH: { maxEmployees: 250, maxCompanies: 3, maxLocations: 10, hasRecruitment: true, hasCustomTheme: false, hasApiAccess: false },
    PROFESSIONAL: { maxEmployees: 250, maxCompanies: 3, maxLocations: 10, hasRecruitment: true, hasCustomTheme: true, hasApiAccess: true },
    ENTERPRISE: { maxEmployees: 1000, maxCompanies: 10, maxLocations: 25, hasRecruitment: true, hasCustomTheme: true, hasApiAccess: true },
  };

  const fallbackLimits = planLimitsMap[normalizedTier] || planLimitsMap.STARTER;
  const maxEmployees = plan?.maxEmployees ?? fallbackLimits.maxEmployees;
  const maxCompanies = plan?.maxCompanies ?? fallbackLimits.maxCompanies;
  const maxLocations = plan?.maxLocations ?? fallbackLimits.maxLocations;
  const hasPayroll = plan?.hasPayroll ?? true;
  const hasCompliance = plan?.hasCompliance ?? true;
  const hasRecruitment = plan?.hasRecruitment ?? fallbackLimits.hasRecruitment;
  const hasCustomTheme = plan?.hasCustomTheme ?? fallbackLimits.hasCustomTheme;
  const hasApiAccess = plan?.hasApiAccess ?? fallbackLimits.hasApiAccess;

  const tenant = await prisma.$transaction(async (tx) => {
    const newTenant = await tx.tenant.create({
      data: {
        name: validated.name.trim(),
        slug: sanitizedSlug,
        legalName: validated.name.trim(),
        contactEmail: validated.contactEmail || normalizedAdminEmail,
        status: "ACTIVE",
        currency: validated.currency || "AED",
        logoUrl: validated.logoUrl || null,
        primaryColor: "#1e40af",
        accentColor: "#0284c7",
        subscription: {
          create: {
            planId: plan?.id,
            planTier: normalizedTier,
            maxEmployees,
            maxCompanies,
            maxLocations,
            hasPayroll,
            hasCompliance,
            hasRecruitment,
            hasCustomTheme,
            hasApiAccess,
          },
        },
        companies: {
          create: {
            name: `${validated.name.trim()} Head Office`,
            tradeLicenseNumber: validated.tradeLicenseNumber || null,
            taxId: validated.taxId || null,
            currency: validated.currency || "AED",
            isDefault: true,
          },
        },
      },
      include: { subscription: true, companies: true },
    });

    const passwordHash = await import("bcryptjs").then((m) => m.default.hash("TempPass123!", 12));
    const nameParts = validated.adminName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Company";
    const lastName = nameParts.slice(1).join(" ") || "Admin";
    const uniqueSuffix = Date.now().toString().slice(-6);

    const adminUser = await tx.user.create({
      data: {
        name: validated.adminName.trim(),
        email: normalizedAdminEmail,
        password: passwordHash,
        role: "COMPANY_ADMIN",
        securityFlag: {
          create: {
            mustChangePassword: true,
            mustChangeReason: "First login forced password change",
          },
        },
        employee: {
          create: {
            firstName,
            lastName,
            email: normalizedAdminEmail,
            employeeCode: `EMP-${uniqueSuffix}`,
            rollNumber: `ROLL-${uniqueSuffix}`,
            tenantId: newTenant.id,
            companyId: newTenant.companies[0]?.id,
            currentStatus: "ACTIVE",
            isActive: true,
          },
        },
      },
    });

    await tx.tenantMembership.create({
      data: {
        tenantId: newTenant.id,
        userId: adminUser.id,
        role: "COMPANY_ADMIN",
        status: "ACTIVE",
      },
    });

    if (validated.moduleIds && validated.moduleIds.length > 0) {
      await tx.companyModule.createMany({
        data: validated.moduleIds.map((moduleId) => ({
          tenantId: newTenant.id,
          moduleId,
          isEnabled: true,
        })),
        skipDuplicates: true,
      });
    }

    return newTenant;
  });

  revalidatePath("/super-admin/companies");
  return { success: true, tenantId: tenant.id, slug: tenant.slug };
}

export async function updateCompanyAction(tenantId: string, input: z.infer<typeof updateCompanySchema>) {
  await requireSuperAdmin("platform.tenants.manage");

  const validated = updateCompanySchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const tenantUpdate: Record<string, any> = {};
    if (validated.name !== undefined) tenantUpdate.name = validated.name.trim();
    if (validated.contactEmail !== undefined) {
      tenantUpdate.contactEmail = validated.contactEmail || null;
    }
    if (validated.currency !== undefined) tenantUpdate.currency = validated.currency;
    if (validated.timezone !== undefined) tenantUpdate.timezone = validated.timezone;

    if (Object.keys(tenantUpdate).length > 0) {
      await tx.tenant.update({
        where: { id: tenantId },
        data: tenantUpdate,
      });
    }

    if (validated.tradeLicenseNumber !== undefined || validated.taxId !== undefined) {
      await tx.company.updateMany({
        where: { tenantId, isDefault: true },
        data: {
          ...(validated.tradeLicenseNumber !== undefined && {
            tradeLicenseNumber: validated.tradeLicenseNumber || null,
          }),
          ...(validated.taxId !== undefined && {
            taxId: validated.taxId || null,
          }),
        },
      });
    }
  });

  revalidatePath("/super-admin/companies");
  revalidatePath(`/super-admin/companies/${tenantId}`);
  return { success: true };
}

export async function suspendCompanyAction(tenantId: string) {
  await requireSuperAdmin("platform.tenants.suspend");

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "SUSPENDED" },
  });

  revalidatePath("/super-admin/companies");
  revalidatePath(`/super-admin/companies/${tenantId}`);
  return { success: true };
}

export async function reactivateCompanyAction(tenantId: string) {
  await requireSuperAdmin("platform.tenants.manage");

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/super-admin/companies");
  revalidatePath(`/super-admin/companies/${tenantId}`);
  return { success: true };
}

export async function archiveCompanyAction(tenantId: string) {
  await requireSuperAdmin("platform.tenants.delete");

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: "ARCHIVED" },
  });

  revalidatePath("/super-admin/companies");
  revalidatePath(`/super-admin/companies/${tenantId}`);
  return { success: true };
}

export async function deleteCompanyAction(tenantId: string) {
  await requireSuperAdmin("platform.tenants.delete");

  await prisma.tenant.delete({
    where: { id: tenantId },
  });

  revalidatePath("/super-admin/companies");
  return { success: true };
}

export async function getCompanyStatsAction() {
  await requireSuperAdmin("platform.tenants.view");

  const [byStatus, byPlan, totals] = await Promise.all([
    prisma.tenant.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.tenantSubscription.groupBy({
      by: ["planTier"],
      _count: true,
    }),
    prisma.tenant.aggregate({
      _count: true,
    }),
  ]);

  return { byStatus, byPlan, totals };
}
