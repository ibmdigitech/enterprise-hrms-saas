"use client";

import Link from "next/link";
import { 
  Building2, Users, Briefcase, CheckCircle2, AlertCircle, 
  ArrowRight, Shield, Layers, FileText, Activity, Clock 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { 
  ManagerViewData, 
  HrViewData, 
  CompanyAdminViewData, 
  PlatformAdminViewData 
} from "./types";

interface RoleExtensionPanelsProps {
  userRole: string;
  managerData?: ManagerViewData | null;
  hrData?: HrViewData | null;
  companyAdminData?: CompanyAdminViewData | null;
  platformAdminData?: PlatformAdminViewData | null;
}

export function RoleExtensionPanels({
  userRole,
  managerData,
  hrData,
  companyAdminData,
  platformAdminData,
}: RoleExtensionPanelsProps) {
  // 1. Manager Oversight Section
  if (userRole === "MANAGER" && managerData && managerData.teamSize > 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-0 text-[10px] font-black uppercase tracking-wider">
                Manager Workspace
              </Badge>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Team Supervision & Pending Approvals
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Review direct reports' attendance, leaves, and departmental service submissions.
            </p>
          </div>
          <Link
            href="/dashboard/approvals"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors self-start sm:self-auto shadow-sm"
          >
            Open Approvals Queue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Manager KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Direct Reports</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{managerData.teamSize}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{managerData.teamPresentToday} present today</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Leaves</span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{managerData.pendingLeaveApprovals}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Awaiting your sign-off</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team Letter Requests</span>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{managerData.pendingLetterApprovals}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Certificates & NOCs</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staff Services</span>
            <p className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{managerData.pendingServiceRequests}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">General team requests</p>
          </div>
        </div>

        {/* Team List Snapshot */}
        <div className="border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50/60 dark:bg-slate-950/40 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between">
            <span>Team Members</span>
            <span>Today's Status</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {managerData.teamMembers.slice(0, 5).map((m) => (
              <div key={m.id} className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{m.name}</span>
                  <span className="text-slate-400 ml-2">({m.designation})</span>
                </div>
                <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider ${
                  m.status === "PRESENT" ? "border-emerald-300 text-emerald-600" :
                  m.status === "LATE" ? "border-amber-300 text-amber-600" :
                  "border-slate-300 text-slate-500"
                }`}>
                  {m.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. HR Admin Oversight Section
  if ((userRole === "HR" || userRole === "ADMIN") && hrData) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-0 text-[10px] font-black uppercase tracking-wider">
                HR Operations Centre
              </Badge>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Workforce Compliance & Service Governance
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage organization-wide reviews, document expiries, and letter dispatch.
            </p>
          </div>
          <Link
            href="/dashboard/approvals"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors self-start sm:self-auto shadow-sm"
          >
            Review Approvals Center <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* HR Operations Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{hrData.totalCompanyEmployees}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Active employees</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending HR Reviews</span>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{hrData.pendingHrReviews}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Leaves & staff tickets</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Letter Generation Queue</span>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{hrData.lettersQueueCount}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Official templates awaiting PDF</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visa Expiries (30 Days)</span>
            <p className={`text-2xl font-black mt-1 ${hrData.expiringVisas30Days > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
              {hrData.expiringVisas30Days}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Renewal required</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Company Admin Overview
  if (userRole === "COMPANY_ADMIN" && companyAdminData) {
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 border-0 text-[10px] font-black uppercase tracking-wider">
                Tenant Administration
              </Badge>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {companyAdminData.companyName} &bull; Subscription & Modules
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {companyAdminData.tenantName} organization tier: <strong className="text-slate-700 dark:text-slate-300">{companyAdminData.subscriptionPlan}</strong>
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors self-start sm:self-auto shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            Manage Company Settings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Company Admin Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Seat Utilization</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {companyAdminData.seatUsage.used} / {companyAdminData.seatUsage.max}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {Math.round((companyAdminData.seatUsage.used / companyAdminData.seatUsage.max) * 100)}% capacity allocated
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subscribed HRMS Modules</span>
            <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
              {companyAdminData.activeModulesCount} Active
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              of {companyAdminData.totalModulesCount} catalog modules
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subscription Status</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-xl font-black text-slate-900 dark:text-white">{companyAdminData.subscriptionStatus}</p>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Continuous auto-renewal enabled</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Platform Super Admin Control Plane Overview (if rendered)
  if (userRole === "SUPER_ADMIN" && platformAdminData) {
    return (
      <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-slate-950 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-900/30">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-600 text-white border-0 text-[10px] font-black uppercase tracking-wider">
                Platform Control Plane
              </Badge>
              <h3 className="text-lg font-bold text-white">
                Multi-Tenant Commercial SaaS Operations
              </h3>
            </div>
            <p className="text-xs text-indigo-200/70 font-medium mt-0.5">
              Live telemetry for global companies, database isolation, and module revenue.
            </p>
          </div>
          <Link
            href="/super-admin/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors self-start sm:self-auto shadow-md shadow-indigo-600/30"
          >
            Launch Super Admin Portal <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tenants</span>
            <p className="text-2xl font-black text-white mt-1">{platformAdminData.totalTenants}</p>
            <p className="text-[11px] text-emerald-400 font-medium mt-0.5">{platformAdminData.activeTenants} active organizations</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Companies</span>
            <p className="text-2xl font-black text-white mt-1">{platformAdminData.totalCompanies}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{platformAdminData.totalEmployees} total users</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Module Marketplace</span>
            <p className="text-2xl font-black text-indigo-400 mt-1">{platformAdminData.totalModulesCount}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Monetizable packages</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-900/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Support Desk</span>
            <p className="text-2xl font-black text-amber-400 mt-1">{platformAdminData.activeSupportTickets}</p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tickets in resolution</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

