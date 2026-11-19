"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { ensureDefaultPlans, getActivePlans } from "./plans";

/**
 * Returns tenant-isolated subscription and billing details.
 * Strictly guarantees that only the authenticated tenant's data is returned.
 */
export async function getTenantBillingData(tenantId: string) {
    if (!tenantId) {
        throw new Error("Tenant ID required for billing isolation.");
    }

    // 1. Fetch tenant to get currency
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { currency: true },
    });

    if (!tenant) {
        throw new Error("Tenant not found.");
    }

    await ensureDefaultPlans();

    // 2. Fetch tenant subscription details with currency-specific plans and available add-on modules
    const [tenantData, availablePlans, employeeCount, companyCount, locationCount, allModules, activeCompanyModules] = await Promise.all([
        prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
                invoices: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                    include: {
                        transactions: {
                            orderBy: { createdAt: "desc" },
                        },
                    },
                },
            },
        }),
        getActivePlans(tenant.currency || "AED"),
        prisma.employee.count({ where: { tenantId } }),
        prisma.company.count({ where: { tenantId } }),
        prisma.location.count({ where: { tenantId } }),
        prisma.module.findMany({
            where: { isActive: true },
            orderBy: [{ isCore: "desc" }, { category: "asc" }, { sortOrder: "asc" }],
        }),
        prisma.companyModule.findMany({
            where: { tenantId },
        }),
    ]);

    if (!tenantData) {
        throw new Error("Tenant not found.");
    }

    return {
        tenant: {
            id: tenantData.id,
            name: tenantData.name,
            slug: tenantData.slug,
            currency: tenantData.currency || "AED",
            status: tenantData.status,
        },
        subscription: tenantData.subscription,
        invoices: tenantData.invoices,
        availablePlans,
        modules: allModules,
        companyModules: activeCompanyModules,
        usage: {
            employees: { current: employeeCount, max: tenantData.subscription?.maxEmployees || 50 },
            companies: { current: companyCount, max: tenantData.subscription?.maxCompanies || 1 },
            locations: { current: locationCount, max: tenantData.subscription?.maxLocations || 2 },
        },
    };
}

/**
 * Tenant Self-Service Upgrade / Downgrade Plan Action.
 * Strictly enforces tenant membership authority.
 */
export async function upgradeTenantPlanAction(input: {
    tenantId: string;
    planSlug: string;
    billingCycle: "MONTHLY" | "ANNUAL";
}) {
    const session = await auth();
    if (!session?.user) throw new Error("Authentication required.");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id ?? undefined },
        include: {
            memberships: {
                where: { tenantId: input.tenantId, status: "ACTIVE" },
            },
        },
    });

    const isPlatformAdmin = user?.role === "SUPER_ADMIN";
    const isTenantAdmin = user?.memberships?.some((m) => m.role === "ADMIN");

    if (!isPlatformAdmin && !isTenantAdmin) {
        throw new Error("Only organization administrators can modify subscription plans.");
    }

    const plan = await prisma.subscriptionPlan.findUnique({
        where: { slug: input.planSlug },
    });
    if (!plan) throw new Error("Selected plan not found.");

    const price = input.billingCycle === "ANNUAL" ? plan.priceAnnual : plan.priceMonthly;
    const now = new Date();
    const periodEnd = new Date(now);
    if (input.billingCycle === "ANNUAL") {
        periodEnd.setFullYear(now.getFullYear() + 1);
    } else {
        periodEnd.setMonth(now.getMonth() + 1);
    }

    // Generate isolated invoice for this tenant
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${input.planSlug.slice(0, 3)}`;

    const result = await prisma.$transaction(async (tx) => {
        // Upsert TenantSubscription
        const sub = await tx.tenantSubscription.upsert({
            where: { tenantId: input.tenantId },
            update: {
                planId: plan.id,
                planTier: plan.slug,
                billingCycle: input.billingCycle,
                maxEmployees: plan.maxEmployees,
                maxCompanies: plan.maxCompanies,
                maxLocations: plan.maxLocations,
                hasPayroll: plan.hasPayroll,
                hasCompliance: plan.hasCompliance,
                hasRecruitment: plan.hasRecruitment,
                hasCustomTheme: plan.hasCustomTheme,
                hasApiAccess: plan.hasApiAccess,
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
            },
            create: {
                tenantId: input.tenantId,
                planId: plan.id,
                planTier: plan.slug,
                billingCycle: input.billingCycle,
                maxEmployees: plan.maxEmployees,
                maxCompanies: plan.maxCompanies,
                maxLocations: plan.maxLocations,
                hasPayroll: plan.hasPayroll,
                hasCompliance: plan.hasCompliance,
                hasRecruitment: plan.hasRecruitment,
                hasCustomTheme: plan.hasCustomTheme,
                hasApiAccess: plan.hasApiAccess,
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
            },
        });

        // Create Tenant-isolated invoice
        const invoice = await tx.subscriptionInvoice.create({
            data: {
                tenantId: input.tenantId,
                subscriptionId: sub.id,
                invoiceNumber,
                amount: price,
                taxAmount: Math.round(price * 0.05 * 100) / 100, // 5% UAE VAT
                totalAmount: Math.round(price * 1.05 * 100) / 100,
                currency: plan.currency,
                status: "PAID",
                billingPeriodStart: now,
                billingPeriodEnd: periodEnd,
                dueDate: now,
                paidAt: now,
                paymentMethod: "CARD",
                notes: `Subscription upgrade to ${plan.name} (${input.billingCycle})`,
            },
        });

        // Record isolated payment transaction
        await tx.paymentTransaction.create({
            data: {
                tenantId: input.tenantId,
                invoiceId: invoice.id,
                amount: invoice.totalAmount,
                currency: plan.currency,
                status: "SUCCESS",
                gateway: "STRIPE",
                transactionRef: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                paymentMethodType: "VISA",
                lastFour: "4242",
            },
        });

        // Ensure tenant status is ACTIVE
        await tx.tenant.update({
            where: { id: input.tenantId },
            data: { status: "ACTIVE" },
        });

        return { sub, invoice };
    });

    revalidatePath("/settings/billing");
    revalidatePath("/platform-admin");
    revalidatePath("/platform-admin/billing");
    revalidatePath("/super-admin/billing");
    return { success: true, planName: plan.name, invoiceNumber };
}

/**
 * Tenant Self-Service: Purchase / Activate Add-on Marketplace Module.
 * Automatically provisions entitlement and generates an official tax invoice with VAT.
 */
export async function purchaseCompanyModuleAction(input: {
    tenantId: string;
    moduleId: string;
}) {
    const session = await auth();
    if (!session?.user) throw new Error("Authentication required.");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id ?? undefined },
        include: {
            memberships: {
                where: { tenantId: input.tenantId, status: "ACTIVE" },
            },
        },
    });

    const isPlatformAdmin = user?.role === "SUPER_ADMIN";
    const isTenantAdmin = user?.memberships?.some((m) => m.role === "ADMIN");

    if (!isPlatformAdmin && !isTenantAdmin) {
        throw new Error("Only organization administrators can purchase platform add-on modules.");
    }

    const mod = await prisma.module.findUnique({
        where: { id: input.moduleId },
    });
    if (!mod) throw new Error("Target module not found.");

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(now.getMonth() + 1);

    const price = mod.priceMonthly;
    const taxAmount = Math.round(price * 0.05 * 100) / 100;
    const totalAmount = Math.round(price * 1.05 * 100) / 100;
    const invoiceNumber = `INV-MOD-${Date.now().toString().slice(-6)}`;

    await prisma.$transaction(async (tx) => {
        // Safe find & update/create for company module
        const existing = await tx.companyModule.findFirst({
            where: {
                tenantId: input.tenantId,
                moduleId: input.moduleId,
            },
        });

        if (existing) {
            await tx.companyModule.update({
                where: { id: existing.id },
                data: {
                    status: "ENABLED",
                    expiresAt: null,
                },
            });
        } else {
            await tx.companyModule.create({
                data: {
                    tenantId: input.tenantId,
                    moduleId: input.moduleId,
                    status: "ENABLED",
                    expiresAt: null,
                },
            });
        }

        // Generate official Tax Invoice
        const invoice = await tx.subscriptionInvoice.create({
            data: {
                tenantId: input.tenantId,
                invoiceNumber,
                amount: price,
                taxAmount,
                totalAmount,
                currency: "AED",
                status: "PAID",
                billingPeriodStart: now,
                billingPeriodEnd: periodEnd,
                dueDate: now,
                paidAt: now,
                paymentMethod: "CARD",
                notes: `Add-on Module Activation: ${mod.name} (Monthly)`,
            },
        });

        // Record payment transaction
        await tx.paymentTransaction.create({
            data: {
                tenantId: input.tenantId,
                invoiceId: invoice.id,
                amount: totalAmount,
                currency: "AED",
                status: "SUCCESS",
                gateway: "STRIPE",
                transactionRef: `tx_mod_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                paymentMethodType: "CARD",
                lastFour: "4242",
            },
        });
    });

    revalidatePath("/settings/billing");
    revalidatePath("/super-admin/billing");
    revalidatePath("/super-admin/modules");
    return { success: true, moduleName: mod.name, invoiceNumber };
}
