import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizeAnyPermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

export const dynamic = "force-dynamic";

function denied(status: 401 | 403, error: string) {
    return NextResponse.json({ error }, { status });
}

export async function GET() {
    const auth = await authorizeAnyPermission([
        PERMISSIONS.SERVICE_CONFIG_MANAGE,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.SETTINGS_MANAGE,
    ]);
    if (!auth.ok) {
        await logSecurityEvent({
            action: SECURITY_ACTION.ACCESS_DENIED,
            outcome: "DENIED",
            requestPath: "/api/subscription/current",
            requestMethod: "GET",
            detail: { status: auth.status },
        });
        return denied(auth.status, auth.error);
    }

    try {
        // Get the company's current subscription (assuming single company for now)
        const subscription = await prisma.companySubscription.findFirst({
            where: { status: { in: ["ACTIVE", "TRIAL", "PAST_DUE"] } },
            include: {
                plan: true,
                usageLogs: {
                    orderBy: { createdAt: "desc" },
                    take: 50
                }
            }
        });

        if (!subscription) {
            return NextResponse.json({ 
                subscription: null,
                message: "No active subscription found"
            });
        }

        // Calculate usage stats
        const employeeCount = await prisma.employee.count({ where: { isActive: true } });
        const documentCount = await prisma.companyDocument.count({ where: { isActive: true } });
        const storageUsed = await prisma.companyDocument.aggregate({
            _sum: { fileBytes: true },
            where: { isActive: true }
        });

        return NextResponse.json({
            subscription: {
                ...subscription,
                plan: subscription.plan
            },
            usage: {
                employeesCount: employeeCount,
                documentsCount: documentCount,
                storageUsedMB: Math.round((storageUsed._sum.fileBytes || 0) / 1024 / 1024),
                daysRemaining: Math.ceil(
                    (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )
            }
        });
    } catch (error) {
        console.error("[SUBSCRIPTION_CURRENT_GET]", error);
        return NextResponse.json({ error: "Failed to fetch current subscription" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await authorizeAnyPermission([
        PERMISSIONS.SERVICE_CONFIG_MANAGE,
        PERMISSIONS.SETTINGS_MANAGE,
    ]);
    if (!auth.ok) {
        await logSecurityEvent({
            action: SECURITY_ACTION.ACCESS_DENIED,
            outcome: "DENIED",
            requestPath: "/api/subscription/current",
            requestMethod: "POST",
            detail: { status: auth.status },
        });
        return denied(auth.status, auth.error);
    }

    try {
        const body = await request.json();
        const { planId, billingCycle, provider, trialDays } = body;

        if (!planId) {
            return NextResponse.json({ error: "planId is required" }, { status: 400 });
        }

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
        if (!plan) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        const now = new Date();
        const periodStart = trialDays ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : now;
        const periodEnd = billingCycle === "YEARLY"
            ? new Date(periodStart.getTime() + 365 * 24 * 60 * 60 * 1000)
            : new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Deactivate any existing subscription
        await prisma.companySubscription.updateMany({
            where: { status: { in: ["ACTIVE", "TRIAL"] } },
            data: { status: "CANCELLED", cancelledAt: new Date() }
        });

        // Create new subscription
        const subscription = await prisma.companySubscription.create({
            data: {
                planId,
                status: trialDays ? "TRIAL" : "ACTIVE",
                billingCycle: billingCycle || "MONTHLY",
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                provider: provider || "MANUAL",
                trialEnd: trialDays ? periodStart : null,
            },
            include: { plan: true }
        });

        await logSecurityEvent({
            action: SECURITY_ACTION.ACCESS_DENIED,
            actorEmail: auth.user.email,
            actorRole: auth.user.role,
            target: `subscription:${subscription.id}`,
            outcome: "SUCCESS",
            detail: { change: "create", planId, billingCycle }
        });

        return NextResponse.json(subscription);
    } catch (error) {
        console.error("[SUBSCRIPTION_CURRENT_POST]", error);
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }
}