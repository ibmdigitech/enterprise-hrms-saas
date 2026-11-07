import * as React from "react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Filter, UserCheck, Users, MapPin, Cpu, CalendarClock, Info, AlertCircle, Sparkles } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { redirect } from "next/navigation";
import { CheckInButton } from "@/components/attendance/CheckInButton";
import { AttendanceDownloadButton } from "@/components/attendance/AttendanceDownloadButton";
import { PresenceLogTable } from "@/components/attendance/PresenceLogTable";
import Link from "next/link";

export default async function AttendancePage({
    searchParams,
}: {
    searchParams: Promise<{ all?: string; view?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { employee: true }
    });

    if (!user) redirect("/login");

    const userRole = user.role;
    const params = await searchParams;
    const showAll = params.all === "true";
    const view = params.view || ((userRole === "ADMIN" || userRole === "HR" || userRole === "MANAGER") ? "today" : "history");

    // Fetch Attendance for today/recent
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const allActiveEmployees = await prisma.employee.findMany({
        where: { isActive: true },
        include: { shift: true },
        orderBy: { firstName: 'asc' }
    });

    const todayRecords = await prisma.attendance.findMany({
        where: {
            date: {
                gte: today,
                lt: tomorrow
            }
        },
        include: { employee: { include: { shift: true } } }
    });

    const presentToday = todayRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
    const lateToday = todayRecords.filter(r => r.status === "LATE" || r.lateMinutes > 0).length;
    const leavesToday = todayRecords.filter(r => r.status === "LEAVE").length;
    const absentToday = Math.max(0, allActiveEmployees.length - presentToday - leavesToday);

    const completedToday = todayRecords.filter(r => r.checkOut).length;
    
    let avgHours = 0;
    if (completedToday > 0) {
        const totalMs = todayRecords.reduce((acc, r) => {
            if (r.checkIn && r.checkOut) {
                return acc + (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime());
            }
            return acc;
        }, 0);
        avgHours = totalMs / (completedToday * 1000 * 60 * 60);
    }

    // Determine records to display in the main table
    let displayRecords: any[] = [];
    if (view === "today") {
        displayRecords = allActiveEmployees.map(emp => {
            const record = todayRecords.find(r => r.employeeId === emp.id);
            return {
                id: record?.id || `temp-${emp.id}`,
                employee: emp,
                date: record?.date || today,
                checkIn: record?.checkIn || null,
                checkOut: record?.checkOut || null,
                status: record?.status || "NO_RECORD",
                lateMinutes: record?.lateMinutes || 0,
                shift: emp.shift || null
            };
        });
    } else {
        if (userRole === "ADMIN" || userRole === "HR" || userRole === "MANAGER") {
            displayRecords = await prisma.attendance.findMany({
                include: { employee: { include: { shift: true } } },
                orderBy: { date: 'desc' },
                ...(showAll ? {} : { take: 25 })
            });
        } else if (user.employee) {
            displayRecords = await prisma.attendance.findMany({
                where: { employeeId: user.employee.id },
                include: { employee: { include: { shift: true } } },
                orderBy: { date: 'desc' },
                ...(showAll ? {} : { take: 15 })
            });
        }
    }

    return (
        <div className="space-y-8 p-4 md:p-8 w-full max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden border border-emerald-900/40">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

                <div className="relative z-10 min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-3">
                        <Sparkles className="h-3 w-3" /> Live Biometric & Shift Center
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-2">Attendance Hub</h1>
                    <p className="text-emerald-100/80 text-sm md:text-base font-medium max-w-xl">
                        Monitor daily presence, track shift compliance, and manage workforce availability in real-time.
                    </p>
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row gap-2.5 flex-wrap">
                    <Link href="/attendance/shifts">
                        <Button variant="secondary" className="gap-2 w-full sm:w-auto rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 border-0 backdrop-blur-md">
                            <CalendarClock className="h-4 w-4" />
                            Shift Roster
                        </Button>
                    </Link>
                    {(userRole === "ADMIN" || userRole === "HR") && (
                        <Link href="/attendance/machine-integration">
                            <Button variant="secondary" className="gap-2 w-full sm:w-auto rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 border-0 backdrop-blur-md">
                                <Cpu className="h-4 w-4" />
                                Machine Import
                            </Button>
                        </Link>
                    )}
                    {(userRole === "ADMIN" || userRole === "HR" || userRole === "MANAGER") && (
                        <AttendanceDownloadButton />
                    )}
                    <CheckInButton />
                </div>
            </div>

            {/* Quick Stats Grid with Polished Empty States */}
            <div className="grid gap-4 sm:gap-6 md:grid-cols-4">
                {/* Total Active */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-slate-800 shadow-xs rounded-3xl hover:shadow-sm transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active</CardTitle>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{allActiveEmployees.length} Staff</div>
                        <p className="text-xs font-medium text-slate-500 mt-1">Total active workforce</p>
                    </CardContent>
                </Card>

                {/* Present Today */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-slate-800 shadow-xs rounded-3xl hover:shadow-sm transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Present Today</CardTitle>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <UserCheck className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{presentToday} Present</div>
                        {presentToday === 0 ? (
                            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                <Clock className="h-3 w-3 text-slate-400" />
                                <span>No check-ins recorded yet today</span>
                            </div>
                        ) : (
                            <p className="text-xs font-medium text-emerald-600 mt-1">Live active punches</p>
                        )}
                    </CardContent>
                </Card>

                {/* Late Today */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-slate-800 shadow-xs rounded-3xl hover:shadow-sm transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Late Today</CardTitle>
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{lateToday} Late</div>
                        {lateToday === 0 ? (
                            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                                <Sparkles className="h-3 w-3" />
                                <span>Zero tardiness recorded today</span>
                            </div>
                        ) : (
                            <p className="text-xs font-medium text-amber-600 mt-1">Grace period exceeded</p>
                        )}
                    </CardContent>
                </Card>

                {/* Absent Today */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/80 dark:border-slate-800 shadow-xs rounded-3xl hover:shadow-sm transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absent Today</CardTitle>
                        <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">{absentToday} Absent</div>
                        <p className="text-xs font-medium text-rose-600 mt-1">Awaiting check-in or shift start</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Presence Log Area with Status Filter */}
                <Card className="lg:col-span-2 bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800/80 shadow-xs rounded-3xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-xl font-bold">Presence Log</CardTitle>
                                <CardDescription className="font-medium text-slate-500 mt-0.5">
                                    {view === "today" ? "Today's attendance status for all active employees" : `Recent records for ${userRole === "STAFF" ? "you" : "all employees"}`}
                                </CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                {(userRole === "ADMIN" || userRole === "HR" || userRole === "MANAGER") && (
                                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                                        <Link href={`/attendance?view=today&all=${showAll}`}>
                                            <Button variant={view === "today" ? "secondary" : "ghost"} size="sm" className="font-bold rounded-lg text-xs uppercase px-3 py-1.5 h-8">
                                                Today&#39;s Status
                                            </Button>
                                        </Link>
                                        <Link href={`/attendance?view=history&all=${showAll}`}>
                                            <Button variant={view === "history" ? "secondary" : "ghost"} size="sm" className="font-bold rounded-lg text-xs uppercase px-3 py-1.5 h-8">
                                                History Log
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                                <Link href={showAll ? `/attendance?view=${view}` : `/attendance?view=${view}&all=true`}>
                                    <Button variant="ghost" size="sm" className="text-emerald-600 font-bold hover:bg-emerald-50 h-8">
                                        {showAll ? "View Less" : "View All"}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Interactive Filterable Presence Table */}
                        <PresenceLogTable records={displayRecords} />
                    </CardContent>
                </Card>

                {/* Sidebar Info & Expanded Live Insights */}
                <Card className="bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 shadow-xs rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-bold">Attendance View</CardTitle>
                            <CalendarIcon className="h-5 w-5 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 space-y-6">
                        <Calendar
                            mode="single"
                            selected={new Date()}
                            className="rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs mx-auto bg-white dark:bg-slate-950"
                        />
                        
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 px-1">
                                <MapPin className="h-4 w-4 text-emerald-600" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Workforce Insights</h4>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-2xs">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Status</span>
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    </div>
                                    <div className="text-lg font-black text-slate-900 dark:text-white">{presentToday} Present</div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-2xs">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shift Completion</span>
                                    </div>
                                    <div className="text-lg font-black text-slate-900 dark:text-white">{completedToday} Staff Done</div>
                                </div>
                                
                                {/* Productivity with Dynamic Helper Note */}
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-md relative overflow-hidden">
                                    <div className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1 flex items-center justify-between">
                                        <span>Productivity</span>
                                        <Info className="h-3.5 w-3.5 opacity-70" />
                                    </div>
                                    <div className="text-2xl font-black tracking-tight">
                                        {avgHours.toFixed(1)} <span className="text-xs font-semibold opacity-85">Avg Hours</span>
                                    </div>
                                    <div className="mt-2.5 pt-2.5 border-t border-white/15 text-[11px] leading-relaxed text-indigo-100/80 font-medium">
                                        {completedToday > 0 
                                            ? "Calculated dynamically across completed employee punch outs."
                                            : "Averages calculate dynamically once active staff members check out."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
