import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

const RenewalSchema = z.object({
  tenantId: z.string().cuid("Tenant ID is required"),
  planId: z.string().cuid("Plan ID is required"),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  autoRenew: z.boolean().default(true),
  gracePeriodDays: z.number().int().min(0).max(90).default(7),
  provider: z.enum(["MANUAL", "STRIPE", "PAYPAL"]).default("MANUAL"),
});

const CancelSchema = z.object({
  tenantId: z.string().cuid("Tenant ID is required"),
  cancelAtPeriodEnd: z.boolean().default(true),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.SUBSCRIPTIONS_RENEW);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = RenewalSchema.parse(body);

    const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const existingSub = await prisma.tenantSubscription.findFirst({
      where: { tenantId: data.tenantId },
      orderBy: { updatedAt: "desc" },
    });

    const now = new Date();
    const periodStart = existingSub?.currentPeriodEnd && existingSub.currentPeriodEnd > now
      ? existingSub.currentPeriodEnd
      : now;

    const periodEnd = data.billingCycle === "YEARLY"
      ? new Date(periodStart.getTime() + 365 * 24 * 60 * 60 * 1000)
      : new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.tenantSubscription.upsert({
      where: { id: existingSub?.id ?? "temp" },
      update: {
        planId: data.planId,
        planTier: plan.slug,
        status: "ACTIVE",
        billingCycle: data.billingCycle,
        maxEmployees: plan.maxEmployees,
        maxCompanies: plan.maxCompanies,
        maxLocations: plan.maxLocations,
        hasPayroll: plan.hasPayroll,
        hasCompliance: plan.hasCompliance,
        hasRecruitment: plan.hasRecruitment,
        hasCustomTheme: plan.hasCustomTheme,
        hasApiAccess: plan.hasApiAccess,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
      create: {
        tenantId: data.tenantId,
        planId: data.planId,
        planTier: plan.slug,
        status: "ACTIVE",
        billingCycle: data.billingCycle,
        maxEmployees: plan.maxEmployees,
        maxCompanies: plan.maxCompanies,
        maxLocations: plan.maxLocations,
        hasPayroll: plan.hasPayroll,
        hasCompliance: plan.hasCompliance,
        hasRecruitment: plan.hasRecruitment,
        hasCustomTheme: plan.hasCustomTheme,
        hasApiAccess: plan.hasApiAccess,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `billing.subscription:${subscription.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "POST",
      detail: { tenantId: data.tenantId, planId: data.planId, billingCycle: data.billingCycle },
    });

    return NextResponse.json({ success: true, subscription }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to renew subscription" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.SUBSCRIPTIONS_CANCEL);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = CancelSchema.parse(body);

    const subscription = await prisma.tenantSubscription.findFirst({
      where: { tenantId: data.tenantId },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.cancelAtPeriodEnd) {
      updateData.cancelAtPeriodEnd = true;
      updateData.cancelledAt = new Date();
    } else {
      updateData.status = "CANCELLED";
      updateData.currentPeriodEnd = new Date();
      updateData.cancelledAt = new Date();
    }

    if (data.reason) {
      // TenantSubscription has no metadata field; reason acknowledged only
    }

    const updated = await prisma.tenantSubscription.update({
      where: { id: subscription.id },
      data: updateData,
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `billing.subscription:${subscription.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "PUT",
      detail: { cancelAtPeriodEnd: data.cancelAtPeriodEnd, reason: data.reason },
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to cancel subscription" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.SUBSCRIPTIONS_VIEW);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || "";
    const tenantId = searchParams.get("tenantId") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;

    const [subscriptions, total] = await Promise.all([
      prisma.tenantSubscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { currentPeriodEnd: "asc" },
        include: {
          tenant: { select: { id: true, name: true, slug: true, status: true } },
          plan: { select: { id: true, name: true, slug: true, priceMonthly: true, priceAnnual: true } },
        },
      }),
      prisma.tenantSubscription.count({ where }),
    ]);

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: "billing.subscriptions.list",
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "GET",
      detail: { page, limit, status, tenantId },
    });

    return NextResponse.json({
      subscriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch subscriptions" }, { status: 500 });
  }
}
