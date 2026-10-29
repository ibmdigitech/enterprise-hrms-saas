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

