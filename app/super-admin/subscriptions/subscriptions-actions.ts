"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export interface SubscriptionFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  planTier?: string;
}

export async function getSubscriptionsAction(params: SubscriptionFilterParams = {}) {
  await requireSuperAdmin("platform.subscriptions.view");

  const { page = 1, limit = 20, search = "", status = "", planTier = "" } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.tenant = {
      name: { contains: search, mode: "insensitive" },
    };
  }

  if (status) {
    where.status = status;
  }

  if (planTier) {
    where.planTier = planTier;
  }

  const [subscriptions, total] = await Promise.all([
    prisma.tenantSubscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            currency: true,
            _count: {
              select: {
                employees: true,
                companies: true,
                locations: true,
              },
            },
          },
        },
        plan: true,
      },
    }),
    prisma.tenantSubscription.count({ where }),
  ]);

  return {
    subscriptions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateSubscriptionStatusAction(subId: string, status: string) {
  await requireSuperAdmin("platform.subscriptions.manage");

  await prisma.tenantSubscription.update({
    where: { id: subId },
    data: { status },
  });

  revalidatePath("/super-admin/subscriptions");
  return { success: true };
}

