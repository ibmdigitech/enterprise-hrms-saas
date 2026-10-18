import React from "react";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { Building2, Users, Database, ShieldAlert, DollarSign, Server, CheckCircle2 } from "lucide-react";
import { TenantCreationModal } from "./tenant-creation-modal";
import { PlatformHeader } from "@/components/platform-admin/PlatformHeader";
import { TenantsClientTable } from "./tenants-client-table";
import { ensureDefaultPlans } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
    // Platform super-admin gate
    await requireSuperAdmin("platform.view");
    await ensureDefaultPlans();

    const [tenants, totalEmployees, totalUsers, plans] = await Promise.all([
        prisma.tenant.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                subscription: {
                    include: { plan: true },
                },
                companies: { select: { id: true, name: true } },
                _count: { select: { employees: true, memberships: true } },
            },
        }),
        prisma.employee.count(),
        prisma.user.count(),
        prisma.subscriptionPlan.findMany(),
    ]);

    const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;
    const dedicatedDbCount = tenants.filter((t) => Boolean(t.databaseUrl)).length;

    // Approximate MRR from active plans
    let calculatedMRR = 0;
    for (const t of tenants) {
        if (t.status === "ACTIVE") {
            const planSlug = t.subscription?.planTier || "STARTER";
            const plan = plans.find((p) => p.slug === planSlug);
            if (plan) {
                calculatedMRR += plan.priceMonthly;
            }
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            {/* Platform Sub-Navigation Header */}
            <PlatformHeader totalTenants={tenants.length} activeTenants={activeCount} />

            <div className="p-8 space-y-8 flex-1">
                {/* Actions & Metrics Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white">Infrastructure & Subscriber Registry</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Real-time platform telemetry across logical row-level and dedicated physical database instances.
                        </p>
                    </div>
                    <TenantCreationModal />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Organizations</div>
                            <div className="text-2xl font-bold text-white mt-0.5">{activeCount} / {tenants.length}</div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Platform Run Rate</div>
                            <div className="text-2xl font-bold text-emerald-400 mt-0.5">
                                {calculatedMRR.toLocaleString()} <span className="text-xs font-normal text-slate-400">AED/mo</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Database Isolation</div>
                            <div className="text-2xl font-bold text-white mt-0.5">
                                {dedicatedDbCount} <span className="text-xs font-normal text-slate-400">Isolated</span> / {tenants.length - dedicatedDbCount} <span className="text-xs font-normal text-slate-400">Shared</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Managed Workforces</div>
                            <div className="text-2xl font-bold text-white mt-0.5">{totalEmployees} <span className="text-xs font-normal text-slate-400">staff</span></div>
                        </div>
                    </div>
                </div>

                {/* Interactive Filterable Tenant Subscribers List */}
                <TenantsClientTable tenants={tenants} />
            </div>
        </div>
    );
}
