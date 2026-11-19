"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { ensureDefaultPlans } from "@/lib/billing/plans";
import { revalidatePath } from "next/cache";

export async function getPlansAction() {
  await requireSuperAdmin("platform.plans.view");
  await ensureDefaultPlans();

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { priceMonthly: "asc" },
    include: {
      _count: {
        select: { subscriptions: true },
      },
    },
  });

  return plans;
}

export async function togglePlanActiveAction(planId: string, isActive: boolean) {
  await requireSuperAdmin("platform.plans.manage");

  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { isActive },
  });

  revalidatePath("/super-admin/plans");
  return { success: true };
}

export async function updatePlanAction(
  planId: string,
  data: Partial<{
    displayName: string;
    description: string;
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
    isPopular: boolean;
    features: any;
  }>
) {
  await requireSuperAdmin("platform.plans.manage");

  const updated = await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: {
      ...data,
      ...(data.priceMonthly !== undefined ? { priceMonthly: Number(data.priceMonthly) } : {}),
      ...(data.priceAnnual !== undefined ? { priceAnnual: Number(data.priceAnnual) } : {}),
      ...(data.maxEmployees !== undefined ? { maxEmployees: Number(data.maxEmployees) } : {}),
      ...(data.maxCompanies !== undefined ? { maxCompanies: Number(data.maxCompanies) } : {}),
      ...(data.maxLocations !== undefined ? { maxLocations: Number(data.maxLocations) } : {}),
    },
  });

  revalidatePath("/super-admin/plans");
  revalidatePath("/settings/billing");
  return { success: true, plan: updated };
}

