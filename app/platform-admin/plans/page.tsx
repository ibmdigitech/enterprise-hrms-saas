import React from "react";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { PlatformHeader } from "@/components/platform-admin/PlatformHeader";
import { PlansClient } from "./plans-client";
import { ensureDefaultPlans } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export default async function PlatformPlansPage() {
    await requireSuperAdmin("platform.plans.view");
    await ensureDefaultPlans();

    const [plans, tenants] = await Promise.all([
        prisma.subscriptionPlan.findMany({
            orderBy: { priceMonthly: "asc" },
        }),
        prisma.tenant.findMany({
            select: { id: true, status: true },
        }),
    ]);

    const activeTenants = tenants.filter((t) => t.status === "ACTIVE").length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <PlatformHeader totalTenants={tenants.length} activeTenants={activeTenants} />

            <div className="p-8 space-y-6 flex-1">
                <div>
                    <h2 className="text-xl font-bold text-white">SaaS Subscription Plans & Pricing Catalog</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Configure pricing tiers in UAE Dirhams (AED), workforce capacity quotas, and modular feature gates.
                    </p>
                </div>

                <PlansClient plans={plans} />
            </div>
        </div>
    );
}
