"use client";

import Link from "next/link";
import {
    Users,
    CalendarCheck,
    CheckCircle2,
    Clock,
    TrendingUp,
    BookOpen,
    Bell,
    ArrowUpRight,
    ChevronRight,
    UserCheck,
    AlertCircle,
    Zap,
    Building2,
    Award,
    Calendar,
    BarChart3,
    ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ManagerDashboardProps {
    user: any;
    employee: any;
    teamMembers: any[];
    teamAttendanceToday: any[];
    teamLeaveRequests: any[];
    teamPerformanceReviews: any[];
    teamTrainingEnrollments: any[];
    managerNotifications: any[];
    managerLeaveBalances: any[];
    pendingLeaveCount: number;
    teamSize: number;
    presentToday: number;
    trainingCompleted: number;
    trainingTotal: number;
}

const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const getAttendanceStatus = (memberId: string, attendance: any[]) => {
    const record = attendance.find((a) => a.employee?.id === memberId);
    if (!record) return "ABSENT";
    return record.status || "ABSENT";
};

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        PRESENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
        LATE: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
        ABSENT: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
        LEAVE: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
        HALF_DAY: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
        HOLIDAY: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
    };
    return map[status] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
};

const leaveBadge = (type: string) => {
    const map: Record<string, string> = {
        ANNUAL: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300",
        SICK: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
        EMERGENCY: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
        MATERNITY: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
        PATERNITY: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
        UNPAID: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    };
    return map[type] || "bg-slate-100 text-slate-600";
};

const reviewStatusBadge = (status: string) => {
    const map: Record<string, string> = {
        DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        IN_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
        COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
        PENDING: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    };
    return map[status] || "bg-slate-100 text-slate-600";
};

export function ManagerDashboard({
    user,
    employee,
    teamMembers,
    teamAttendanceToday,
    teamLeaveRequests,
    teamPerformanceReviews,
    teamTrainingEnrollments,
    managerNotifications,
    managerLeaveBalances,
    pendingLeaveCount,
    teamSize,
    presentToday,
    trainingCompleted,
    trainingTotal,
}: ManagerDashboardProps) {
    const firstName = employee?.firstName || user.name?.split(" ")[0] || "Manager";
    const designation = employee?.designation || "Team Manager";
    const department = employee?.department || "Operations";
    const attendancePct = teamSize > 0 ? Math.round((presentToday / teamSize) * 100) : 0;
    const trainingPct = trainingTotal > 0 ? Math.round((trainingCompleted / trainingTotal) * 100) : 0;
    const unreadNotifications = managerNotifications.filter((n: any) => !n.isRead).length;

    // Group training enrollments by course
    const courseMap: Record<string, { title: string; total: number; completed: number }> = {};
    for (const enr of teamTrainingEnrollments) {
        const courseId = enr.course?.id || "unknown";
        const courseTitle = enr.course?.title || "Unknown Course";
        if (!courseMap[courseId]) courseMap[courseId] = { title: courseTitle, total: 0, completed: 0 };
        courseMap[courseId].total++;
        if (enr.status === "COMPLETED") courseMap[courseId].completed++;
    }
    const courses = Object.values(courseMap).slice(0, 5);

    return (
        <div className="mx-auto w-full max-w-7xl space-y-7 p-4 md:p-8">

            {/* ── 1. Hero Banner ──────────────────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 shadow-xl border border-slate-800 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl" />

                <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                    <div className="min-w-0">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
                            <Zap className="h-3.5 w-3.5 text-indigo-300" />
                            Team Management Dashboard
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                            Welcome back, <span className="text-indigo-200">{firstName}</span>
                        </h1>
                        <p className="mt-1 text-sm text-slate-300">
                            {designation} · {department}
                        </p>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                            Here is your team's latest status, pending approvals and performance overview.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <Link href="/dashboard/approvals" className="w-full sm:w-auto">
                            <Button className="h-12 w-full gap-2 rounded-xl border-0 bg-white px-5 text-sm font-bold text-indigo-950 shadow-sm hover:bg-indigo-50 sm:w-auto sm:px-6">
                                <CheckCircle2 className="h-5 w-5" />
                                Approve Leaves
                                {pendingLeaveCount > 0 && (
                                    <span className="ml-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">
                                        {pendingLeaveCount}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <Link href="/employees" className="w-full sm:w-auto">
                            <Button variant="outline" className="h-12 w-full gap-2 rounded-xl border-white/20 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10 hover:text-white sm:w-auto sm:px-6">
                                <Users className="h-5 w-5" />
                                View Team
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── 2. KPI Cards ──────────────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {/* Team Size */}
                <Card className="group overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300">My Team</CardTitle>
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{teamSize}</div>
                        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">Active team members</p>
                    </CardContent>
                </Card>

                {/* Present Today */}
                <Card className="group overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300">Present Today</CardTitle>
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                            {presentToday} <span className="text-sm font-medium text-slate-400">/ {teamSize}</span>
                        </div>
                        <Progress value={attendancePct} className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" indicatorClassName="rounded-full bg-emerald-500" />
                        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{attendancePct}% attendance rate</p>
                    </CardContent>
                </Card>

                {/* Pending Approvals */}
                <Card className={`group overflow-hidden rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${pendingLeaveCount > 0 ? "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300">Pending Approvals</CardTitle>
                        <div className={`p-2.5 rounded-xl group-hover:scale-110 transition-transform ${pendingLeaveCount > 0 ? "bg-amber-100 dark:bg-amber-900/40" : "bg-slate-100 dark:bg-slate-800"}`}>
                            <Clock className={`h-5 w-5 ${pendingLeaveCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{pendingLeaveCount}</div>
                        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">Leave requests pending</p>
                    </CardContent>
                </Card>

                {/* Training Completion */}
                <Card className="group overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300">Training Progress</CardTitle>
                        <div className="p-2.5 bg-teal-50 dark:bg-teal-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                            {trainingPct}<span className="text-sm font-medium text-slate-400">%</span>
                        </div>
                        <Progress value={trainingPct} className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" indicatorClassName="rounded-full bg-teal-500" />
                        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{trainingCompleted} / {trainingTotal} completed</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── 2.5 My Leave Balances (Circular Cards) ──────────────────── */}
            {managerLeaveBalances.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                My Leave Balances ({new Date().getFullYear()})
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Your personal available and used days
                            </p>
                        </div>
                        <Link href="/leaves">
                            <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                View Leaves <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(() => {
                            const colors: Record<string, { stroke: string; bg: string; text: string }> = {
                                ANNUAL: { stroke: "#6366f1", bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-600 dark:text-indigo-400" },
                                SICK: { stroke: "#f43f5e", bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-400" },
                                EMERGENCY: { stroke: "#f97316", bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-600 dark:text-orange-400" },
                            };
                            const r = 32;
                            const circ = 2 * Math.PI * r;

                            return managerLeaveBalances.map((b: any, idx: number) => {
                                const c = colors[b.leaveType] || { stroke: "#8b5cf6", bg: "bg-purple-50", text: "text-purple-600" };
                                const total = b.totalDays || 0;
                                const used = b.usedDays || 0;
                                const avail = Math.max(0, total - used);
                                const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                                const offset = circ - (pct / 100) * circ;

                                return (
                                    <Card key={idx} className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="relative flex items-center justify-center shrink-0">
                                                <svg className="h-16 w-16 transform -rotate-90">
                                                    <circle cx="32" cy="32" r={r} stroke="currentColor" strokeWidth="5" className="text-slate-100 dark:text-slate-800" fill="transparent" />
                                                    <circle cx="32" cy="32" r={r} stroke={c.stroke} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white leading-none">{avail}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Left</span>
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase mb-1 ${c.bg} ${c.text}`}>
                                                    {b.leaveType}
                                                </span>
                                                <div className="text-[11px] space-y-0.5 text-slate-500 dark:text-slate-400 font-medium">
                                                    <div className="flex justify-between">
                                                        <span>Available:</span>
                                                        <span className="font-bold text-slate-900 dark:text-white">{avail}d</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Used:</span>
                                                        <span className="font-bold text-slate-900 dark:text-white">{used}d / {total}d</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {/* ── 3. Main Content Grid ─────────────────────────────────────── */}
            <div className="grid items-start gap-6 xl:grid-cols-7">

                {/* LEFT COLUMN (col-span-4) */}
                <div className="space-y-6 xl:col-span-4">

                    {/* Team Members */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">My Team</CardTitle>
                                <CardDescription className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                    {teamSize} active member{teamSize !== 1 ? "s" : ""}
                                </CardDescription>
                            </div>
                            <Link href="/employees">
                                <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                    View All <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {teamMembers.length === 0 ? (
                                <p className="p-6 text-center text-sm text-slate-400 italic">No team members assigned yet.</p>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {teamMembers.map((member: any) => {
                                        const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase();
                                        const attendanceStatus = getAttendanceStatus(member.id, teamAttendanceToday);
                                        return (
                                            <Link key={member.id} href={`/employees/${member.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-all group">
                                                {member.photo ? (
                                                    <img src={member.photo} alt={`${member.firstName} ${member.lastName}`} className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-900 shrink-0" />
                                                ) : (
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white shrink-0">
                                                        {initials || "?"}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                        {member.firstName} {member.lastName}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                                        {member.designation || "Staff"} · {member.department || "General"}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusBadge(attendanceStatus)}`}>
                                                    {attendanceStatus}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Leave Approvals */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Pending Leave Requests</CardTitle>
                                <CardDescription className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                    Awaiting your approval
                                </CardDescription>
                            </div>
                            <Link href="/dashboard/approvals">
                                <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                                    All Approvals <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {teamLeaveRequests.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 p-8 text-center">
                                    <div className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-3">
                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
                                    <p className="text-xs text-slate-400">No pending leave requests</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {teamLeaveRequests.map((req: any) => {
                                        const empInitials = `${req.employee?.firstName?.[0] ?? ""}${req.employee?.lastName?.[0] ?? ""}`.toUpperCase();
                                        return (
                                            <div key={req.id} className="flex items-start gap-4 p-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-all">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-black text-white">
                                                    {empInitials}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {req.employee?.firstName} {req.employee?.lastName}
                                                        </span>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${leaveBadge(req.leaveType)}`}>
                                                            {req.leaveType}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                        {formatDate(req.startDate)} → {formatDate(req.endDate)}
                                                    </p>
                                                    {req.reason && (
                                                        <p className="mt-0.5 text-xs text-slate-400 line-clamp-1 italic">"{req.reason}"</p>
                                                    )}
                                                </div>
                                                <Link href={`/dashboard/approvals`} className="shrink-0">
                                                    <Button size="sm" className="h-8 gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white hover:bg-indigo-700">
                                                        Review <ChevronRight className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Team Attendance Today */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
                            <CardTitle className="text-base font-bold">Team Attendance — Today</CardTitle>
                            <CardDescription className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                Live attendance snapshot for your team
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6">
                            {teamMembers.length === 0 ? (
                                <p className="text-center text-sm text-slate-400 italic">No team members to display.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                <th className="pb-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Employee</th>
                                                <th className="pb-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Status</th>
                                                <th className="pb-3 text-left text-xs font-black uppercase tracking-wider text-slate-500 hidden sm:table-cell">Check In</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                            {teamMembers.map((member: any) => {
                                                const att = teamAttendanceToday.find((a: any) => a.employee?.id === member.id);
                                                const status = att?.status || "ABSENT";
                                                const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase();
                                                return (
                                                    <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                                        <td className="py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-black text-white">
                                                                    {initials}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900 dark:text-white text-xs">
                                                                        {member.firstName} {member.lastName}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400">{member.designation || "Staff"}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusBadge(status)}`}>
                                                                {status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 hidden sm:table-cell">
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                {att?.checkIn ? new Date(att.checkIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN (col-span-3) */}
                <div className="space-y-6 xl:col-span-3">

                    {/* Quick Actions */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800/60">
                            <CardTitle className="text-base font-bold">Manager Shortcuts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-3">
                            {[
                                { href: "/dashboard/approvals", label: "Leave Approvals", icon: CalendarCheck, badge: pendingLeaveCount > 0 ? pendingLeaveCount : undefined, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400" },
                                { href: "/performance", label: "Performance Reviews", icon: TrendingUp, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400" },
                                { href: "/attendance", label: "Team Attendance", icon: Calendar, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400" },
                                { href: "/leaves", label: "Leave Management", icon: Clock, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400" },
                                { href: "/training", label: "Training Progress", icon: BookOpen, color: "text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400" },
                            ].map(({ href, label, icon: Icon, badge, color }) => (
                                <Link key={href} href={href} className="block">
                                    <Button variant="outline" className="w-full justify-between h-11 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400">
                                        <span className="flex items-center gap-2">
                                            <span className={`p-1.5 rounded-lg ${color}`}>
                                                <Icon className="h-3.5 w-3.5" />
                                            </span>
                                            {label}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            {badge !== undefined && (
                                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                                    {badge}
                                                </span>
                                            )}
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        </span>
                                    </Button>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Team Performance Reviews */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Team Performance</CardTitle>
                                <CardDescription className="text-xs text-slate-500 font-bold uppercase tracking-wider">Recent review cycles</CardDescription>
                            </div>
                            <Link href="/performance">
                                <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    All <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {teamPerformanceReviews.length === 0 ? (
                                <div className="p-6 text-center">
                                    <div className="mx-auto mb-2 w-fit rounded-full bg-slate-100 dark:bg-slate-800 p-3">
                                        <BarChart3 className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <p className="text-xs text-slate-400 italic">No performance reviews yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {teamPerformanceReviews.slice(0, 5).map((review: any) => (
                                        <div key={review.id} className="flex items-center gap-3 p-4">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-[10px] font-black text-white">
                                                {`${review.employee?.firstName?.[0] ?? ""}${review.employee?.lastName?.[0] ?? ""}`.toUpperCase() || "?"}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                                                    {review.employee?.firstName} {review.employee?.lastName}
                                                </p>
                                                <p className="text-[10px] text-slate-400">
                                                    Rating: {review.overallRating ?? "—"}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${reviewStatusBadge(review.status)}`}>
                                                {review.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Training Course Progress */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Training Progress</CardTitle>
                                <CardDescription className="text-xs text-slate-500 font-bold uppercase tracking-wider">Team completion by course</CardDescription>
                            </div>
                            <Link href="/training">
                                <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                    All <ArrowUpRight className="h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 space-y-5">
                            {courses.length === 0 ? (
                                <div className="text-center py-4">
                                    <BookOpen className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                                    <p className="text-xs text-slate-400 italic">No training enrollments yet.</p>
                                </div>
                            ) : (
                                courses.map((course, idx) => {
                                    const pct = course.total > 0 ? Math.round((course.completed / course.total) * 100) : 0;
                                    return (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{course.title}</span>
                                                <span className="text-xs font-black text-slate-500">{course.completed}/{course.total}</span>
                                            </div>
                                            <Progress value={pct} className="h-2 rounded-full bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-gradient-to-r from-teal-500 to-indigo-500" />
                                            <p className="text-[10px] font-bold text-slate-400">{pct}% complete</p>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>

                    {/* Notifications */}
                    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-bold">Notifications</CardTitle>
                                <CardDescription className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                    {unreadNotifications > 0 ? `${unreadNotifications} unread` : "All caught up"}
                                </CardDescription>
                            </div>
                            {unreadNotifications > 0 && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-black text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                    {unreadNotifications}
                                </span>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            {managerNotifications.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 p-6 text-center">
                                    <div className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-3">
                                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <p className="text-xs text-slate-400 italic">No notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {managerNotifications.map((notif: any) => (
                                        <div key={notif.id} className={`flex items-start gap-3 p-4 ${!notif.isRead ? "bg-indigo-50/40 dark:bg-indigo-950/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-900/30"}`}>
                                            <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!notif.isRead ? "bg-indigo-500" : "bg-transparent"}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-xs font-bold ${!notif.isRead ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-slate-400 line-clamp-2">{notif.message}</p>
                                                <p className="mt-1 text-[9px] font-bold text-slate-400">
                                                    {new Date(notif.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
