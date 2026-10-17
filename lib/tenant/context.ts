/**
 * Server-side Tenant Context & Resolution utilities.
 */

import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export interface ResolvedTenantContext {
    tenantId: string;
    slug: string;
    name: string;
    currency: string;
    timezone: string;
    primaryColor: string;
    accentColor: string;
    logoUrl: string | null;
    databaseUrl?: string | null;
}

/**
 * Extracts the verified tenant ID injected by proxy.ts / edge middleware.
 */
export async function getActiveTenantId(): Promise<string | null> {
    const headersList = await headers();
    return headersList.get("x-resolved-tenant-id") || null;
}

/**
 * Fetches the active tenant context with branding and settings.
 */
export async function getActiveTenant(): Promise<ResolvedTenantContext | null> {
    const tenantId = await getActiveTenantId();
    if (!tenantId) return null;

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            id: true,
            slug: true,
            name: true,
            currency: true,
            timezone: true,
            primaryColor: true,
            accentColor: true,
            logoUrl: true,
            status: true,
            databaseUrl: true,
        },
    });

    if (!tenant || tenant.status === "SUSPENDED" || tenant.status === "CANCELLED") {
        return null;
    }

    return {
        tenantId: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        currency: tenant.currency || "AED",
        timezone: tenant.timezone || "Asia/Dubai",
        primaryColor: tenant.primaryColor || "#1e40af",
        accentColor: tenant.accentColor || "#0284c7",
        logoUrl: tenant.logoUrl,
        databaseUrl: tenant.databaseUrl,
    };
}
