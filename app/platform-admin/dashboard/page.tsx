import React from "react";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { PlatformHeader } from "@/components/platform-admin/PlatformHeader";
import { DashboardClient } from "../dashboard-client";
import { getPlatformDashboardMetrics } from "../dashboard-actions";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
    await requireSuperAdmin("platform.dashboard.view");

    const [metrics, tenants] = await Promise.all([
        getPlatformDashboardMetrics(),
        prisma.tenant.findMany({
            select: { id: true, status: true },
        }),
    ]);

    const activeTenants = tenants.filter((t: { status: string }) => t.status === "ACTIVE").length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <PlatformHeader totalTenants={tenants.length} activeTenants={activeTenants} />

            <div className="p-8 space-y-8 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Platform Command Center</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Real-time platform telemetry: revenue, tenants, workforce, security, and HR operations across all organizations.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                        </span>
                    </div>
                </div>

                <DashboardClient metrics={metrics} />
            </div>
        </div>
    );
}