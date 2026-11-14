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
            requestPath: "/api/subscription/plans",
            requestMethod: "GET",
            detail: { status: auth.status },
        });
        return denied(auth.status, auth.error);
    }

    try {
        const plans = await prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            include: {
                subscriptions: {
                    where: { status: { in: ["ACTIVE", "TRIAL"] } },
                    select: { id: true }
                }
            }
        });

        return NextResponse.json(plans.map(plan => ({
            ...plan,
            activeSubscriptions: plan.subscriptions.length
        })));
    } catch (error) {
        console.error("[SUBSCRIPTION_PLANS_GET]", error);
        return NextResponse.json({ error: "Failed to fetch subscription plans" }, { status: 500 });
    }
}