import React from "react";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { PlatformHeader } from "@/components/platform-admin/PlatformHeader";
import { BillingClient } from "./billing-client";
import { getPlatformBillingMetrics } from "../billing-actions";

export const dynamic = "force-dynamic";

export default async function PlatformBillingPage() {
    await requireSuperAdmin("platform.billing.view");

    const [metrics, tenants] = await Promise.all([
        getPlatformBillingMetrics(),
        prisma.tenant.findMany({
            select: { id: true, name: true, slug: true },
            orderBy: { name: "asc" },
        }),
    ]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <PlatformHeader totalTenants={metrics.totalTenants} activeTenants={metrics.activeSubscribers} />

            <div className="p-8 space-y-6 flex-1">
                <div>
                    <h2 className="text-xl font-bold text-white">Global Billing & Revenue Center</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Track subscription receipts, reconcile manual corporate bank transfers, and audit tenant payment gateways.
                    </p>
                </div>

                <BillingClient metrics={metrics} tenants={tenants} />
            </div>
        </div>
    );
}
