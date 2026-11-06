"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Shield, ShieldCheck, ShieldX, Clock, Users, Search, CheckCircle2,
    XCircle, AlertCircle, Eye, BarChart3, History, RefreshCw, User,
    ChevronRight, Building2, KeyRound, Zap,
} from "lucide-react";
import { decideRoleRequest } from "@/app/lib/actions/access-requests";

/* ─── Types ──────────────────────────────────────────────────────────── */

type RequestRow = {
    id: string;
    status: string;
    requestedRole: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string | null;
        email: string;
        role: string;
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            designation: string | null;
            department: string | null;
        } | null;
    };
};

type UserRow = {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        designation: string | null;
        department: string | null;
        isActive: boolean;
    } | null;
};

type Props = {
    allRequests: RequestRow[];
    allUsers: UserRow[];
    stats: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
        totalUsers: number;
    };
    actorEmail: string;
};

/* ─── Status badge helper ─────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        PENDING:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        APPROVED:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        REJECTED:  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
        CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${map[status] ?? map.PENDING}`}>
            {status === "PENDING"   && <Clock className="h-3 w-3" />}
            {status === "APPROVED"  && <CheckCircle2 className="h-3 w-3" />}
            {status === "REJECTED"  && <XCircle className="h-3 w-3" />}
            {status === "CANCELLED" && <AlertCircle className="h-3 w-3" />}
            {status}
        </span>
    );
}

/* ─── Role badge helper ───────────────────────────────────────────────── */

function RoleBadge({ role }: { role: string }) {
    const colorMap: Record<string, string> = {
        SUPER_ADMIN:        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        ADMIN:              "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
        COMPANY_ADMIN:      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
        HR_MANAGER:         "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
        HR:                 "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
        MANAGER:            "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
        DEPARTMENT_MANAGER: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
        FINANCE:            "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        STAFF:              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
        EMPLOYEE:           "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border-0 ${colorMap[role] ?? colorMap.STAFF}`}>
            {role.replace(/_/g, " ")}
        </span>
    );
}

/* ─── Request Card ────────────────────────────────────────────────────── */

function RequestCard({
    req,
    actorEmail,
    onDecide,
}: {
    req: RequestRow;
    actorEmail: string;
    onDecide: (id: string, decision: "APPROVED" | "REJECTED") => void;
}) {
    const isPending   = req.status === "PENDING";
    const isSelfAppr  = req.user.email === actorEmail;
    const displayName = req.user.employee
        ? `${req.user.employee.firstName} ${req.user.employee.lastName}`
        : (req.user.name ?? req.user.email);
    const initials    = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-all duration-200 group">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Avatar */}
                <div className="h-11 w-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-black text-sm flex-shrink-0">
                    {initials || <User className="h-5 w-5" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-black text-slate-900 dark:text-white text-sm">{displayName}</span>
                        <StatusBadge status={req.status} />
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{req.user.email}</p>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-400">Current:</span>
                        <RoleBadge role={req.user.role} />
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                        <span className="text-slate-400">Requested:</span>
                        <RoleBadge role={req.requestedRole} />
                    </div>

                    {req.user.employee && (
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {req.user.employee.designation ?? "—"} · {req.user.employee.department ?? "—"}
                        </p>
                    )}

                    <p className="text-[11px] text-slate-400 mt-1">
                        Submitted {new Date(req.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                        })}
                    </p>
                </div>

                {/* Actions */}
                {isPending && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isSelfAppr && (
                            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Your own request</span>
                        )}
                        {!isSelfAppr && (
                            <>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="gap-1.5 rounded-xl font-bold text-xs h-8"
                                    onClick={() => onDecide(req.id, "REJECTED")}
                                >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Reject
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-xs h-8"
                                    onClick={() => onDecide(req.id, "APPROVED")}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Approve
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Empty state ────────────────────────────────────────────────────── */

function EmptyState({ icon, message, hint }: { icon: React.ReactNode; message: string; hint?: string }) {
    return (
        <div className="py-20 text-center px-6">
            <div className="h-16 w-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 mx-auto mb-4">
                {icon}
            </div>
            <p className="font-black text-slate-700 dark:text-slate-300 mb-1">{message}</p>
            {hint && <p className="text-xs text-slate-400 max-w-sm mx-auto">{hint}</p>}
        </div>
    );
}

/* ─── Main Client Component ───────────────────────────────────────────── */

export function AccessApprovalClient({ allRequests, allUsers, stats, actorEmail }: Props) {
    const [isPending, startTransition] = useTransition();
    const [toast, setToast]            = useState<{ msg: string; ok: boolean } | null>(null);
    const [search, setSearch]          = useState("");
    const [userSearch, setUserSearch]  = useState("");
    const [historyFilter, setHistoryFilter] = useState<string>("ALL");

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 4000);
    };

    const handleDecide = (id: string, decision: "APPROVED" | "REJECTED") => {
        startTransition(async () => {
            const result = await decideRoleRequest(id, decision);
            showToast(result.message, result.success);
        });
    };

    // Filter queues
    const pending = allRequests.filter(r => r.status === "PENDING");
    const history = allRequests.filter(r =>
        historyFilter === "ALL" ? r.status !== "PENDING" : r.status === historyFilter
    );

    const filteredPending = search
        ? pending.filter(r =>
            r.user.email.toLowerCase().includes(search.toLowerCase()) ||
            (r.user.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
            r.requestedRole.toLowerCase().includes(search.toLowerCase()) ||
            (r.user.employee?.firstName ?? "").toLowerCase().includes(search.toLowerCase()) ||
            (r.user.employee?.lastName ?? "").toLowerCase().includes(search.toLowerCase())
          )
        : pending;

    const filteredHistory = search
        ? history.filter(r =>
            r.user.email.toLowerCase().includes(search.toLowerCase()) ||
            r.requestedRole.toLowerCase().includes(search.toLowerCase())
          )
        : history;

    const filteredUsers = userSearch
        ? allUsers.filter(u =>
            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.name ?? "").toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.employee?.firstName ?? "").toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.employee?.lastName ?? "").toLowerCase().includes(userSearch.toLowerCase()) ||
            u.role.toLowerCase().includes(userSearch.toLowerCase())
          )
        : allUsers;

    return (
        <div className="space-y-8 p-4 md:p-8 w-full max-w-7xl mx-auto">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm transition-all duration-300 ${
                    toast.ok
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                }`}>
                    {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 p-8 md:p-12 rounded-[2.5rem] shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-indigo-200 text-xs font-black uppercase tracking-widest mb-4">
                            <Zap className="h-3 w-3 fill-indigo-400" />
                            Access Control Center
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                            Role &amp; Access<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                Approvals
                            </span>
                        </h1>
                        <p className="text-slate-300 mt-3 text-sm max-w-lg leading-relaxed">
                            Review access requests, manage user roles, and audit access history. All changes are logged.
                        </p>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        {[
                            { label: "Pending",   value: stats.pending,   color: "text-amber-400" },
                            { label: "Approved",  value: stats.approved,  color: "text-emerald-400" },
                            { label: "Rejected",  value: stats.rejected,  color: "text-rose-400" },
                            { label: "Total Users", value: stats.totalUsers, color: "text-indigo-400" },
                        ].map(s => (
                            <div key={s.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 text-center">
                                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Search bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, email, or role…"
                    className="pl-11 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl font-medium"
                />
            </div>

            {/* Tabs */}
            <Card className="bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 shadow-xl rounded-[2.5rem] overflow-hidden">
                <Tabs defaultValue="queue">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 px-6 py-5">
                        <TabsList className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1 h-12 rounded-2xl shadow-sm overflow-x-auto w-full max-w-2xl">
                            <TabsTrigger value="queue" className="shrink-0 rounded-xl px-5 font-black text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2">
                                <Shield className="h-4 w-4" />
                                Approval Queue
                                {stats.pending > 0 && (
                                    <Badge className="ml-1 bg-amber-500 text-white border-0 text-[10px] font-black">{stats.pending}</Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="review" className="shrink-0 rounded-xl px-5 font-black text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white gap-2">
                                <Users className="h-4 w-4" />
                                Access Review
                            </TabsTrigger>
                            <TabsTrigger value="history" className="shrink-0 rounded-xl px-5 font-black text-xs data-[state=active]:bg-slate-700 data-[state=active]:text-white gap-2">
                                <History className="h-4 w-4" />
                                Audit History
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>

                    {/* ══ APPROVAL QUEUE ══ */}
                    <TabsContent value="queue" className="m-0">
                        <CardContent className="p-0">
                            {filteredPending.length === 0 ? (
                                <EmptyState
                                    icon={<ShieldCheck className="h-8 w-8" />}
                                    message={search ? "No matching requests" : "No pending access requests"}
                                    hint="All access requests have been reviewed. New requests will appear here when submitted."
                                />
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {filteredPending.map(req => (
                                        <RequestCard
                                            key={req.id}
                                            req={req}
                                            actorEmail={actorEmail}
                                            onDecide={handleDecide}
                                        />
                                    ))}
                                </div>
                            )}
                            {isPending && (
                                <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-sm">
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Processing…
                                </div>
                            )}
                        </CardContent>
                    </TabsContent>

                    {/* ══ ACCESS REVIEW ══ */}
                    <TabsContent value="review" className="m-0">
                        <CardContent className="p-6">
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        placeholder="Search users…"
                                        className="pl-9 h-10 rounded-xl"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 font-bold">{filteredUsers.length} users</p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900/60">
                                        <tr>
                                            {["User", "Current Role", "Department", "Status", "Last Updated"].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {filteredUsers.slice(0, 50).map(u => {
                                            const name = u.employee
                                                ? `${u.employee.firstName} ${u.employee.lastName}`
                                                : (u.name ?? u.email);
                                            const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                                            return (
                                                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-xs">
                                                                {initials || <User className="h-4 w-4" />}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900 dark:text-white text-xs">{name}</p>
                                                                <p className="text-[11px] text-slate-400">{u.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <RoleBadge role={u.role} />
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-500">
                                                        {u.employee?.department ?? "—"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {u.employee ? (
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                                u.employee.isActive
                                                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                                            }`}>
                                                                {u.employee.isActive ? "Active" : "Inactive"}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400">No Profile</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-slate-400">
                                                        {new Date(u.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && (
                                    <div className="py-12 text-center text-slate-400 text-sm">No users found.</div>
                                )}
                                {filteredUsers.length > 50 && (
                                    <div className="py-3 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
                                        Showing first 50 of {filteredUsers.length} users.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </TabsContent>

                    {/* ══ AUDIT HISTORY ══ */}
                    <TabsContent value="history" className="m-0">
                        <CardContent className="p-6">
                            {/* Filter row */}
                            <div className="flex flex-wrap gap-2 mb-5">
                                {["ALL", "APPROVED", "REJECTED", "CANCELLED"].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setHistoryFilter(f)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-colors ${
                                            historyFilter === f
                                                ? "bg-indigo-600 text-white"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                    >
                                        {f === "ALL" ? "All Decided" : f}
                                    </button>
                                ))}
                                <span className="ml-auto text-xs text-slate-400 font-bold self-center">{filteredHistory.length} records</span>
                            </div>

                            {filteredHistory.length === 0 ? (
                                <EmptyState
                                    icon={<History className="h-8 w-8" />}
                                    message="No history yet"
                                    hint="Approved and rejected access requests will appear here."
                                />
                            ) : (
                                <div className="space-y-3">
                                    {filteredHistory.map(req => {
                                        const name = req.user.employee
                                            ? `${req.user.employee.firstName} ${req.user.employee.lastName}`
                                            : (req.user.name ?? req.user.email);
                                        return (
                                            <div key={req.id} className="flex items-center gap-4 p-4 bg-slate-50/60 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                    req.status === "APPROVED"
                                                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                                                        : req.status === "REJECTED"
                                                        ? "bg-rose-100 dark:bg-rose-900/30"
                                                        : "bg-slate-100 dark:bg-slate-800"
                                                }`}>
                                                    {req.status === "APPROVED"  && <ShieldCheck className="h-5 w-5 text-emerald-600" />}
                                                    {req.status === "REJECTED"  && <ShieldX className="h-5 w-5 text-rose-600" />}
                                                    {req.status === "CANCELLED" && <AlertCircle className="h-5 w-5 text-slate-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-black text-sm text-slate-900 dark:text-white truncate">{name}</span>
                                                        <ChevronRight className="h-3 w-3 text-slate-300" />
                                                        <RoleBadge role={req.requestedRole} />
                                                        <StatusBadge status={req.status} />
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{req.user.email}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-[11px] text-slate-400">
                                                        {new Date(req.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </TabsContent>
                </Tabs>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Eye className="h-3 w-3" /> All decisions are logged to the Security Audit Log</span>
                <span className="flex items-center gap-1.5"><KeyRound className="h-3 w-3" /> Self-approval is blocked</span>
                <span className="flex items-center gap-1.5"><BarChart3 className="h-3 w-3" /> Role changes apply immediately after approval</span>
            </div>
        </div>
    );
}

