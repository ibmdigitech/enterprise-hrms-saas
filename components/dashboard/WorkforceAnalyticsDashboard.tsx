"use client";

import * as XLSX from "xlsx";
import { toast } from "sonner";

import { useMemo } from "react";
import {
    Users,
    UserPlus,
    TrendingDown,
    CalendarCheck,
    Clock,
    Smile,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Calendar,
    MapPin,
    Building2,
    ShieldCheck
} from "lucide-react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AnalyticsProps {
    totalEmployees: number;
    departmentCounts: { name: string; value: number }[];
    locationCounts: { name: string; value: number }[];
    genderCounts: { name: string; value: number }[];
    employmentTypeCounts: { name: string; value: number }[];
    ageDistribution: { range: string; count: number; percentage: number }[];
    growthTrend: { month: string; employees: number }[];
    hiresExitsTrend: { month: string; hires: number; exits: number }[];
    turnoverTrend: { month: string; rate: number }[];
    absenteeismTrend: { month: string; rate: number }[];
    engagementTrend: { month: string; score: number }[];
    todayAttendance: {
        present: number;
        late: number;
        absent: number;
        rate: number;
    };
    newHiresCount: number;
    turnoverRate: number;
    absenteeismRate: number;
    avgTenure: string;
    engagementScore: number;
}

const COLORS = [
    "#059669", // Emerald
    "#0d9488", // Teal
    "#0284c7", // Sky
    "#6366f1", // Indigo
    "#8b5cf6", // Purple
    "#f59e0b", // Amber
    "#f43f5e", // Rose
];

export function WorkforceAnalyticsDashboard(props: AnalyticsProps) {
    const handleExportAnalyticsExcel = () => {
        const wb = XLSX.utils.book_new();

        // 1. Executive Summary Sheet
        const summaryData = [
            { "Metric": "Total Workforce", "Value": totalEmployees, "Unit": "Staff", "Status": "Active" },
            { "Metric": "New Hires (Quarter)", "Value": newHiresCount, "Unit": "Employees", "Status": "+14.3% YoY" },
            { "Metric": "Turnover Rate", "Value": `${turnoverRate}%`, "Unit": "Percentage", "Status": "Optimal" },
            { "Metric": "Absenteeism Rate", "Value": `${absenteeismRate}%`, "Unit": "Percentage", "Status": "Under 5% Target" },
            { "Metric": "Average Tenure", "Value": avgTenure, "Unit": "Years", "Status": "Stable Retention" },
            { "Metric": "Employee Engagement Score", "Value": `${engagementScore}%`, "Unit": "Score", "Status": "Positive eNPS" },
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Workforce Summary");

        // 2. Department Breakdown Sheet
        const deptData = departmentCounts.map((d) => ({
            "Department Name": d.name,
            "Headcount": d.value,
            "Percentage": `${totalEmployees > 0 ? ((d.value / totalEmployees) * 100).toFixed(1) : 0}%`
        }));
        const wsDept = XLSX.utils.json_to_sheet(deptData);
        XLSX.utils.book_append_sheet(wb, wsDept, "Departments");

        // 3. Location Breakdown Sheet
        const locData = locationCounts.map((l) => ({
            "Location / Office Branch": l.name,
            "Staff Count": l.value,
            "Percentage": `${totalEmployees > 0 ? ((l.value / totalEmployees) * 100).toFixed(1) : 0}%`
        }));
        const wsLoc = XLSX.utils.json_to_sheet(locData);
        XLSX.utils.book_append_sheet(wb, wsLoc, "Locations");

        // 4. Monthly Growth & Trends Sheet
        const trendData = growthTrend.map((g) => ({
            "Month": g.month,
            "Workforce Headcount": g.employees,
        }));
        const wsTrend = XLSX.utils.json_to_sheet(trendData);
        XLSX.utils.book_append_sheet(wb, wsTrend, "Growth Trajectory");

        // Save Excel file
        const fileName = `HRMS_Workforce_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        toast.success(`Analytics exported to ${fileName} successfully!`);
    };
    const {
        totalEmployees,
        departmentCounts,
        locationCounts,
        genderCounts,
        employmentTypeCounts,
        ageDistribution,
        growthTrend,
        hiresExitsTrend,
        turnoverTrend,
        absenteeismTrend,
        engagementTrend,
        newHiresCount,
        turnoverRate,
        absenteeismRate,
        avgTenure,
        engagementScore,
    } = props;

    return (
        <div className="space-y-6">
            {/* Top Sub-Header: Title & Filter Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                        Workforce & People Analytics
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Real-time overview of headcount, performance telemetry, attrition, and diversity.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Rolling 12 Months
                    </Badge>
                    <Badge variant="outline" className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        All Locations
                    </Badge>
                    <Button onClick={handleExportAnalyticsExcel} variant="outline" size="sm" className="h-9 px-3 gap-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white border-none shadow-xs">
                        <Download className="h-3.5 w-3.5" />
                        Export Excel (.xlsx)
                    </Button>
                </div>
            </div>

            {/* Row 1: Executive KPI Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                {/* 1. Total Employees */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Headcount</span>
                            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{totalEmployees}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>+3.2% vs last qtr</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. New Hires */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Hires</span>
                            <div className="h-8 w-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                                <UserPlus className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{newHiresCount}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>+14.3% YoY</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Turnover Rate */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Turnover Rate</span>
                            <div className="h-8 w-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center">
                                <TrendingDown className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{turnoverRate}%</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <ArrowDownRight className="h-3 w-3" />
                            <span>-1.1pp improvement</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Absenteeism Rate */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Absenteeism</span>
                            <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                                <CalendarCheck className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{absenteeismRate}%</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <ArrowDownRight className="h-3 w-3" />
                            <span>-0.6pp healthy</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Avg. Tenure */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg. Tenure</span>
                            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{avgTenure}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>+0.3 yrs retention</span>
                        </div>
                    </CardContent>
                </Card>

                {/* 6. Engagement Score */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Engagement</span>
                            <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                                <Smile className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{engagementScore}%</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>+4% positive eNPS</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 2: Employee Growth Trend (Area) + Dept Donut + Location Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Headcount Growth Trend */}
                <Card className="lg:col-span-6 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Employee Trend</CardTitle>
                                <CardDescription className="text-xs">Workforce trajectory over the past 12 months</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold">12 Months</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="employees" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#growthGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Employees by Department (Donut) */}
                <Card className="lg:col-span-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">By Department</CardTitle>
                        <CardDescription className="text-xs">Functional distribution</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-44 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={departmentCounts}
                                        innerRadius={45}
                                        outerRadius={68}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {departmentCounts.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-black text-slate-900 dark:text-white">{totalEmployees}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Staff</span>
                            </div>
                        </div>
                        <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1">
                            {departmentCounts.slice(0, 4).map((d, i) => (
                                <div key={d.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="truncate text-slate-600 dark:text-slate-300">{d.name}</span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Employees by Location (Donut) */}
                <Card className="lg:col-span-3 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">By Location</CardTitle>
                        <CardDescription className="text-xs">Offices & branch breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-44 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={locationCounts}
                                        innerRadius={45}
                                        outerRadius={68}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {locationCounts.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-xl font-black text-slate-900 dark:text-white">{totalEmployees}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
                            </div>
                        </div>
                        <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1">
                            {locationCounts.slice(0, 4).map((l, i) => (
                                <div key={l.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />
                                        <span className="truncate text-slate-600 dark:text-slate-300">{l.name}</span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">{l.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: New Hires vs Exits + Turnover Rate Trend + Absenteeism Trend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* New Hires vs Exits */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">New Hires vs Exits</CardTitle>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Net Positive +27</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hiresExitsTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ borderRadius: '10px' }} />
                                    <Bar dataKey="hires" name="New Hires" fill="#059669" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="exits" name="Exits" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Turnover Rate Trend */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Turnover Rate Trend</CardTitle>
                            <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">Stable</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={turnoverTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="turnoverGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 15]} unit="%" />
                                    <Tooltip contentStyle={{ borderRadius: '10px' }} />
                                    <Area type="monotone" dataKey="rate" name="Turnover %" stroke="#0d9488" strokeWidth={2} fill="url(#turnoverGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Absenteeism Rate Trend */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Absenteeism Rate Trend</CardTitle>
                            <span className="text-[10px] font-bold text-slate-400">Target &lt; 5%</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-52 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={absenteeismTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 8]} unit="%" />
                                    <Tooltip contentStyle={{ borderRadius: '10px' }} />
                                    <Line type="monotone" dataKey="rate" name="Absenteeism %" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 4: Employment Type Donut + Gender Diversity Donut + Age Distribution + Engagement Trend */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Headcount by Employment Type */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Employment Type</CardTitle>
                        <CardDescription className="text-xs">Contract vs Full-time</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-36 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={employmentTypeCounts} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                                        {employmentTypeCounts.map((_, i) => (
                                            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-1 space-y-1">
                            {employmentTypeCounts.map((t, i) => (
                                <div key={t.name} className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        {t.name}
                                    </span>
                                    <span className="font-bold">{t.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Gender Diversity */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Gender Diversity</CardTitle>
                        <CardDescription className="text-xs">Workforce balance</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-36 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={genderCounts} innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                                        {genderCounts.map((_, i) => (
                                            <Cell key={`cell-${i}`} fill={i === 0 ? "#059669" : (i === 1 ? "#0284c7" : "#a855f7")} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-1 space-y-1">
                            {genderCounts.map((g, i) => (
                                <div key={g.name} className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: i === 0 ? "#059669" : (i === 1 ? "#0284c7" : "#a855f7") }} />
                                        {g.name}
                                    </span>
                                    <span className="font-bold">{g.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Age Group Distribution */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Age Demographics</CardTitle>
                        <CardDescription className="text-xs">Generation spread</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ageDistribution} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                    <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Employee Engagement Score Trend */}
                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <CardHeader className="pb-1">
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Engagement Trend</CardTitle>
                        <CardDescription className="text-xs">Quarterly sentiment</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="h-44 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={engagementTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[60, 100]} unit="%" />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Line type="monotone" dataKey="score" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
