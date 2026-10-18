import React from "react";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { PlatformHeader } from "@/components/platform-admin/PlatformHeader";
import { Shield, Activity, Clock, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlatformAuditPage() {
    await requireSuperAdmin("platform.audit.view");

    const [auditLogs, tenants] = await Promise.all([
        prisma.securityAuditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
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
                    <h2 className="text-xl font-bold text-white">Platform Security & Audit Trail</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Centralized audit logging of all administrative actions, tenant provisioning, isolation routing, and security events.
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Activity className="w-4 h-4 text-blue-400" />
                            Recent Administrative Events
                        </div>
                        <span className="text-xs text-slate-400">Showing last {auditLogs.length} events</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-3.5">Action</th>
                                    <th className="px-6 py-3.5">Actor</th>
                                    <th className="px-6 py-3.5">Target</th>
                                    <th className="px-6 py-3.5">Outcome</th>
                                    <th className="px-6 py-3.5">IP Address</th>
                                    <th className="px-6 py-3.5">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {auditLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No platform security audit events recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    auditLogs.map((log) => {
                                        const isSuccess = log.outcome === "SUCCESS";
                                        return (
                                            <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-medium">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    <div className="font-medium text-white">{log.actorEmail || "System"}</div>
                                                    <div className="text-slate-500">{log.actorRole || "N/A"}</div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                                    {log.target || "-"}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isSuccess ? (
                                                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Success
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            {log.outcome}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                    {log.ipAddress || "Internal"}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-400">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
