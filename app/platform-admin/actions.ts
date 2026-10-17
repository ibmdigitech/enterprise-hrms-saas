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
