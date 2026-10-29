"use client";

import { motion, stagger } from "framer-motion";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor: string;
  bgGradient: string;
  trend?: "up" | "down" | "neutral";
  description?: string;
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  bgGradient,
  trend = "neutral",
  description,
  loading = false,
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800/50 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/10",
        "group"
      )}
    >
      {/* Gradient Border Top */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", bgGradient)} />

      {/* Background Glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10"
        style={{ background: iconColor }}
      />

      <div className="relative flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{title}</p>
            {description && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 truncate">{description}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              "bg-white/5 dark:bg-slate-800/50 border border-white/10 dark:border-slate-700/50",
              iconColor
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>

        {/* Value */}
        <div className="flex-1 flex items-end justify-between mb-4">
          <div>
            {loading ? (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-10 w-48 bg-slate-700/50 rounded-lg animate-pulse"
              />
            ) : (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
                className="text-3xl font-bold text-white tabular-nums"
              >
                {value}
              </motion.span>
            )}
          </div>
          {change !== undefined && !loading && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold",
                trend === "up"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : trend === "down"
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
              )}
            >
              {trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : trend === "down" ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
              <span>{change >= 0 ? "+" : ""}{change}%</span>
              {changeLabel && <span className="text-xs opacity-70">{changeLabel}</span>}
            </motion.div>
          )}
        </div>

        {/* Sparkline Placeholder */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="h-16 w-full"
        >
          <canvas
            className="w-full h-full opacity-50"
            width={300}
            height={64}
            aria-hidden="true"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}

export function StatCard({ label, value, icon: Icon, color, loading = false }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative rounded-xl p-5 bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 dark:border-slate-800/50 transition-all hover:border-indigo-500/30 group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          {loading ? (
            <motion.div className="mt-2 h-8 w-24 bg-slate-700/50 rounded animate-pulse" />
          ) : (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="text-2xl font-bold text-white"
            >
              {value}
            </motion.span>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export const kpiCards = [
  {
    title: "Total Organizations",
    value: "2,847",
    change: 12.5,
    changeLabel: "vs last month",
    icon: Building2,
    iconColor: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500 to-cyan-500",
    trend: "up" as const,
    description: "Active tenants across platform",
  },
  {
    title: "Active Employees",
    value: "156,234",
    change: 8.2,
    changeLabel: "vs last month",
    icon: Users,
    iconColor: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500 to-teal-500",
    trend: "up" as const,
    description: "Total workforce across all tenants",
  },
  {
    title: "Monthly Recurring Revenue",
    value: "$2.4M",
    change: 15.3,
    changeLabel: "vs last month",
    icon: CreditCard,
    iconColor: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500 to-purple-500",
    trend: "up" as const,
    description: "Platform MRR from subscriptions",
  },
  {
    title: "System Uptime",
    value: "99.97%",
    change: -0.02,
    changeLabel: "vs target",
    icon: Activity,
    iconColor: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-500 to-orange-500",
    trend: "down" as const,
    description: "Platform availability SLA",
  },
];

export const statCards = [
  { label: "Active Tenants", value: "2,156", icon: Building2, color: "bg-blue-500/20 text-blue-400" },
  { label: "Trial Tenants", value: "423", icon: Clock, color: "bg-amber-500/20 text-amber-400" },
  { label: "Suspended", value: "18", icon: ShieldCheck, color: "bg-rose-500/20 text-rose-400" },
  { label: "Dedicated DBs", value: "892", icon: Database, color: "bg-violet-500/20 text-violet-400" },
  { label: "Open Tickets", value: "23", icon: TicketCheck, color: "bg-orange-500/20 text-orange-400" },
  { label: "Active Modules", value: "12", icon: Package, color: "bg-indigo-500/20 text-indigo-400" },
];