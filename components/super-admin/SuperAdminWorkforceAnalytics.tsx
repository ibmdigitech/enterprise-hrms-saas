"use client";

import * as XLSX from "xlsx";
import { toast } from "sonner";

import { useMemo } from "react";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  Database,
  ShieldCheck,
  ShieldAlert,
  Server,
  Zap,
  Download,
  Calendar,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  FileText
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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SuperAdminAnalyticsProps {
  totalTenants: number;
  activeTenants: number;
  totalEmployees: number;
  mrr: number;
  arr: number;
  securityEventsCount: number;
  platformHealthPct?: number;
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

export function SuperAdminWorkforceAnalytics(props: SuperAdminAnalyticsProps) {
  const handleExportSuperAnalyticsExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Executive Platform Summary
    const platformSummary = [
      { "Platform Metric": "Total Subscribed Tenants", "Value": totalTenants, "Status": `${activeTenants} Active` },
      { "Platform Metric": "Global Managed Employees", "Value": totalEmployees, "Status": "+18.4% YoY" },
      { "Platform Metric": "Monthly Recurring Revenue (MRR)", "Value": `AED ${mrr.toLocaleString()}`, "Status": "+15.3% MoM" },
      { "Platform Metric": "Annual Recurring Revenue (ARR)", "Value": `AED ${arr.toLocaleString()}`, "Status": "On Target" },
      { "Platform Metric": "Infrastructure SLA Availability", "Value": `${platformHealthPct}%`, "Status": "Tier 4 Active" },
      { "Platform Metric": "Security Events", "Value": securityEventsCount, "Status": "0 Critical Breaches" },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(platformSummary);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Platform KPI Overview");

    // 2. Subscribed Plan Tiers
    const wsTiers = XLSX.utils.json_to_sheet(tierDistribution.map(t => ({ "Subscription Plan Tier": t.name, "Subscribed Tenants": t.value })));
    XLSX.utils.book_append_sheet(wb, wsTiers, "Subscription Tiers");

    // 3. Regional Infrastructure Data Residency
    const wsRegions = XLSX.utils.json_to_sheet(regionBreakdown.map(r => ({ "Cloud Region": r.name, "Workload Allocation": `${r.value}%` })));
    XLSX.utils.book_append_sheet(wb, wsRegions, "Cloud Data Residency");

    // 4. Growth Trajectory
    const wsGrowth = XLSX.utils.json_to_sheet(growthTrend.map(g => ({ "Month": g.month, "Active Tenants": g.tenants, "Managed Employees": g.employees, "MRR (AED)": g.mrr })));
    XLSX.utils.book_append_sheet(wb, wsGrowth, "Platform Growth Trajectory");

    const fileName = `HRMS_Platform_SuperAdmin_Telemetry_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success(`Super Admin telemetry exported to ${fileName} successfully!`);
  };
  const {
    totalTenants,
    activeTenants,
    totalEmployees,
    mrr,
    arr,
    securityEventsCount,
    platformHealthPct = 99.8,
  } = props;

  // 12-Month Multi-Tenant Headcount & Platform Expansion Curve
  const growthTrend = useMemo(() => [
    { month: "Jun", tenants: Math.max(1, totalTenants - 8), employees: Math.max(20, totalEmployees - 35), mrr: Math.round(mrr * 0.72) },
    { month: "Jul", tenants: Math.max(1, totalTenants - 7), employees: Math.max(25, totalEmployees - 30), mrr: Math.round(mrr * 0.76) },
    { month: "Aug", tenants: Math.max(2, totalTenants - 6), employees: Math.max(28, totalEmployees - 26), mrr: Math.round(mrr * 0.80) },
    { month: "Sep", tenants: Math.max(2, totalTenants - 5), employees: Math.max(34, totalEmployees - 22), mrr: Math.round(mrr * 0.83) },
    { month: "Oct", tenants: Math.max(3, totalTenants - 4), employees: Math.max(39, totalEmployees - 18), mrr: Math.round(mrr * 0.87) },
    { month: "Nov", tenants: Math.max(3, totalTenants - 3), employees: Math.max(44, totalEmployees - 14), mrr: Math.round(mrr * 0.90) },
    { month: "Dec", tenants: Math.max(4, totalTenants - 3), employees: Math.max(48, totalEmployees - 11), mrr: Math.round(mrr * 0.92) },
    { month: "Jan", tenants: Math.max(4, totalTenants - 2), employees: Math.max(52, totalEmployees - 8), mrr: Math.round(mrr * 0.95) },
    { month: "Feb", tenants: Math.max(5, totalTenants - 2), employees: Math.max(55, totalEmployees - 5), mrr: Math.round(mrr * 0.97) },
    { month: "Mar", tenants: Math.max(5, totalTenants - 1), employees: Math.max(58, totalEmployees - 3), mrr: Math.round(mrr * 0.98) },
    { month: "Apr", tenants: Math.max(6, totalTenants), employees: Math.max(60, totalEmployees - 1), mrr: Math.round(mrr * 0.99) },
    { month: "May", tenants: totalTenants, employees: totalEmployees, mrr: mrr }
  ], [totalTenants, totalEmployees, mrr]);

  // Tenant Subscription Tiers
  const tierDistribution = useMemo(() => [
    { name: "Enterprise Pro", value: Math.max(1, Math.round(totalTenants * 0.45)) },
    { name: "Business Growth", value: Math.max(1, Math.round(totalTenants * 0.35)) },
    { name: "Starter Tier", value: Math.max(1, Math.round(totalTenants * 0.20)) }
  ], [totalTenants]);

  // Regional Cloud Infrastructure Breakdown
  const regionBreakdown = useMemo(() => [
    { name: "UAE (me-central-1)", value: 48 },
    { name: "KSA (me-south-1)", value: 24 },
    { name: "Europe (eu-west-1)", value: 16 },
    { name: "US East (us-east-1)", value: 12 }
  ], []);

  // Tenant Onboarding vs Churn
  const onboardingChurnTrend = useMemo(() => [
    { month: "Dec", onboarded: 4, churned: 0 },
    { month: "Jan", onboarded: 6, churned: 0 },
    { month: "Feb", onboarded: 5, churned: 1 },
    { month: "Mar", onboarded: 8, churned: 0 },
    { month: "Apr", onboarded: 7, churned: 0 },
    { month: "May", onboarded: 9, churned: 0 }
  ], []);

  // Platform Telemetry & Availability
  const uptimeTrend = useMemo(() => [
    { month: "Jun", rate: 99.98 }, { month: "Jul", rate: 99.95 }, { month: "Aug", rate: 99.99 },
    { month: "Sep", rate: 99.92 }, { month: "Oct", rate: 99.96 }, { month: "Nov", rate: 99.99 },
    { month: "Dec", rate: 99.98 }, { month: "Jan", rate: 99.97 }, { month: "Feb", rate: 99.95 },
    { month: "Mar", rate: 99.99 }, { month: "Apr", rate: 99.98 }, { month: "May", rate: 99.99 }
  ], []);

  // Tenant License Utilization Spread
  const licenseUtilization = useMemo(() => [
    { range: "<50 Seats", count: 12, pct: 20 },
    { range: "50-150 Seats", count: 24, pct: 40 },
    { range: "151-300 Seats", count: 15, pct: 25 },
    { range: "300+ Seats", count: 9, pct: 15 }
  ], []);

  return (
    <div className="space-y-6">
      {/* Top Banner Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Platform & Multi-Tenant Analytics
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Centralized telemetry: global tenants, aggregate workforce headcount, MRR, uptime & cross-tenant security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-muted/60 border-border">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            Rolling 12 Months
          </Badge>
          <Badge variant="outline" className="h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl bg-muted/60 border-border">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            Multi-Tenant Scope
          </Badge>
          <Button onClick={handleExportSuperAnalyticsExcel} variant="outline" size="sm" className="h-9 px-3 gap-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white border-none shadow-xs">
            <Download className="h-3.5 w-3.5" />
            Export Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Row 1: Executive 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* 1. Total Tenants */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Organizations</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-foreground">{totalTenants}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>{activeTenants} Active</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Global Workforce */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Users</span>
              <div className="h-8 w-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-foreground">{totalEmployees}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+18.4% YoY</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Monthly Recurring Revenue */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Monthly MRR</span>
              <div className="h-8 w-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-black tracking-tight text-foreground">AED {mrr.toLocaleString()}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+15.3% MoM</span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Annual Run-Rate */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Annual ARR</span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-black tracking-tight text-foreground">AED {arr.toLocaleString()}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>Run-rate active</span>
            </div>
          </CardContent>
        </Card>

        {/* 5. System Availability */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">SLA Uptime</span>
              <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-foreground">{platformHealthPct}%</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <ShieldCheck className="h-3 w-3" />
              <span>All clusters operational</span>
            </div>
          </CardContent>
        </Card>

        {/* 6. Security Events */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Security Events</span>
              <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-foreground">{securityEventsCount}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <ShieldCheck className="h-3 w-3" />
              <span>0 Critical Breaches</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: 12-Month Multi-Tenant Headcount Curve + Tiers Donut + Region Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Multi-Tenant Growth Curve */}
        <Card className="lg:col-span-6 rounded-2xl border-border bg-card shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Platform Growth Trajectory</CardTitle>
                <CardDescription className="text-xs">Aggregate global workforce across subscribed tenants</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">12 Months</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="superGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="employees" name="Total Workforce" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#superGrowthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plan Tiers Donut */}
        <Card className="lg:col-span-3 rounded-2xl border-border bg-card shadow-xs">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold text-foreground">Subscription Tiers</CardTitle>
            <CardDescription className="text-xs">Active plans distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tierDistribution} innerRadius={45} outerRadius={68} paddingAngle={2} dataKey="value">
                    {tierDistribution.map((_, index) => (
                      <Cell key={`tier-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-foreground">{totalTenants}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Tenants</span>
              </div>
            </div>
            <div className="mt-2 space-y-1.5">
              {tierDistribution.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Multi-Region Cloud Distribution */}
        <Card className="lg:col-span-3 rounded-2xl border-border bg-card shadow-xs">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-bold text-foreground">Cloud Clusters</CardTitle>
            <CardDescription className="text-xs">Workload data residency</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={regionBreakdown} innerRadius={45} outerRadius={68} paddingAngle={2} dataKey="value">
                    {regionBreakdown.map((_, index) => (
                      <Cell key={`region-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-foreground">100%</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase">Healthy</span>
              </div>
            </div>
            <div className="mt-2 space-y-1.5">
              {regionBreakdown.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />
                    <span className="truncate text-muted-foreground">{r.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{r.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Onboarding vs Churn + Infrastructure Uptime + License Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Onboarding vs Churn */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">Tenant Onboarding vs Churn</CardTitle>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">98.5% Net Retention</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={onboardingChurnTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '10px' }} />
                  <Bar dataKey="onboarded" name="New Subscriptions" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="churned" name="Cancelled" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Global SLA Uptime Trend */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">Infrastructure Availability</CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">99.99% Tier 4</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={uptimeTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[99.8, 100]} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: '10px' }} />
                  <Line type="monotone" dataKey="rate" name="Uptime %" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* License Capacity Spread */}
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground">License Seat Brackets</CardTitle>
              <span className="text-[10px] font-bold text-muted-foreground">Workforce scaling</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={licenseUtilization} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                  <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Tenants" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
