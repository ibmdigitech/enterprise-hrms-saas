"use client";

import React, { useState } from "react";
import { PlatformDashboardMetrics } from "./dashboard-actions";
import { cn } from "@/lib/utils";
import {
    Building2,
    Users,
    DollarSign,
    TrendingUp,
    Database,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Activity,
    CreditCard,
    FileText,
    Briefcase,
    Shield,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    ExternalLink,
    BarChart3,
    Zap,
    Server,
    ShieldAlert,
} from "lucide-react";

interface DashboardClientProps {
    metrics: PlatformDashboardMetrics;
}

export function DashboardClient({ metrics }: DashboardClientProps) {
    const [activeTab, setActiveTab] = useState<"overview" | "tenants" | "revenue" | "hr" | "security">("overview");

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-AE", {
            style: "currency",
            currency: "AED",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat("en-AE").format(num);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            case "TRIAL": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
            case "SUSPENDED": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
            case "CANCELLED": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
            case "ARCHIVED": return "text-slate-400 bg-slate-500/10 border-slate-500/20";
            default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
        }
    };

    const getOutcomeColor = (outcome: string) => {
        switch (outcome) {
            case "SUCCESS": return "text-emerald-400";
            case "DENIED": return "text-rose-400";
            case "ERROR": return "text-amber-400";
            default: return "text-slate-400";
        }
    };

    type TabId = "overview" | "tenants" | "revenue" | "hr" | "security";

    const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "tenants", label: "Tenants", icon: Building2 },
        { id: "revenue", label: "Revenue", icon: DollarSign },
        { id: "hr", label: "HR Analytics", icon: Users },
        { id: "security", label: "Security", icon: Shield },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-2 border-b border-slate-800">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                isActive
                                    ? "border-blue-500 text-blue-400 bg-blue-500/5 rounded-t-lg"
                                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-slate-500")} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="space-y-6 animate-fade-in">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        <MetricCard
                            icon={Building2}
                            iconColor="blue"
                            label="Total Organizations"
                            value={formatNumber(metrics.totalTenants)}
                            subtitle={`${metrics.activeTenants} active • ${metrics.trialTenants} trial`}
                        />
                        <MetricCard
                            icon={Users}
                            iconColor="emerald"
                            label="Managed Workforce"
                            value={formatNumber(metrics.totalEmployees)}
                            subtitle={`${metrics.totalUsers} platform users`}
                        />
                        <MetricCard
                            icon={DollarSign}
                            iconColor="emerald"
                            label="Monthly Recurring Revenue"
                            value={formatCurrency(metrics.mrr)}
                            subtitle={`ARR: ${formatCurrency(metrics.arr)}`}
                            trend={{ value: "+12.5%", positive: true }}
                        />
                        <MetricCard
                            icon={Database}
                            iconColor="indigo"
                            label="Database Isolation"
                            value={`${metrics.dedicatedDbTenants} Dedicated`}
                            subtitle={`${metrics.sharedDbTenants} Shared • ${metrics.totalTenants} total`}
                        />
                        <MetricCard
                            icon={CreditCard}
                            iconColor="purple"
                            label="Collected Revenue"
                            value={formatCurrency(metrics.totalCollected)}
                            subtitle={`Pending: ${formatCurrency(metrics.pendingAmount)}`}
                        />
                        <MetricCard
                            icon={AlertTriangle}
                            iconColor={metrics.overdueInvoices > 0 || metrics.failedPayments > 0 ? "rose" : "emerald"}
                            label="System Alerts"
                            value={metrics.overdueInvoices + metrics.failedPayments}
                            subtitle={metrics.overdueInvoices > 0 ? `${metrics.overdueInvoices} overdue invoices` : "All systems healthy"}
                        />
                    </div>

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            icon={Briefcase}
                            iconColor="blue"
                            label="Companies"
                            value={formatNumber(metrics.totalCompanies)}
                        />
                        <MetricCard
                            icon={Building2}
                            iconColor="indigo"
                            label="Locations"
                            value={formatNumber(metrics.totalLocations)}
                        />
                        <MetricCard
                            icon={Users}
                            iconColor="purple"
                            label="Departments"
                            value={formatNumber(metrics.totalDepartments)}
                        />
                        <MetricCard
                            icon={Activity}
                            iconColor="amber"
                            label="Active Payroll Runs"
                            value={formatNumber(metrics.activePayrollRuns)}
                            subtitle={`${metrics.totalPayrollRuns} total runs`}
                        />
                    </div>

                    {/* Plan Distribution & Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Plan Distribution</h3>
                                <span className="text-xs text-slate-400">{metrics.planDistribution.length} tiers</span>
                            </div>
                            <div className="space-y-3">
                                {metrics.planDistribution.map((plan) => (
                                    <div key={plan.planTier} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                                            <span className="text-sm font-medium text-white capitalize">{plan.planTier.toLowerCase()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{plan.count}</span>
                                            <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all"
                                                    style={{ width: `${(plan.count / metrics.totalTenants) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {metrics.planDistribution.length === 0 && (
                                    <p className="text-slate-500 text-center py-4">No tenants yet</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Recent Security Events</h3>
                                <span className="text-xs text-slate-400">{metrics.recentAuditEvents} events</span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {metrics.recentAuditLogs.length === 0 ? (
                                    <p className="text-slate-500 text-center py-4">No recent events</p>
                                ) : (
                                    metrics.recentAuditLogs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={cn("font-mono text-xs px-2 py-0.5 rounded bg-slate-800", getOutcomeColor(log.outcome))}>
                                                    {log.outcome}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-white truncate">{log.action}</p>
                                                    <p className="text-xs text-slate-500">{log.actorEmail || "System"}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* HR Metrics Summary */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Platform HR Activity</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <HRMetricCard
                                icon={FileText}
                                label="Leave Requests"
                                total={metrics.totalLeaveRequests}
                                pending={metrics.pendingLeaveRequests}
                                color="blue"
                            />
                            <HRMetricCard
                                icon={Activity}
                                label="Payroll Runs"
                                total={metrics.totalPayrollRuns}
                                pending={metrics.activePayrollRuns}
                                color="emerald"
                            />
                            <HRMetricCard
                                icon={Briefcase}
                                label="Job Requisitions"
                                total={metrics.activeJobRequisitions}
                                pending={metrics.totalRecruitmentApplications}
                                color="purple"
                            />
                            <HRMetricCard
                                icon={ShieldAlert}
                                label="Security Events"
                                total={metrics.recentAuditEvents}
                                pending={metrics.failedPayments + metrics.overdueInvoices}
                                color="amber"
                            />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "tenants" && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">All Organizations</h3>
                            <span className="text-xs text-slate-400">{metrics.totalTenants} total</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3.5">Organization</th>
                                        <th className="px-6 py-3.5">Status</th>
                                        <th className="px-6 py-3.5">Plan</th>
                                        <th className="px-6 py-3.5">Database</th>
                                        <th className="px-6 py-3.5">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {metrics.recentTenants.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{tenant.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{tenant.slug}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", getStatusColor(tenant.status))}>
                                                    {tenant.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-300">
                                                {tenant.subscription?.planTier || "TRIAL"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                                                    tenant.subscription ? "text-emerald-400 bg-emerald-500/10" : "text-blue-400 bg-blue-500/10"
                                                )}>
                                                    {tenant.subscription ? "Dedicated" : "Shared"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                {new Date(tenant.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "revenue" && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <RevenueCard
                            icon={TrendingUp}
                            label="MRR"
                            value={formatCurrency(metrics.mrr)}
                            subtitle="Monthly Recurring Revenue"
                            color="emerald"
                        />
                        <RevenueCard
                            icon={ArrowUpRight}
                            label="ARR"
                            value={formatCurrency(metrics.arr)}
                            subtitle="Annual Recurring Revenue"
                            color="blue"
                        />
                        <RevenueCard
                            icon={CreditCard}
                            label="Total Collected"
                            value={formatCurrency(metrics.totalCollected)}
                            subtitle="All-time revenue"
                            color="purple"
                        />
                        <RevenueCard
                            icon={Clock}
                            label="Outstanding"
                            value={formatCurrency(metrics.pendingAmount + metrics.overdueAmount)}
                            subtitle={`${formatCurrency(metrics.pendingAmount)} pending • ${formatCurrency(metrics.overdueAmount)} overdue`}
                            color="amber"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Revenue by Plan Tier</h3>
                            <div className="space-y-3">
                                {metrics.planDistribution.map((plan) => (
                                    <div key={plan.planTier} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-white capitalize">{plan.planTier.toLowerCase()}</span>
                                        <span className="text-sm font-bold text-emerald-400">{plan.count} tenants</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Billing Health</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Paid Invoices</p>
                                            <p className="text-xs text-slate-400">Successfully collected</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-emerald-400">{formatCurrency(metrics.totalCollected)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Pending Invoices</p>
                                            <p className="text-xs text-slate-400">Awaiting payment</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-amber-400">{formatCurrency(metrics.pendingAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Overdue Invoices</p>
                                            <p className="text-xs text-slate-400">Past due date</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-rose-400">{formatCurrency(metrics.overdueAmount)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                                            <XCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Failed Payments</p>
                                            <p className="text-xs text-slate-400">Transaction failures</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-rose-400">{metrics.failedPayments}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "hr" && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            icon={Users}
                            iconColor="blue"
                            label="Total Employees"
                            value={formatNumber(metrics.totalEmployees)}
                        />
                        <MetricCard
                            icon={Briefcase}
                            iconColor="indigo"
                            label="Companies"
                            value={formatNumber(metrics.totalCompanies)}
                        />
                        <MetricCard
                            icon={Building2}
                            iconColor="purple"
                            label="Locations"
                            value={formatNumber(metrics.totalLocations)}
                        />
                        <MetricCard
                            icon={Users}
                            iconColor="amber"
                            label="Departments"
                            value={formatNumber(metrics.totalDepartments)}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Leave Management</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Total Requests</p>
                                            <p className="text-xs text-slate-400">All time</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-white">{formatNumber(metrics.totalLeaveRequests)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Pending Approval</p>
                                            <p className="text-xs text-slate-400">Requires action</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-amber-400">{formatNumber(metrics.pendingLeaveRequests)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Approval Rate</p>
                                            <p className="text-xs text-slate-400">Estimated</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-emerald-400">
                                        {metrics.totalLeaveRequests > 0
                                            ? `${Math.round(((metrics.totalLeaveRequests - metrics.pendingLeaveRequests) / metrics.totalLeaveRequests) * 100)}%`
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Payroll & Recruitment</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Total Payroll Runs</p>
                                            <p className="text-xs text-slate-400">All periods</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-white">{formatNumber(metrics.totalPayrollRuns)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Active Payroll Runs</p>
                                            <p className="text-xs text-slate-400">In progress</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-blue-400">{formatNumber(metrics.activePayrollRuns)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Active Job Requisitions</p>
                                            <p className="text-xs text-slate-400">Open positions</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-purple-400">{formatNumber(metrics.activeJobRequisitions)}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Total Applications</p>
                                            <p className="text-xs text-slate-400">All time</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-indigo-400">{formatNumber(metrics.totalRecruitmentApplications)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "security" && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            icon={ShieldAlert}
                            iconColor={metrics.recentAuditEvents > 50 ? "amber" : "emerald"}
                            label="Recent Events (24h)"
                            value={formatNumber(metrics.recentAuditEvents)}
                        />
                        <MetricCard
                            icon={XCircle}
                            iconColor={metrics.failedPayments > 0 ? "rose" : "emerald"}
                            label="Failed Payments"
                            value={formatNumber(metrics.failedPayments)}
                        />
                        <MetricCard
                            icon={AlertTriangle}
                            iconColor={metrics.overdueInvoices > 0 ? "rose" : "emerald"}
                            label="Overdue Invoices"
                            value={formatNumber(metrics.overdueInvoices)}
                        />
                        <MetricCard
                            icon={Shield}
                            iconColor="blue"
                            label="Platform Status"
                            value="Secure"
                            subtitle="All systems operational"
                        />
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Recent Security Audit Log</h3>
                            <span className="text-xs text-slate-400">Showing last {metrics.recentAuditLogs.length} events</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3.5">Action</th>
                                        <th className="px-6 py-3.5">Actor</th>
                                        <th className="px-6 py-3.5">Outcome</th>
                                        <th className="px-6 py-3.5">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {metrics.recentAuditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                                                No security audit events recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        metrics.recentAuditLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-medium">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs">
                                                    <div className="font-medium text-white">{log.actorEmail || "System"}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", getOutcomeColor(log.outcome))}>
                                                        {log.outcome === "SUCCESS" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                        {log.outcome === "DENIED" && <XCircle className="w-3.5 h-3.5" />}
                                                        {log.outcome === "ERROR" && <AlertTriangle className="w-3.5 h-3.5" />}
                                                        {log.outcome}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-400">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MetricCard({ icon: Icon, iconColor, label, value, subtitle, trend }: {
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    label: string;
    value: string | number;
    subtitle?: string;
    trend?: { value: string; positive: boolean };
}) {
    const colorMap: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
            <div className={cn("p-3 rounded-xl border", colorMap[iconColor] || colorMap.blue)}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
                <div className="text-2xl font-bold text-white mt-0.5 truncate">{value}</div>
                {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
                {trend && (
                    <div className={cn("text-xs font-medium mt-1 flex items-center gap-1", trend.positive ? "text-emerald-400" : "text-rose-400")}>
                        <span>{trend.positive ? "↑" : "↓"}</span>
                        <span>{trend.value}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function RevenueCard({ icon: Icon, label, value, subtitle, color }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    subtitle: string;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-start justify-between">
                <div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
                    <div className="text-2xl font-bold text-white mt-1">{value}</div>
                    <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
                </div>
                <div className={cn("p-3 rounded-xl border", colorMap[color] || colorMap.blue)}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}

function HRMetricCard({ icon: Icon, label, total, pending, color }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    total: number;
    pending: number;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };

    const completed = total - pending;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-xl border", colorMap[color] || colorMap.blue)}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs text-slate-400">{label}</span>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Total</span>
                    <span className="font-bold text-white">{total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Pending</span>
                    <span className="font-medium text-amber-400">{pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Completed</span>
                    <span className="font-medium text-emerald-400">{completed}</span>
                </div>
                <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Completion Rate</span>
                        <span className="font-bold text-white">{rate}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all", color === "amber" ? "bg-amber-500" : "bg-emerald-500")}
                            style={{ width: `${rate}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Import LayoutDashboard for the tab
import { LayoutDashboard } from "lucide-react";