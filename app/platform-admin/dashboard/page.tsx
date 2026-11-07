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
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <PlatformHeader />

            <main className="flex-1 px-6 pb-10 pt-8 sm:px-8 lg:px-10">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Platform Command Center</h1>
                    <div className="hidden sm:flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 shadow-inner shadow-amber-500/10 dark:text-amber-200">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(252,211,77,0.7)]" />
                        <span className="font-medium">Live</span>
                        <span className="font-mono text-xs text-amber-700/90 dark:text-amber-100/90">21:57:03</span>
                    </div>
                </div>

                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        aria-label="Refresh dashboard"
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-ring/40"
                    >
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 12a9 9 0 1 0 3-6.7" />
                            <path d="M3 4v5h5" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 shadow-inner shadow-amber-500/10 dark:text-amber-200">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(252,211,77,0.7)]" />
                        <span className="font-medium">Live</span>
                        <span className="font-mono text-xs text-amber-700/90 dark:text-amber-100/90">21:57:03</span>
                    </div>
                </div>

                <DashboardClient metrics={metrics} />
            </main>
        </div>
    );
}