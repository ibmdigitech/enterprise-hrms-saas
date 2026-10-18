import prisma from "@/lib/prisma";

export interface PlanTemplate {
    name: string;
    slug: string;
    description: string;
    priceMonthly: number;
    priceAnnual: number;
    currency: string;
    maxEmployees: number;
    maxCompanies: number;
    maxLocations: number;
    hasPayroll: boolean;
    hasCompliance: boolean;
    hasRecruitment: boolean;
    hasCustomTheme: boolean;
    hasApiAccess: boolean;
    isPopular: boolean;
}

export const DEFAULT_PLANS: PlanTemplate[] = [
    {
        name: "Starter",
        slug: "STARTER",
        description: "Essential HR & compliance for growing teams and startups.",
        priceMonthly: 750,
        priceAnnual: 7200, // 600/mo equivalent
        currency: "AED",
        maxEmployees: 50,
        maxCompanies: 1,
        maxLocations: 2,
        hasPayroll: true,
        hasCompliance: true,
        hasRecruitment: false,
        hasCustomTheme: false,
        hasApiAccess: false,
        isPopular: false,
    },
    {
        name: "Growth",
        slug: "GROWTH",
        description: "Comprehensive HRMS with multi-company operations, recruiting & shifts.",
        priceMonthly: 1850,
        priceAnnual: 17760, // 1480/mo equivalent
        currency: "AED",
        maxEmployees: 250,
        maxCompanies: 3,
        maxLocations: 10,
        hasPayroll: true,
        hasCompliance: true,
        hasRecruitment: true,
        hasCustomTheme: false,
        hasApiAccess: false,
        isPopular: true,
    },
    {
        name: "Enterprise",
        slug: "ENTERPRISE",
        description: "Full conglomerate isolation, dedicated database, unlimited scalability & custom branding.",
        priceMonthly: 3650,
        priceAnnual: 35040, // 2920/mo equivalent
        currency: "AED",
        maxEmployees: 1000,
        maxCompanies: 10,
        maxLocations: 25,
        hasPayroll: true,
        hasCompliance: true,
        hasRecruitment: true,
        hasCustomTheme: true,
        hasApiAccess: true,
        isPopular: false,
    },
];

// ZAR (South African Rand) pricing - approximate conversion from AED (1 AED ≈ 5 ZAR)
export const DEFAULT_PLANS_ZAR: PlanTemplate[] = [
    {
        name: "Starter",
        slug: "STARTER",
        description: "Essential HR & compliance for growing teams and startups.",
        priceMonthly: 3750,
        priceAnnual: 36000,
        currency: "ZAR",
        maxEmployees: 50,
        maxCompanies: 1,
        maxLocations: 2,
        hasPayroll: true,
        hasCompliance: true,
        hasRecruitment: false,
        hasCustomTheme: false,
        hasApiAccess: false,
        isPopular: false,
    },
    {
        name: "Growth",
        slug: "GROWTH",
        description: "Comprehensive HRMS with multi-company operations, recruiting & shifts.",
        priceMonthly: 9250,
        priceAnnual: 88800,
        currency: "ZAR",
        maxEmployees: 250,
        maxCompanies: 3,
        maxLocations: 10,
        hasPayroll: true,
        hasCompliance: true,
        hasRecruitment: true,
        hasCustomTheme: false,
        hasApiAccess: false,
        isPopular: true,
    },
    {
        name: "Enterprise",
        slug: "ENTERPRISE",
        description: "Full conglomerate isolation, dedicated database, unlimited scalability & custom branding.",
        priceMonthly: 18250,
        priceAnnual: 175200,
        currency: "ZAR",
        maxEmployees: 1000,
        maxCompanies: 10,
        maxLocations: 25,
        hasPayroll: true,
        hasCompliance: true,
        hasRecruitment: true,
        hasCustomTheme: true,
        hasApiAccess: true,
        isPopular: false,
    },
];

/**
 * Ensures standard SaaS plans exist in database catalog for both AED and ZAR currencies.
 */
export async function ensureDefaultPlans() {
    // Ensure AED plans
    for (const plan of DEFAULT_PLANS) {
        await prisma.subscriptionPlan.upsert({
            where: { slug: plan.slug },
            update: {
                name: plan.name,
                description: plan.description,
                priceMonthly: plan.priceMonthly,
                priceAnnual: plan.priceAnnual,
                currency: plan.currency,
                maxEmployees: plan.maxEmployees,
                maxCompanies: plan.maxCompanies,
                maxLocations: plan.maxLocations,
                hasPayroll: plan.hasPayroll,
                hasCompliance: plan.hasCompliance,
                hasRecruitment: plan.hasRecruitment,
                hasCustomTheme: plan.hasCustomTheme,
                hasApiAccess: plan.hasApiAccess,
                isPopular: plan.isPopular,
            },
            create: {
                ...plan,
                isActive: true,
            },
        });
    }

    // Ensure ZAR plans (use currency-specific slugs)
    for (const plan of DEFAULT_PLANS_ZAR) {
        const zarSlug = `${plan.slug}_ZAR`;
        await prisma.subscriptionPlan.upsert({
            where: { slug: zarSlug },
            update: {
                name: plan.name,
                description: plan.description,
                priceMonthly: plan.priceMonthly,
                priceAnnual: plan.priceAnnual,
                currency: plan.currency,
                maxEmployees: plan.maxEmployees,
                maxCompanies: plan.maxCompanies,
                maxLocations: plan.maxLocations,
                hasPayroll: plan.hasPayroll,
                hasCompliance: plan.hasCompliance,
                hasRecruitment: plan.hasRecruitment,
                hasCustomTheme: plan.hasCustomTheme,
                hasApiAccess: plan.hasApiAccess,
                isPopular: plan.isPopular,
            },
            create: {
                ...plan,
                slug: zarSlug,
                isActive: true,
            },
        });
    }
}

/**
 * Retrieves all active plans for a specific currency.
 */
export async function getActivePlans(currency: string = "AED") {
    await ensureDefaultPlans();
    return prisma.subscriptionPlan.findMany({
        where: { isActive: true, currency },
        orderBy: { priceMonthly: "asc" },
    });
}
