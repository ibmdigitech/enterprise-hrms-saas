"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
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
  Calendar,
  DollarSign,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SuperAdminWorkforceAnalytics } from "@/components/super-admin/SuperAdminWorkforceAnalytics";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    recentAuditLogs: Array<{
      id: string;
      action: string;
      actorEmail: string | null;
      outcome: string;
      createdAt: string | Date;
    }>;
  };
  totalTenants?: number;
  activeTenants?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function DashboardClient({ metrics, totalTenants = 0, activeTenants = 0 }: DashboardClientProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    window.location.reload();
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8"
    >
      {/* 1. Hero Command Center Banner (Matching Main App Aesthetics) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 shadow-xl shadow-indigo-950/20 border border-indigo-900/40">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-1 text-xs font-bold text-indigo-100 backdrop-blur-md">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span>Multi-Tenant Cloud Control Plane</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Super Admin <span className="text-indigo-200">Command Center</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Real-time multi-tenant telemetry: global tenant health, total managed workforce, live MRR billing, and platform security.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/super-admin/companies/new">
              <Button className="h-11 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-md">
                <Building2 className="h-4 w-4" />
                Add New Company
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-11 px-4 rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/20 font-bold text-xs gap-2 backdrop-blur-md"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              <span>Refresh Telemetry</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Executive PerformX-Style Multi-Tenant Analytics Engine */}
      <motion.div variants={sectionVariants}>
        <SuperAdminWorkforceAnalytics
          totalTenants={totalTenants || metrics.totalTenants}
          activeTenants={activeTenants || metrics.activeTenants}
          totalEmployees={metrics.totalEmployees}
          mrr={metrics.mrr}
          arr={metrics.arr}
          securityEventsCount={metrics.recentAuditEvents}
          platformHealthPct={99.8}
        />
      </motion.div>

      {/* 3. Operational Infrastructure Grid & Security Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cloud Infrastructure & Database Status (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Tenant Topology</CardTitle>
                    <CardDescription className="text-xs">Database isolation & tenancy model</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">Healthy</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Dedicated Database Tenants</span>
                <span className="font-black text-slate-900 dark:text-white">{metrics.dedicatedDbTenants} Organizations</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Shared Multi-Tenant Shards</span>
                <span className="font-black text-slate-900 dark:text-white">{metrics.sharedDbTenants} Organizations</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Total Companies Managed</span>
                <span className="font-black text-slate-900 dark:text-white">{metrics.totalCompanies} Entities</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Total Operational Departments</span>
                <span className="font-black text-slate-900 dark:text-white">{metrics.totalDepartments} Divisions</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/super-admin/plans" className="block">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/40 transition-all group shadow-xs">
                <Layers className="h-5 w-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Subscription Plans</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Tiers, pricing & AI tokens</p>
              </div>
            </Link>
            <Link href="/super-admin/tickets" className="block">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/40 transition-all group shadow-xs">
                <Activity className="h-5 w-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Support Queue</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Customer tickets & SLA</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Security Audit Events (7 Cols) */}
        <div className="lg:col-span-7">
          <Card className="rounded-3xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Security & Audit Event Stream</CardTitle>
                    <CardDescription className="text-xs">Real-time governance & access events across all tenants</CardDescription>
                  </div>
                </div>
                <Link href="/super-admin/audit" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  View All Logs <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Event Action</th>
                      <th className="py-2.5 px-3">Initiated By</th>
                      <th className="py-2.5 px-3">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {metrics.recentAuditLogs && metrics.recentAuditLogs.slice(0, 6).map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {format(new Date(log.createdAt), "MMM dd, HH:mm")}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {log.action ? log.action.replace(/_/g, ' ') : "SYSTEM EVENT"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 truncate max-w-[140px]">
                          {log.actorEmail || "SYSTEM_DAEMON"}
                        </td>
                        <td className="py-2.5 px-3">
                          {log.outcome === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> ALLOWED
                            </span>
                          ) : log.outcome === "DENIED" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" /> DENIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                              <XCircle className="h-3 w-3" /> BLOCKED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!metrics.recentAuditLogs || metrics.recentAuditLogs.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 text-xs italic">
                          No recent security events recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
