"use client";

import { useState } from "react";
import { Database, CheckCircle2, XCircle, Search, SlidersHorizontal, Settings2, Building2 } from "lucide-react";
import { TenantManageModal } from "./tenant-manage-modal";

interface TenantsClientTableProps {
    tenants: any[];
}

export function TenantsClientTable({ tenants }: TenantsClientTableProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [selectedTenant, setSelectedTenant] = useState<any | null>(null);

    const filtered = tenants.filter((tenant) => {
        const matchesSearch =
            tenant.name.toLowerCase().includes(search.toLowerCase()) ||
            tenant.slug.toLowerCase().includes(search.toLowerCase()) ||
            (tenant.contactEmail && tenant.contactEmail.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && tenant.status === "ACTIVE") ||
            (statusFilter === "SUSPENDED" && tenant.status === "SUSPENDED") ||
            (statusFilter === "TRIAL" && tenant.status === "TRIAL");

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header with Search & Filters */}
            <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold text-white">Registered Organizations</h2>
                    <span className="text-xs text-slate-400">
                        Showing {filtered.length} of {tenants.length} subscribers
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Filter by name or slug..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-2 w-48 sm:w-64 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="TRIAL">Trial</option>
                        <option value="SUSPENDED">Suspended</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                        <tr>
                            <th className="px-6 py-3.5">Organization</th>
                            <th className="px-6 py-3.5">Subdomain</th>
                            <th className="px-6 py-3.5">Plan Tier</th>
                            <th className="px-6 py-3.5">Database Tier</th>
                            <th className="px-6 py-3.5">Quota Usage</th>
                            <th className="px-6 py-3.5">Status</th>
                            <th className="px-6 py-3.5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-sm">
                                    No organizations matched your search filter.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((tenant) => {
                                const isDedicated = Boolean(tenant.databaseUrl);
                                const isActive = tenant.status === "ACTIVE";
                                const employeeCount = tenant._count.employees;
                                const maxEmployees = tenant.subscription?.maxEmployees || 50;
                                const quotaPercent = Math.min(Math.round((employeeCount / maxEmployees) * 100), 100);

                                return (
                                    <tr key={tenant.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                {tenant.name}
                                            </div>
                                            <div className="text-xs text-slate-500">{tenant.contactEmail || "No billing email"}</div>
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
                                            <div className="flex items-center justify-between text-slate-300 mb-1">
                                                <span>{employeeCount} / {maxEmployees} staff</span>
                                                <span className="font-mono text-[11px] text-slate-500">{quotaPercent}%</span>
                                            </div>
                                            <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        quotaPercent >= 90
                                                            ? "bg-rose-500"
                                                            : quotaPercent >= 70
                                                            ? "bg-amber-500"
                                                            : "bg-blue-500"
                                                    }`}
                                                    style={{ width: `${quotaPercent}%` }}
                                                />
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
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedTenant(tenant)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors border border-slate-700"
                                            >
                                                <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                                                Manage
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Tenant Manage Modal */}
            {selectedTenant && (
                <TenantManageModal
                    tenant={selectedTenant}
                    isOpen={Boolean(selectedTenant)}
                    onClose={() => setSelectedTenant(null)}
                />
            )}
        </div>
    );
}
