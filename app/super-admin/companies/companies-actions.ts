"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100),
  slug: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  adminEmail: z.string().email("Valid email required"),
  contactEmail: z.string().email("Valid contact email required").optional(),
  adminName: z.string().min(1, "Admin name required"),
  planTier: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]),
  tradeLicenseNumber: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().default("AED"),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

const updateCompanySchema = companySchema.partial();

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

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { tradeLicenseNumber: { contains: search, mode: "insensitive" } },
      { taxId: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) {
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
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    companies,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
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
      invoices: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { transactions: true },
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

  if (!tenant) throw new Error("Company not found");

  return tenant;
}

export async function createCompanyAction(input: z.infer<typeof companySchema>) {
  await requireSuperAdmin("platform.tenants.create");

  const validated = companySchema.parse(input);

  const sanitizedSlug = input.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

  const existing = await prisma.tenant.findUnique({
    where: { slug: sanitizedSlug },
  });
  if (existing) {
    throw new Error(`Subdomain '${sanitizedSlug}' is already taken.`);
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: input.adminEmail.toLowerCase() },
  });
  if (existingEmail) {
    throw new Error(`User with email '${input.adminEmail}' already exists.`);
  }

  const planLimitsMap = {
    STARTER: { maxEmployees: 50, maxCompanies: 1, maxLocations: 2, hasRecruitment: false, hasCustomTheme: false, hasApiAccess: false },
    GROWTH: { maxEmployees: 250, maxCompanies: 3, maxLocations: 10, hasRecruitment: true, hasCustomTheme: false, hasApiAccess: false },
    ENTERPRISE: { maxEmployees: 1000, maxCompanies: 10, maxLocations: 25, hasRecruitment: true, hasCustomTheme: true, hasApiAccess: true },
  } as const;

  const planLimits = planLimitsMap[input.planTier as keyof typeof planLimitsMap] || planLimitsMap.STARTER;

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { slug: input.planTier.toLowerCase() },
  });

  const tenant = await prisma.$transaction(async (tx) => {
    const newTenant = await tx.tenant.create({
      data: {
        name: validated.name,
        slug: sanitizedSlug,
        legalName: validated.name,
        contactEmail: input.adminEmail,
        status: "ACTIVE",
        currency: validated.currency,
        primaryColor: "#1e40af",
        accentColor: "#0284c7",
        subscription: {
          create: {
            planId: plan?.id,
            planTier: input.planTier,
            maxEmployees: planLimits.maxEmployees,
            maxCompanies: planLimits.maxCompanies,
            maxLocations: planLimits.maxLocations,
            hasPayroll: true,
            hasCompliance: true,
            hasRecruitment: planLimits.hasRecruitment,
            hasCustomTheme: planLimits.hasCustomTheme,
            hasApiAccess: planLimits.hasApiAccess,
          },
        },
        companies: {
          create: {
            name: `${validated.name} Head Office`,
            currency: validated.currency,
            isDefault: true,
          },
        },
      },
      include: { subscription: true, companies: true },
    });

    const passwordHash = await import('bcryptjs').then(m => m.default.hash("TempPass123!", 12));

    const adminUser = await tx.user.create({
      data: {
        name: input.adminName,
        email: input.adminEmail.toLowerCase(),
        password: passwordHash,
        role: "COMPANY_ADMIN",
        employee: {
          create: {
            firstName: input.adminName.split(" ")[0],
            lastName: input.adminName.split(" ").slice(1).join(" ") || "Admin",
            email: input.adminEmail.toLowerCase(),
            employeeCode: `EMP-${Date.now().toString().slice(-6)}`,
            rollNumber: `ROLL-${Date.now().toString().slice(-6)}`,
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

    return newTenant;
  });

  revalidatePath("/super-admin/companies");
  return { success: true, tenantId: tenant.id, slug: tenant.slug };
}

export async function updateCompanyAction(tenantId: string, input: z.infer<typeof updateCompanySchema>) {
  await requireSuperAdmin("platform.tenants.manage");

  const validated = updateCompanySchema.parse(input);

  const updateData: any = { ...validated };
  if (updateData.logoUrl === "") delete updateData.logoUrl;

  await prisma.tenant.update({
    where: { id: tenantId },
    data: updateData,
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