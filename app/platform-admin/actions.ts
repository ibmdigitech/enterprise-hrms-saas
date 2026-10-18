"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { provisionTenantDatabase } from "@/lib/tenant/provision-database";
import { revalidatePath } from "next/cache";

export interface CreateTenantInput {
    name: string;
    slug: string;
    legalName?: string;
    contactEmail: string;
    planTier: "STARTER" | "GROWTH" | "ENTERPRISE";
    useSeparateDatabase: boolean;
}

export async function createTenantAction(input: CreateTenantInput) {
    // Assert user is platform SUPER_ADMIN
    await requireSuperAdmin("tenant.create");

    const sanitizedSlug = input.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({
        where: { slug: sanitizedSlug },
    });
    if (existing) {
        throw new Error(`Subdomain '${sanitizedSlug}' is already taken.`);
    }

    // Define plan limits based on tier
    const planLimits = {
        STARTER: { maxEmployees: 50, maxCompanies: 1, maxLocations: 2 },
        GROWTH: { maxEmployees: 250, maxCompanies: 3, maxLocations: 10 },
        ENTERPRISE: { maxEmployees: 1000, maxCompanies: 10, maxLocations: 25 },
    }[input.planTier];

    // 1. Create tenant record in central catalog
    const tenant = await prisma.tenant.create({
        data: {
            name: input.name,
            slug: sanitizedSlug,
            legalName: input.legalName || input.name,
            contactEmail: input.contactEmail,
            status: "ACTIVE",
            subscription: {
                create: {
                    planTier: input.planTier,
                    maxEmployees: planLimits.maxEmployees,
                    maxCompanies: planLimits.maxCompanies,
                    maxLocations: planLimits.maxLocations,
                    hasPayroll: true,
                    hasCompliance: true,
                    hasRecruitment: input.planTier !== "STARTER",
                    hasCustomTheme: input.planTier === "ENTERPRISE",
                    hasApiAccess: input.planTier === "ENTERPRISE",
                },
            },
            companies: {
                create: {
                    name: `${input.name} Head Office LLC`,
                    currency: "AED",
                    isDefault: true,
                },
            },
        },
        include: {
            subscription: true,
            companies: true,
        },
    });

    // 2. If separate database is requested, provision dedicated database
    if (input.useSeparateDatabase) {
        try {
            await provisionTenantDatabase({
                tenantId: tenant.id,
                slug: sanitizedSlug,
            });
        } catch (err: any) {
            console.error(`[TENANT_DB_PROVISION_ERROR] ${err.message}`);
            // Non-fatal: catalog record exists, fallback to shared pool until DB is connected
        }
    }

    revalidatePath("/platform-admin");
    return { success: true, tenantId: tenant.id, slug: tenant.slug };
}

export async function toggleTenantStatusAction(tenantId: string, status: "ACTIVE" | "SUSPENDED") {
    await requireSuperAdmin("tenant.toggle_status");

    await prisma.tenant.update({
        where: { id: tenantId },
        data: { status },
    });

    revalidatePath("/platform-admin");
    return { success: true };
}

export async function getTenantDetailsAction(tenantId: string) {
    await requireSuperAdmin("tenant.view");

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
            subscription: {
                include: { plan: true },
            },
            companies: {
                include: {
                    locations: true,
                    _count: { select: { employees: true, departments: true } },
                },
            },
            memberships: {
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                },
            },
            invoices: {
                take: 10,
                orderBy: { createdAt: "desc" },
            },
            _count: {
                select: {
                    employees: true,
                    locations: true,
                    departments: true,
                },
            },
        },
    });

    if (!tenant) throw new Error("Tenant not found.");
    return tenant;
}

export async function updateTenantProfileAction(input: {
    tenantId: string;
    name: string;
    legalName?: string;
    customDomain?: string;
    contactEmail?: string;
    contactPhone?: string;
    primaryColor?: string;
    accentColor?: string;
}) {
    await requireSuperAdmin("tenant.update");

    await prisma.tenant.update({
        where: { id: input.tenantId },
        data: {
            name: input.name.trim(),
            legalName: input.legalName?.trim() || null,
            customDomain: input.customDomain?.trim() || null,
            contactEmail: input.contactEmail?.trim() || null,
            contactPhone: input.contactPhone?.trim() || null,
            primaryColor: input.primaryColor || "#1e40af",
            accentColor: input.accentColor || "#0284c7",
        },
    });

    revalidatePath("/platform-admin");
    return { success: true };
}

export async function updateTenantQuotasAction(input: {
    tenantId: string;
    planTier?: string;
    maxEmployees: number;
    maxCompanies: number;
    maxLocations: number;
    hasPayroll: boolean;
    hasCompliance: boolean;
    hasRecruitment: boolean;
    hasCustomTheme: boolean;
    hasApiAccess: boolean;
}) {
    await requireSuperAdmin("tenant.quotas.update");

    await prisma.tenantSubscription.upsert({
        where: { tenantId: input.tenantId },
        update: {
            planTier: input.planTier || undefined,
            maxEmployees: input.maxEmployees,
            maxCompanies: input.maxCompanies,
            maxLocations: input.maxLocations,
            hasPayroll: input.hasPayroll,
            hasCompliance: input.hasCompliance,
            hasRecruitment: input.hasRecruitment,
            hasCustomTheme: input.hasCustomTheme,
            hasApiAccess: input.hasApiAccess,
        },
        create: {
            tenantId: input.tenantId,
            planTier: input.planTier || "TRIAL",
            maxEmployees: input.maxEmployees,
            maxCompanies: input.maxCompanies,
            maxLocations: input.maxLocations,
            hasPayroll: input.hasPayroll,
            hasCompliance: input.hasCompliance,
            hasRecruitment: input.hasRecruitment,
            hasCustomTheme: input.hasCustomTheme,
            hasApiAccess: input.hasApiAccess,
        },
    });

    revalidatePath("/platform-admin");
    return { success: true };
}

export async function updateTenantDatabaseIsolationAction(input: {
    tenantId: string;
    databaseUrl: string | null;
}) {
    await requireSuperAdmin("tenant.database.update");

    await prisma.tenant.update({
        where: { id: input.tenantId },
        data: {
            databaseUrl: input.databaseUrl?.trim() || null,
        },
    });

    revalidatePath("/platform-admin");
    return { success: true };
}

