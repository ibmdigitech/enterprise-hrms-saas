"use client";

import Link from "next/link";
import { 
    Calendar, 
    Clock, 
    DollarSign, 
    FileText, 
    Plus, 
    ShieldAlert, 
    UserCheck, 
    ArrowUpRight, 
    Plane, 
    HeartHandshake, 
    User, 
    CheckCircle2, 
    AlertCircle, 
    Sparkles, 
    CreditCard, 
    FileCheck, 
    ChevronRight,
    MapPin,
    Building2,
    CalendarCheck,
    Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
    user: any;
    employee: any;
    todayAttendance: any;
    recentAttendance: any[];
    myLeaves: any[];
    pendingLeavesCount: number;
    latestSalary: any;
    myServiceRequests: any[];
    myLeaveBalances?: any[];
}

const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const formatTime = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const monthName = (m: number) => new Date(2000, m - 1).toLocaleString("default", { month: "short" });

export function StaffSelfServiceDashboard({
    user,
    employee,
    todayAttendance,
    recentAttendance,
    myLeaves,
    pendingLeavesCount,
    latestSalary,
    myServiceRequests,
    myLeaveBalances = []
}: Props) {
    const firstName = employee?.firstName || user.name?.split(' ')[0] || "Employee";
    const fullName = `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim() || user.name || "Employee";
    const designation = employee?.designation || "Staff Member";
    const department = employee?.department || "General";
    const employeeCode = employee?.employeeCode || employee?.rollNumber || "STF-001";
    const location = employee?.workLocation || "Head Office";

    // Attendance status logic
    const isPresentToday = Boolean(todayAttendance && (todayAttendance.status === "PRESENT" || todayAttendance.status === "LATE"));
    const isLateToday = Boolean(todayAttendance && (todayAttendance.status === "LATE" || todayAttendance.lateMinutes > 0));

    return (
        <div className="mx-auto w-full max-w-7xl space-y-7 p-4 md:p-8">
            
            {/* 1. Personalized Executive Hero Header */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 md:p-10 shadow-xl border border-slate-800">
                <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

                <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                    <div className="min-w-0">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-300 backdrop-blur-md">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            Employee Portal
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-teal-300">{firstName}</span>
                        </h1>
                        <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-slate-300 max-w-xl">
                            Here is your personal attendance status, leave balance, compensation, and self-service requests.
                        </p>
                        
                        {/* Profile Meta Badges */}
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                                <Building2 className="h-3 w-3 text-indigo-300" />
                                {department}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                                <User className="h-3 w-3 text-blue-300" />
                                {designation}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 font-mono text-indigo-200">
                                {employeeCode}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                                <MapPin className="h-3 w-3 text-teal-300" />
                                {location}
                            </span>
                        </div>
                    </div>

                    {/* Quick CTA Actions */}
                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <Link href="/leaves" className="w-full sm:w-auto">
                            <Button className="h-11 w-full gap-2 rounded-xl border-0 bg-indigo-600 hover:bg-indigo-500 px-5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] sm:w-auto">
                                <Plus className="h-4 w-4" />
                                Request Leave
                            </Button>
                        </Link>
                        <Link href="/attendance" className="w-full sm:w-auto">
                            <Button variant="outline" className="h-11 w-full gap-2 rounded-xl border-white/20 bg-white/10 px-5 text-xs font-bold text-white transition-all hover:bg-white/20 hover:text-white sm:w-auto">
                                <Clock className="h-4 w-4 text-emerald-400" />
                                Check In / Out
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. Key Personal Metrics (KPI Cards) */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                
                {/* 1. Today's Attendance Status */}
                <Card className="group overflow-hidden rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today&apos;s Status</CardTitle>
                        <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-110 ${isPresentToday ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"}`}>
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                {isPresentToday ? (isLateToday ? "Checked In (Late)" : "Present") : "Not Clocked In"}
                            </span>
                            <span className={`inline-block h-2 w-2 rounded-full ${isPresentToday ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {todayAttendance?.checkInTime 
                                ? `Punch time: ${formatTime(todayAttendance.checkInTime)}`
                                : "Standard shift: 09:00 AM – 06:00 PM"
                            }
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Leave Balance & Requests */}
                <Card className="group overflow-hidden rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Leave Balance</CardTitle>
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl transition-transform group-hover:scale-110">
                            <Calendar className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            30 <span className="text-xs font-bold text-slate-400">Days / Yr</span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                            <span>{pendingLeavesCount} pending approval</span>
                            <Link href="/leaves" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Apply →</Link>
                        </p>
                    </CardContent>
                </Card>

                {/* 3. My Latest Payslip */}
                <Card className="group overflow-hidden rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Latest Net Salary</CardTitle>
                        <div className="p-2.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 rounded-xl transition-transform group-hover:scale-110">
                            <Receipt className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                            {latestSalary ? `AED ${Number(latestSalary.netSalary || 0).toLocaleString()}` : "Active Cycle"}
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                            <span>{latestSalary ? `${monthName(latestSalary.month)} ${latestSalary.year}` : "WPS Automated"}</span>
                            <Link href="/payroll/payslips" className="text-teal-600 dark:text-teal-400 font-bold hover:underline">Slips →</Link>
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Staff Services & Tickets */}
                <Card className="group overflow-hidden rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service Requests</CardTitle>
                        <div className="p-2.5 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-xl transition-transform group-hover:scale-110">
                            <HeartHandshake className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            {myServiceRequests.length} <span className="text-xs font-bold text-slate-400">Total</span>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                            <span>{myServiceRequests.filter(r => r.status === 'PENDING').length} awaiting decision</span>
                            <Link href="/staff-services" className="text-violet-600 dark:text-violet-400 font-bold hover:underline">Hub →</Link>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 3. Leave Balances - Circular Cards Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            Leave Balances ({new Date().getFullYear()})
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Current available and used days across your assigned leave categories
                        </p>
                    </div>
                    <Link href="/leaves">
                        <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                            All Leaves <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(() => {
                        const leaveTypesConfig: Record<string, { label: string; strokeColor: string; bgColor: string; textColor: string; icon: any }> = {
                            ANNUAL: {
                                label: "Annual Leave",
                                strokeColor: "#6366f1",
                                bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
                                textColor: "text-indigo-600 dark:text-indigo-400",
                                icon: Plane
                            },
                            SICK: {
                                label: "Sick Leave",
                                strokeColor: "#f43f5e",
                                bgColor: "bg-rose-50 dark:bg-rose-950/40",
                                textColor: "text-rose-600 dark:text-rose-400",
                                icon: HeartHandshake
                            },
                            EMERGENCY: {
                                label: "Emergency Leave",
                                strokeColor: "#f97316",
                                bgColor: "bg-orange-50 dark:bg-orange-950/40",
                                textColor: "text-orange-600 dark:text-orange-400",
                                icon: ShieldAlert
                            },
                            CASUAL: {
                                label: "Casual Leave",
                                strokeColor: "#0ea5e9",
                                bgColor: "bg-sky-50 dark:bg-sky-950/40",
                                textColor: "text-sky-600 dark:text-sky-400",
                                icon: Calendar
                            },
                            MATERNITY: {
                                label: "Maternity Leave",
                                strokeColor: "#ec4899",
                                bgColor: "bg-pink-50 dark:bg-pink-950/40",
                                textColor: "text-pink-600 dark:text-pink-400",
                                icon: Calendar
                            },
                            PATERNITY: {
                                label: "Paternity Leave",
                                strokeColor: "#3b82f6",
                                bgColor: "bg-blue-50 dark:bg-blue-950/40",
                                textColor: "text-blue-600 dark:text-blue-400",
                                icon: Calendar
                            },
                            UNPAID: {
                                label: "Unpaid Leave",
                                strokeColor: "#64748b",
                                bgColor: "bg-slate-100 dark:bg-slate-800",
                                textColor: "text-slate-600 dark:text-slate-400",
                                icon: Calendar
                            }
                        };

                        const balances = myLeaveBalances.length > 0 ? myLeaveBalances : [
                            { leaveType: "ANNUAL", totalDays: 30, usedDays: 0 },
                            { leaveType: "SICK", totalDays: 15, usedDays: 0 },
                            { leaveType: "EMERGENCY", totalDays: 5, usedDays: 0 }
                        ];

                        const radius = 28;
                        const circumference = 2 * Math.PI * radius;

                        return balances.map((b: any, idx: number) => {
                            const cfg = leaveTypesConfig[b.leaveType] || {
                                label: `${b.leaveType} Leave`,
                                strokeColor: "#8b5cf6",
                                bgColor: "bg-purple-50 dark:bg-purple-950/40",
                                textColor: "text-purple-600 dark:text-purple-400",
                                icon: Calendar
                            };
                            const total = b.totalDays || 0;
                            const used = b.usedDays || 0;
                            const available = Math.max(0, total - used);
                            const percentUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                            const strokeDashoffset = circumference - (percentUsed / 100) * circumference;
                            const IconComponent = cfg.icon;

                            return (
                                <Card key={idx} className="overflow-hidden rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                                    <CardContent className="p-4 sm:p-5">
                                        {/* Card Header with Icon & Full Title */}
                                        <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                                            <div className={`p-1.5 rounded-lg shrink-0 ${cfg.bgColor} ${cfg.textColor}`}>
                                                <IconComponent className="h-3.5 w-3.5" />
                                            </div>
                                            <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                                {cfg.label}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-3.5">
                                            {/* Circular Progress Ring */}
                                            <div className="relative flex items-center justify-center shrink-0">
                                                <svg className="h-16 w-16 transform -rotate-90">
                                                    <circle
                                                        cx="32"
                                                        cy="32"
                                                        r={radius}
                                                        stroke="currentColor"
                                                        strokeWidth="5"
                                                        className="text-slate-100 dark:text-slate-800"
                                                        fill="transparent"
                                                    />
                                                    <circle
                                                        cx="32"
                                                        cy="32"
                                                        r={radius}
                                                        stroke={cfg.strokeColor}
                                                        strokeWidth="5"
                                                        strokeDasharray={circumference}
                                                        strokeDashoffset={strokeDashoffset}
                                                        strokeLinecap="round"
                                                        fill="transparent"
                                                        className="transition-all duration-700 ease-out"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                    <span className="text-sm font-black text-slate-900 dark:text-white leading-none">
                                                        {available}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                                                        Left
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Aligned Breakdown Metrics */}
                                            <div className="min-w-0 flex-1 space-y-1.5 text-xs">
                                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                                    <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Available</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">{available} <span className="text-[10px] font-normal text-slate-400">days</span></span>
                                                </div>
                                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                                                    <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Used</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{used} <span className="text-[10px] font-normal text-slate-400">days</span></span>
                                                </div>
                                                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-slate-800">
                                                    <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Total</span>
                                                    <span className="font-semibold text-slate-500 dark:text-slate-400">{total} <span className="text-[10px] font-normal text-slate-400">days</span></span>
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

            {/* 4. Self-Service Quick Action Hub (6 Action Cards) */}
            <div className="space-y-3">
                <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                    Self-Service Quick Actions
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    
                    {/* Action 1: Leaves */}
                    <Link href="/leaves" className="group">
                        <div className="h-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform mb-3">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-between">
                                    <span>Apply Leave</span>
                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Annual & sick leaves</p>
                            </div>
                        </div>
                    </Link>

                    {/* Action 2: Attendance */}
                    <Link href="/attendance" className="group">
                        <div className="h-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform mb-3">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-between">
                                    <span>Attendance</span>
                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Punch log & shifts</p>
                            </div>
                        </div>
                    </Link>

                    {/* Action 3: Payslips */}
                    <Link href="/payroll/payslips" className="group">
                        <div className="h-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                            <div className="h-9 w-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform mb-3">
                                <Receipt className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 flex items-center justify-between">
                                    <span>My Payslips</span>
                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Salary breakdown & PDF</p>
                            </div>
                        </div>
                    </Link>

                    {/* Action 4: Staff Services */}
                    <Link href="/staff-services" className="group">
                        <div className="h-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                            <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform mb-3">
                                <HeartHandshake className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 flex items-center justify-between">
                                    <span>Staff Services</span>
                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Claims, loans & tickets</p>
                            </div>
                        </div>
                    </Link>

                    {/* Action 5: Letters & NOC */}
                    <Link href="/letters" className="group">
                        <div className="h-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                            <div className="h-9 w-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform mb-3">
                                <FileText className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 flex items-center justify-between">
                                    <span>Certificates</span>
                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Salary cert & NOC</p>
                            </div>
                        </div>
                    </Link>

                    {/* Action 6: My Profile */}
                    <Link href={employee?.id ? `/employees/${employee.id}` : "/account"} className="group">
                        <div className="h-full bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                            <div className="h-9 w-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform mb-3">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-between">
                                    <span>My Profile</span>
                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">Details & ID records</p>
                            </div>
                        </div>
                    </Link>

                </div>
            </div>

            {/* 4. Two-Column Operational Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Card: My Recent Attendance */}
                <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Recent Attendance Punches</CardTitle>
                        </div>
                        <Link href="/attendance" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            Full Log →
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentAttendance.length === 0 ? (
                            <div className="py-12 px-6 text-center">
                                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No attendance records yet</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Your daily punch times and hours will appear here.</p>
                                <Link href="/attendance">
                                    <Button size="sm" className="mt-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 rounded-xl">
                                        Check In Now
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {recentAttendance.slice(0, 5).map((r) => (
                                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                {formatDate(r.date)}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                In: {formatTime(r.checkInTime)} · Out: {formatTime(r.checkOutTime)}
                                            </p>
                                        </div>
                                        <Badge className={`text-[10px] font-bold ${r.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                                            {r.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Card: My Recent Leave Requests & Services */}
                <Card className="rounded-3xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <CalendarCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">My Recent Requests</CardTitle>
                        </div>
                        <Link href="/leaves" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                            All Requests →
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {myLeaves.length === 0 && myServiceRequests.length === 0 ? (
                            <div className="py-12 px-6 text-center">
                                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No active requests</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">You have no pending leave or staff service requests.</p>
                                <Link href="/leaves">
                                    <Button size="sm" className="mt-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 rounded-xl">
                                        Apply for Leave
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {myLeaves.slice(0, 3).map((l) => (
                                    <div key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                Leave: {l.type || "Annual Leave"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {formatDate(l.startDate)} - {formatDate(l.endDate)} ({l.days || 1} days)
                                            </p>
                                        </div>
                                        <Badge className={`text-[10px] font-bold ${l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : l.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                                            {l.status}
                                        </Badge>
                                    </div>
                                ))}

                                {myServiceRequests.slice(0, 3).map((s) => (
                                    <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                                                Service: {s.category?.name || "Staff Request"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                Submitted: {formatDate(s.createdAt)}
                                            </p>
                                        </div>
                                        <Badge className={`text-[10px] font-bold ${s.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : s.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                                            {s.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

        </div>
    );
}
