"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export async function updatePlanAction(input: {
    id: string;
    name: string;
    description?: string;
    priceMonthly: number;
    priceAnnual: number;
    maxEmployees: number;
    maxCompanies: number;
    maxLocations: number;
    hasPayroll: boolean;
    hasCompliance: boolean;
    hasRecruitment: boolean;
    hasCustomTheme: boolean;
    hasApiAccess: boolean;
}) {
    await requireSuperAdmin("platform.plans.manage");

    await prisma.subscriptionPlan.update({
        where: { id: input.id },
        data: {
            name: input.name.trim(),
            description: input.description?.trim(),
            priceMonthly: Number(input.priceMonthly),
            priceAnnual: Number(input.priceAnnual),
            maxEmployees: Number(input.maxEmployees),
            maxCompanies: Number(input.maxCompanies),
            maxLocations: Number(input.maxLocations),
            hasPayroll: input.hasPayroll,
            hasCompliance: input.hasCompliance,
            hasRecruitment: input.hasRecruitment,
            hasCustomTheme: input.hasCustomTheme,
            hasApiAccess: input.hasApiAccess,
        },
    });

    revalidatePath("/platform-admin/plans");
    revalidatePath("/settings/billing");
    return { success: true };
}
