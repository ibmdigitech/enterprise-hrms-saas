import React from "react";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { Building2, Users, Database, ShieldAlert, Plus, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { TenantCreationModal } from "./tenant-creation-modal";

export const dynamic = "force-dynamic";

export default async function PlatformAdminPage() {
    // Platform super-admin gate
    await requireSuperAdmin("platform.view");

    const [tenants, totalEmployees, totalUsers] = await Promise.all([
        prisma.tenant.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                subscription: true,
                companies: { select: { id: true, name: true } },
                _count: { select: { employees: true, memberships: true } },
            },
        }),
        prisma.employee.count(),
        prisma.user.count(),
    ]);

    const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;
    const dedicatedDbCount = tenants.filter((t) => Boolean(t.databaseUrl)).length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                        <ShieldAlert className="w-4 h-4" />
                        Platform Control Plane
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
                        SaaS Multi-Tenant Operations
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Monitor tenant subscribers, database isolation tiers, quotas, and automated provisioning.
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
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Tenants</div>
                        <div className="text-2xl font-bold text-white mt-0.5">{activeCount} / {tenants.length}</div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dedicated Databases</div>
                        <div className="text-2xl font-bold text-white mt-0.5">{dedicatedDbCount} Isolated</div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Managed Employees</div>
                        <div className="text-2xl font-bold text-white mt-0.5">{totalEmployees}</div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total User Accounts</div>
                        <div className="text-2xl font-bold text-white mt-0.5">{totalUsers}</div>
                    </div>
                </div>
            </div>

            {/* Tenant Subscribers List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-white">Registered Organizations</h2>
                    <span className="text-xs text-slate-400">{tenants.length} total subscribers</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-3.5">Organization</th>
                                <th className="px-6 py-3.5">Subdomain</th>
                                <th className="px-6 py-3.5">Plan Tier</th>
                                <th className="px-6 py-3.5">Database Tier</th>
                                <th className="px-6 py-3.5">Companies / Staff</th>
                                <th className="px-6 py-3.5">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {tenants.map((tenant) => {
                                const isDedicated = Boolean(tenant.databaseUrl);
                                const isActive = tenant.status === "ACTIVE";

                                return (
                                    <tr key={tenant.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white">{tenant.name}</div>
                                            <div className="text-xs text-slate-500">{tenant.contactEmail || "No email"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs px-2 py-1 rounded bg-slate-800 text-blue-400">
                                                {tenant.slug}.hrms-saas.com
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                                {tenant.subscription?.planTier || "TRIAL"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isDedicated ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                                    <Database className="w-3.5 h-3.5" />
                                                    Dedicated DB
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-750">
                                                    Shared Pool
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="font-medium text-slate-200">
                                                {tenant.companies.length} Companies
                                            </div>
                                            <div className="text-slate-400">
                                                {tenant._count.employees} / {tenant.subscription?.maxEmployees || 50} Employees
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isActive ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    {tenant.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
