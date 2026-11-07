"use client";

import { useState, useEffect } from "react";
import { motion, stagger, type Variants } from "framer-motion";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  Database,
  ShieldCheck,
  TicketCheck,
  Package,
  Layers,
  FileText,
  PlugZap,
  Settings2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Clock,
  RefreshCw,
  ExternalLink,
  Calendar,
  DollarSign,
  Zap,
  Server,
  HardDrive,
  Headphones,
  Briefcase,
  Shield,
  TrendingUp as TrendingUpIcon,
  ChevronDown,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
  Target as TargetIcon,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KPICard, kpiCards } from "@/components/super-admin/KPICards";
import {
  ChartCard,
  MultiAreaChart,
  GroupedBarChart,
  DonutChart,
  GaugeChart,
  CHART_COLORS,
} from "@/components/super-admin/Charts";
import { format } from "date-fns";

interface DashboardClientProps {
  metrics: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    dedicatedDbTenants: number;
    sharedDbTenants: number;
    mrr: number;
    arr: number;
    totalCollected: number;
    pendingAmount: number;
    overdueAmount: number;
    totalEmployees: number;
    activeEmployees: number;
    totalUsers: number;
    totalCompanies: number;
    totalLocations: number;
    totalDepartments: number;
    planDistribution: { planTier: string; count: number }[];
    recentAuditEvents: number;
    failedPayments: number;
    overdueInvoices: number;
    totalLeaveRequests: number;
    pendingLeaveRequests: number;
    totalPayrollRuns: number;
    activePayrollRuns: number;
    totalRecruitmentApplications: number;
    activeJobRequisitions: number;
    recentTenants: any[];
    recentAuditLogs: any[];
  };
  totalTenants: number;
  activeTenants: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
};

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// ─── Compact Metric Card with Department Badge ───
interface CompactMetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  department: string;
  trend?: { value: number; label: string };
  index: number;
}

const METRIC_CARD_GRADIENT = "linear-gradient(135deg, rgba(13,148,136,0.10) 0%, rgba(148,163,184,0.06) 50%, rgba(255,255,255,0.02) 100%)";
const METRIC_CARD_BORDER = "linear-gradient(135deg, rgba(13,148,136,0.30) 0%, rgba(148,163,184,0.20) 50%, rgba(13,148,136,0.10) 100%)";

function CompactMetricCard({ label, value, icon: Icon, department, trend, index }: CompactMetricCardProps) {
  return (
    <motion.div
      key={label}
      custom={index}
      variants={itemVariants}
      whileHover={{ y: -4, scale: 1.015 }}
    >
      <div className="relative group">
        {/* Subtle gold border glow on hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"
          style={{ background: METRIC_CARD_BORDER, filter: "blur(8px)" }}
        />
        
        <div className="relative rounded-xl p-5 min-h-[180px] flex flex-col" style={{ background: METRIC_CARD_GRADIENT }}>
          <div className="relative flex flex-col h-full">
            {/* Icon at top */}
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/80 backdrop-blur-sm">
              <Icon className="h-5 w-5 text-foreground" />
            </div>

            {/* Metric value */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                  className="text-2xl font-black text-foreground tabular-nums drop-shadow-sm"
                >
                  {value}
                </motion.span>
                <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              </div>

              {/* Trend badge - unified gold/amber for all trends */}
              {trend && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="mt-2 flex items-center gap-1 self-start rounded-full border border-amber-500/20 bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-300"
                >
                  {trend.value >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span>{trend.value >= 0 ? "+" : ""}{trend.value}%</span>
                  <span className="opacity-70">{trend.label}</span>
                </motion.div>
              )}
            </div>

            {/* Department badge at bottom */}
            <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted/80 px-2.5 py-1 text-xs font-semibold text-foreground">
                {department}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/80 transition-colors hover:bg-muted">
                <ChevronRight className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Large Metric Cards for Financial Section ───
interface FinancialMetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon: React.ElementType;
  department: string;
  badge?: string;
  badgeColor?: "emerald" | "amber" | "rose";
  index: number;
}

function FinancialMetricCard({ title, value, subtitle, trend, icon: Icon, department, badge, badgeColor = "emerald", index }: FinancialMetricCardProps) {
  return (
    <motion.div key={title} custom={index} variants={itemVariants} whileHover={{ y: -4, scale: 1.015 }}>
      <div className="relative group">
        {/* Subtle gold border glow on hover */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"
          style={{ background: METRIC_CARD_BORDER, filter: "blur(8px)" }}
        />
        
        <div className="relative rounded-xl p-5 min-h-[180px] flex flex-col" style={{ background: METRIC_CARD_GRADIENT }}>
          <div className="relative flex flex-col h-full">
            {/* Icon at top */}
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted/80 backdrop-blur-sm">
              <Icon className="h-5 w-5 text-foreground" />
            </div>

            {/* Metric value */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                  className="text-2xl font-black text-foreground tabular-nums drop-shadow-sm"
                >
                  {value}
                </motion.span>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium tracking-wide uppercase">{title}</p>
                {subtitle && <p className="text-[10px] text-muted-foreground/80 mt-0.5">{subtitle}</p>}
              </div>

              {/* Trend badge - unified gold/amber for all trends */}
              {trend && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mt-2 self-start bg-amber-500/15 text-amber-700 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                >
                  {trend.value >= 0 ? <TrendingUpIcon className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span>{trend.value >= 0 ? "+" : ""}{trend.value}%</span>
                  <span className="opacity-70">{trend.label}</span>
                </motion.div>
              )}
            </div>

            {/* Department/Badge at bottom */}
            <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/80 border border-border text-xs font-semibold text-foreground">
                {department}
                {badge && <span className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase",
                  badgeColor === "emerald" && "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
                  badgeColor === "amber" && "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
                  badgeColor === "rose" && "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                )}>{badge}</span>}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/80 transition-colors hover:bg-muted">
                <ChevronRight className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardClient({ metrics, totalTenants, activeTenants }: DashboardClientProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
    window.location.reload();
  };

  // Generate sample chart data
  const generateRevenueData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, i) => ({
      name: month,
      mrr: Math.floor(metrics.mrr * (0.7 + Math.random() * 0.6)),
      arr: Math.floor(metrics.arr * (0.7 + Math.random() * 0.6)),
      newTenants: Math.floor(metrics.totalTenants / 12 * (0.5 + Math.random())),
      churnedTenants: Math.floor(metrics.totalTenants / 12 * (0.1 + Math.random() * 0.2)),
    }));
  };

  const generateTenantGrowthData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let cumulative = 0;
    return months.map((month) => {
      const newTenants = Math.floor(Math.random() * 50) + 10;
      cumulative += newTenants;
      const churned = Math.floor(Math.random() * 5);
      cumulative = Math.max(0, cumulative - churned);
      return {
        name: month,
        total: cumulative,
        new: newTenants,
        churned,
      };
    });
  };

  const generateWorkforceData = () => {
    const years = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"];
    let base = 45000;
    return years.map((year, i) => {
      const growth = Math.floor(Math.random() * 8000) + 12000;
      base += growth;
      const engaged = Math.floor(base * (0.65 + Math.random() * 0.2));
      const newHires = Math.floor(growth * 0.3);
      return {
        name: year,
        totalEmployees: base,
        engagedEmployees: engaged,
        newHires,
      };
    });
  };

  const generateFinancialData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month) => ({
      name: month,
      mrr: Math.floor(metrics.mrr * (0.8 + Math.random() * 0.4)),
      newRevenue: Math.floor(metrics.mrr * (0.1 + Math.random() * 0.15)),
      expansionRevenue: Math.floor(metrics.mrr * (0.05 + Math.random() * 0.1)),
      churnedRevenue: Math.floor(metrics.mrr * (0.02 + Math.random() * 0.05)),
    }));
  };

  const generateProjectionData = () => {
    const quarters = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027"];
    return quarters.map((q, i) => ({
      name: q,
      projected: Math.floor(metrics.mrr * 12 * (1 + i * 0.15 + Math.random() * 0.1)),
      actual: i < 2 ? Math.floor(metrics.mrr * 12 * (1 + i * 0.15)) : 0,
    }));
  };

  const revenueData = generateRevenueData();
  const tenantGrowthData = generateTenantGrowthData();
  const workforceData = generateWorkforceData();
  const financialData = generateFinancialData();
  const projectionData = generateProjectionData();

  // ─── Compact Metric Cards Data ───
  const compactMetrics = [
    { label: "Active Tenants", value: metrics.activeTenants.toLocaleString(), icon: Building2, department: "Admin", trend: { value: 12.5, label: "vs last month" } },
    { label: "Trial Tenants", value: metrics.trialTenants.toLocaleString(), icon: Zap, department: "Support", trend: { value: 8.3, label: "vs last month" } },
    { label: "Suspended", value: metrics.suspendedTenants.toLocaleString(), icon: Shield, department: "HR", trend: { value: -15.2, label: "vs last month" } },
    { label: "Dedicated DBs", value: metrics.dedicatedDbTenants.toLocaleString(), icon: HardDrive, department: "IT", trend: { value: 22.1, label: "vs last month" } },
    { label: "Open Tickets", value: metrics.recentAuditEvents.toLocaleString(), icon: Headphones, department: "Legal", trend: { value: 5.7, label: "vs last month" } },
    { label: "Active Modules", value: "12", icon: Package, department: "R&D", trend: { value: 0, label: "stable" } },
  ];

  // ─── Financial Metric Cards Data ───
  const financialMetrics = [
    { 
      title: "Monthly Recurring Revenue", 
      value: formatCurrency(metrics.mrr), 
      subtitle: "Current month", 
      trend: { value: 15.3, label: "MoM" },
      icon: DollarSign, 
      department: "Finance",
      badge: "+12.5% MoM",
      badgeColor: "emerald" as const,
    },
    { 
      title: "Annual Revenue Projection", 
      value: formatCurrency(metrics.arr), 
      subtitle: "Based on current run rate", 
      trend: { value: 18.7, label: "YoY" },
      icon: TargetIcon, 
      department: "Strategy",
      badge: "+18.7% YoY",
      badgeColor: "amber" as const,
    },
    { 
      title: "Customer Lifetime Value", 
      value: formatCurrency(Math.floor(metrics.mrr * 24 * 0.85)), 
      subtitle: "LTV:CAC ratio 4.2:1", 
      trend: { value: 8.4, label: "vs last quarter" },
      icon: Wallet, 
      department: "Sales",
      badge: "Healthy",
      badgeColor: "emerald" as const,
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-5 min-h-screen bg-background p-5 md:p-6"
    >
      {/* Header */}
      <motion.div variants={sectionVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Platform Command Center</h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl hidden sm:block">
            Real-time telemetry: health, workforce, finance, operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
              style={{ appearance: "none" }}
            >
              <option value="7d" className="bg-popover text-popover-foreground">7d</option>
              <option value="30d" className="bg-popover text-popover-foreground">30d</option>
              <option value="90d" className="bg-popover text-popover-foreground">90d</option>
              <option value="1y" className="bg-popover text-popover-foreground">1y</option>
            </select>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Live Indicator - Fixed */}
      <motion.div variants={sectionVariants} className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 w-fit text-[10px] font-medium backdrop-blur-sm">
        <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50" />
        <span>Live</span>
        <span className="px-1.5 py-0.5 rounded bg-amber-500/25 text-[9px] font-mono text-amber-100">{format(new Date(), "HH:mm:ss")}</span>
      </motion.div>

      {/* ─── TOP ROW: 4 Large Cards ─── */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Card 1: Health Index - Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="group relative h-[320px] overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-ring/30"
        >
          <div className="relative flex h-full flex-col">
            {/* Header - compact */}
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 shadow-xs dark:bg-emerald-500/20 dark:text-emerald-400">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Health Index</h3>
            </div>

            {/* Gauge + Metrics - proper spacing */}
            <div className="flex min-h-0 flex-1 -translate-x-[20px] flex-col items-center justify-start gap-1 pt-1">
              <GaugeChart value={92} label="Health Index" size={170} showLabel={true} />
              <div className="-mt-1 grid w-[calc(100%+20px)] grid-cols-4 gap-2 pb-2 translate-y-[-4px]">
                <div className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-muted/80 px-1.5 py-1.5 text-center">
                  <p className="truncate text-[11px] font-black leading-none text-foreground">{metrics.activeTenants.toLocaleString()}</p>
                  <p className="text-[7px] uppercase tracking-[0.12em] text-muted-foreground">Active</p>
                </div>
                <div className="flex min-h-[52px] translate-y-[-2px] flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-muted/80 px-1.5 py-1.5 text-center">
                  <p className="truncate text-[11px] font-black leading-none text-foreground">{metrics.suspendedTenants}</p>
                  <p className="text-[7px] uppercase tracking-[0.12em] text-muted-foreground">Suspended</p>
                </div>
                <div className="flex min-h-[52px] translate-y-[-2px] flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-muted/80 px-1.5 py-1.5 text-center">
                  <p className="truncate text-[11px] font-black leading-none text-foreground">{'< 2h'}</p>
                  <p className="text-[7px] uppercase tracking-[0.12em] text-muted-foreground">Response</p>
                </div>
                <div className="flex min-h-[52px] translate-y-[-2px] flex-col items-center justify-center gap-0.5 rounded-md border border-border bg-muted/80 px-1.5 py-1.5 text-center">
                  <p className="truncate text-[11px] font-black leading-none text-foreground">99.97%</p>
                  <p className="text-[7px] uppercase tracking-[0.12em] text-muted-foreground">Uptime</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Workforce Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="group relative z-10 h-[320px] overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-ring/30"
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 shadow-xs dark:bg-teal-500/20 dark:text-teal-300">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-semibold text-foreground">Workforce Growth</h3>
              <p className="mt-0.5 text-[10px] tracking-wide text-muted-foreground">Engagement & trends</p>
            </div>
          </div>
          <div className="h-[260px]">
            <MultiAreaChart
              data={workforceData}
              keys={["totalEmployees", "engagedEmployees", "newHires"]}
              colors={["var(--color-chart-2)", "var(--color-chart-4)", "var(--color-chart-3)"]}
              labels={{ totalEmployees: "Total", engagedEmployees: "Engaged", newHires: "New Hires" }}
              height={260}
            />
          </div>
        </motion.div>

        {/* Card 3: Revenue Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="group relative h-[320px] overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-ring/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shadow-xs">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-semibold text-foreground">Revenue Analytics</h3>
              <p className="text-[10px] text-teal-200/50 mt-0.5 tracking-wide">MRR composition & drivers</p>
            </div>
          </div>
          <div className="h-[260px]">
            <GroupedBarChart
              data={financialData}
              keys={["mrr", "newRevenue", "expansionRevenue", "churnedRevenue"]}
              colors={["var(--color-chart-1)", "var(--color-chart-4)", "var(--color-chart-3)", "var(--color-chart-6)"]}
              labels={{ mrr: "Base", newRevenue: "New", expansionRevenue: "Expansion", churnedRevenue: "Churn" }}
              height={260}
            />
          </div>
        </motion.div>

        {/* Card 4: Revenue Projection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="group relative h-[320px] overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-ring/30"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 shadow-xs">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-semibold text-foreground">Revenue Projection</h3>
              <p className="text-[10px] text-teal-200/50 mt-0.5 tracking-wide">Quarterly forecast vs actuals</p>
            </div>
          </div>
          <div className="h-[260px]">
            <GroupedBarChart
              data={projectionData}
              keys={["projected", "actual"]}
              colors={["var(--color-chart-3)", "var(--color-chart-4)"]}
              labels={{ projected: "Projected", actual: "Actual" }}
              height={260}
              stacked={false}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* ─── BOTTOM ROW: 6 Compact Metric Cards ─── */}
      <motion.div variants={sectionVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {compactMetrics.map((card, index) => (
          <CompactMetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            department={card.department}
            trend={card.trend}
            index={index}
          />
        ))}
      </motion.div>

      {/* ─── FINANCIAL METRICS ROW ─── */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {financialMetrics.map((card, index) => (
          <FinancialMetricCard
            key={card.title}
            {...card}
            index={index}
          />
        ))}
      </motion.div>

      {/* ─── ADDITIONAL CHARTS ─── */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-2xl p-5 bg-card border-border shadow-xs h-[360px] group hover:border-ring/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400 shadow-xs">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-foreground">Plan Distribution</h3>
              <p className="mt-0.5 text-xs tracking-wide text-muted-foreground">Tenants by subscription tier</p>
            </div>
          </div>
          <div className="h-[300px]">
            <DonutChart
              data={[
                { name: "Enterprise", value: Math.floor(totalTenants * 0.15), color: "var(--color-chart-5)" },
                { name: "Growth", value: Math.floor(totalTenants * 0.35), color: "var(--color-chart-1)" },
                { name: "Starter", value: Math.floor(totalTenants * 0.4), color: "var(--color-chart-2)" },
                { name: "Trial", value: Math.floor(totalTenants * 0.1), color: "var(--color-chart-3)" },
              ]}
              height={320}
              innerRadius={70}
              outerRadius={100}
            />
          </div>
        </motion.div>

        {/* Module Adoption */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative rounded-2xl p-5 bg-card border-border shadow-xs h-[360px] group hover:border-ring/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 shadow-xs">
              <Package className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-foreground">Module Adoption</h3>
              <p className="mt-0.5 text-xs tracking-wide text-muted-foreground">Percentage of tenants using each module</p>
            </div>
          </div>
          <div className="h-[300px]">
            <GroupedBarChart
              data={[
                { name: "Payroll", usage: 95 },
                { name: "Attendance", usage: 88 },
                { name: "Leave", usage: 92 },
                { name: "Recruitment", usage: 65 },
                { name: "Performance", usage: 45 },
                { name: "Visa/Compliance", usage: 78 },
              ]}
              keys={["usage"]}
              colors={["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-4)", "var(--color-chart-3)", "var(--color-chart-5)", "var(--color-chart-6)"]}
              labels={{ usage: "Adoption %" }}
              height={320}
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}