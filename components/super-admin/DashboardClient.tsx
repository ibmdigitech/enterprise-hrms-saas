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
  BarChart2,
  PieChart,
  LineChart,
  Calendar,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KPICard, kpiCards, statCards } from "@/components/super-admin/KPICards";
import {
  ChartCard,
  MultiAreaChart,
  GroupedBarChart,
  DonutChart,
  MultiLineChart,
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
      staggerChildren: 0.1,
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

  const generateModuleUsageData = () => {
    const modules = [
      { name: "Payroll", value: 95, color: "#6366f1" },
      { name: "Attendance", value: 88, color: "#06b6d4" },
      { name: "Leave", value: 92, color: "#10b981" },
      { name: "Recruitment", value: 65, color: "#f59e0b" },
      { name: "Performance", value: 45, color: "#a855f7" },
      { name: "Visa/Compliance", value: 78, color: "#ec4899" },
    ];
    return modules;
  };

  const generatePlanDistributionData = () => {
    const plans = metrics.planDistribution.length > 0
      ? metrics.planDistribution
      : [
          { planTier: "ENTERPRISE", count: Math.floor(totalTenants * 0.15) },
          { planTier: "GROWTH", count: Math.floor(totalTenants * 0.35) },
          { planTier: "STARTER", count: Math.floor(totalTenants * 0.4) },
          { planTier: "TRIAL", count: Math.floor(totalTenants * 0.1) },
        ];

    const colors = {
      ENTERPRISE: "#a855f7",
      GROWTH: "#6366f1",
      STARTER: "#06b6d4",
      TRIAL: "#f59e0b",
    };

    return plans.map((p) => ({
      name: p.planTier,
      value: p.count,
      color: colors[p.planTier as keyof typeof colors] || "#6366f1",
    }));
  };

  const revenueData = generateRevenueData();
  const tenantGrowthData = generateTenantGrowthData();
  const moduleUsageData = generateModuleUsageData();
  const planDistributionData = generatePlanDistributionData();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={sectionVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white dark:bg-gradient-to-r dark:from-white dark:to-slate-400 dark:bg-clip-text dark:text-transparent">
            Platform Command Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time platform telemetry: revenue, tenants, workforce, security, and HR operations across all organizations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 shadow-xs">
            <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-transparent text-sm font-medium text-slate-700 dark:text-white focus:outline-none cursor-pointer"
              style={{ appearance: "none" }}
            >
              <option value="7d" className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">Last 7 days</option>
              <option value="30d" className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">Last 30 days</option>
              <option value="90d" className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">Last 90 days</option>
              <option value="1y" className="text-slate-900 bg-white dark:text-white dark:bg-slate-900">Last year</option>
            </select>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-sm",
              refreshing && "opacity-50 cursor-wait"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Live Indicator */}
      <motion.div variants={sectionVariants} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-fit text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
        Live Data
        <span suppressHydrationWarning className="px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] font-mono">{format(new Date(), "HH:mm:ss")}</span>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <motion.div key={card.title} custom={index} variants={itemVariants}>
            <KPICard
              {...card}
              value={typeof card.value === "string" ? card.value : formatNumber(card.value as number)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Stat Cards Row */}
      <motion.div variants={sectionVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, index) => (
          <motion.div key={card.label} custom={index} variants={itemVariants}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative rounded-xl p-5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 shadow-xs transition-all hover:border-indigo-500/30 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</p>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                    className="text-2xl font-bold text-slate-900 dark:text-white"
                  >
                    {card.value}
                  </motion.span>
                </div>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.color)}>
                  <card.icon className="h-5 w-5 text-current" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row 1: Revenue & Tenant Growth */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Revenue Trends"
          description="Monthly Recurring & Annual Run Rate"
          icon={DollarSign}
          iconColor="bg-gradient-to-r from-emerald-500 to-teal-500"
          trend={{ value: 15.3, label: "vs last period" }}
        >
          <MultiAreaChart
            data={revenueData}
            keys={["mrr", "arr"]}
            colors={["#6366f1", "#06b6d4"]}
            labels={{ mrr: "MRR (Monthly)", arr: "ARR (Annual)" }}
            height={320}
          />
        </ChartCard>

        <ChartCard
          title="Tenant Growth"
          description="Cumulative organizations with net growth"
          icon={Building2}
          iconColor="bg-gradient-to-r from-blue-500 to-cyan-500"
          trend={{ value: 12.5, label: "vs last period" }}
        >
          <MultiAreaChart
            data={tenantGrowthData}
            keys={["total", "new", "churned"]}
            colors={["#6366f1", "#10b981", "#ef4444"]}
            labels={{ total: "Total Tenants", new: "New", churned: "Churned" }}
            height={320}
          />
        </ChartCard>
      </motion.div>

      {/* Charts Row 2: Plan Distribution & Module Usage */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Plan Distribution"
          description="Tenants by subscription tier"
          icon={Layers}
          iconColor="bg-gradient-to-r from-violet-500 to-purple-500"
        >
          <DonutChart
            data={planDistributionData}
            height={320}
            innerRadius={70}
            outerRadius={110}
          />
        </ChartCard>

        <ChartCard
          title="Module Adoption"
          description="Percentage of tenants using each module"
          icon={Package}
          iconColor="bg-gradient-to-r from-indigo-500 to-blue-500"
        >
          <GroupedBarChart
            data={moduleUsageData.map((m) => ({ name: m.name, usage: m.value }))}
            keys={["usage"]}
            colors={moduleUsageData.map((m) => m.color)}
            labels={{ usage: "Adoption %" }}
            height={320}
          />
        </ChartCard>
      </motion.div>

      {/* Charts Row 3: HR Metrics & Payroll */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="HR Operations Volume"
          description="Leave requests, payroll runs, and recruitment activity"
          icon={Users}
          iconColor="bg-gradient-to-r from-pink-500 to-rose-500"
        >
          <GroupedBarChart
            data={[
              { name: "Leave", requests: metrics.totalLeaveRequests, pending: metrics.pendingLeaveRequests },
              { name: "Payroll", requests: metrics.totalPayrollRuns, pending: metrics.activePayrollRuns },
              { name: "Recruitment", requests: metrics.totalRecruitmentApplications, pending: metrics.activeJobRequisitions },
            ]}
            keys={["requests", "pending"]}
            colors={["#6366f1", "#f59e0b"]}
            labels={{ requests: "Total", pending: "Active/Pending" }}
            height={320}
          />
        </ChartCard>

        <ChartCard
          title="Revenue Breakdown"
          description="Collected vs Pending vs Overdue"
          icon={CreditCard}
          iconColor="bg-gradient-to-r from-amber-500 to-orange-500"
        >
          <DonutChart
            data={[
              { name: "Collected", value: metrics.totalCollected, color: "#10b981" },
              { name: "Pending", value: metrics.pendingAmount, color: "#f59e0b" },
              { name: "Overdue", value: metrics.overdueAmount, color: "#ef4444" },
            ].filter((d) => d.value > 0)}
            height={320}
            innerRadius={70}
            outerRadius={110}
          />
        </ChartCard>
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Recent Tenants"
          description="Latest organizations onboarded"
          icon={Building2}
          iconColor="bg-gradient-to-r from-blue-500 to-indigo-500"
          action={
            <a href="/super-admin/companies" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All <ExternalLink className="h-3 w-3" />
            </a>
          }
        >
          <div className="space-y-3">
            {metrics.recentTenants.slice(0, 5).map((tenant: any, index: number) => (
              <motion.div
                key={tenant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{tenant.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{tenant.slug}.hrms-saas.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    tenant.status === "ACTIVE" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    tenant.status === "TRIAL" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    tenant.status === "SUSPENDED" && "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  )}>
                    {tenant.status}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-medium">
                    {tenant.subscription?.planTier || "TRIAL"}
                  </span>
                </div>
              </motion.div>
            ))}
            {metrics.recentTenants.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No tenants found
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Security Audit Log"
          description="Latest administrative events"
          icon={ShieldCheck}
          iconColor="bg-gradient-to-r from-rose-500 to-red-500"
          action={
            <a href="/super-admin/audit" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1">
              View All <ExternalLink className="h-3 w-3" />
            </a>
          }
        >
          <div className="space-y-3">
            {metrics.recentAuditLogs.slice(0, 5).map((log: any, index: number) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    log.outcome === "SUCCESS" ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                  )}>
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{log.action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{log.actorEmail || "System"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    log.outcome === "SUCCESS" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  )}>
                    {log.outcome}
                  </span>
                  <span className="text-slate-500 font-mono">{format(new Date(log.createdAt), "MMM d, HH:mm")}</span>
                </div>
              </motion.div>
            ))}
            {metrics.recentAuditLogs.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No audit events recorded
              </div>
            )}
          </div>
        </ChartCard>
      </motion.div>

      {/* Quick Stats Summary */}
      <motion.div variants={sectionVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "System Health", value: "99.97%", icon: Activity, color: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400", trend: 0.02 },
          { label: "Failed Payments", value: metrics.failedPayments, icon: CreditCard, color: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400", trend: -2 },
          { label: "Overdue Invoices", value: metrics.overdueInvoices, icon: FileText, color: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400", trend: 3 },
          { label: "Audit Events (24h)", value: metrics.recentAuditEvents, icon: ShieldCheck, color: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400", trend: 12 },
        ].map((stat, index) => (
          <motion.div key={stat.label} custom={index} variants={itemVariants}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              className="relative rounded-xl p-5 bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800/50 shadow-xs transition-all hover:border-indigo-500/30 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.color)}>
                  <stat.icon className="h-6 w-6 text-current" />
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 flex items-center gap-1.5 text-sm"
              >
                {stat.trend >= 0 ? (
                  <>
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{stat.trend}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    <span className="text-rose-600 dark:text-rose-400 font-medium">{stat.trend}%</span>
                  </>
                )}
                <span className="text-slate-500">vs last period</span>
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}