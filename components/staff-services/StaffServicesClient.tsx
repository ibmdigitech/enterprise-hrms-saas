"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, ArrowRight, Eye, ShieldAlert, Layers, ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ModernProfileWelcome } from "./ModernProfileWelcome";
import { EmployeeProfileDashboardCards } from "./EmployeeProfileDashboardCards";
import { ServiceCardsGrid } from "./ServiceCardsGrid";
import { MinimalQuickServices } from "./MinimalQuickServices";
import { UnifiedRequestTracker } from "./UnifiedRequestTracker";
import { ServiceNotificationsSidebar } from "./ServiceNotificationsSidebar";
import { RoleExtensionPanels } from "./RoleExtensionPanels";
import type { 
  EmployeeServiceProfile, 
  ServiceKpis, 
  UnifiedRequestItem, 
  QuickServiceCardDef,
  ManagerViewData,
  HrViewData,
  CompanyAdminViewData,
  PlatformAdminViewData
} from "./types";

interface StaffServicesClientProps {
  userRole: string;
  isSuperAdmin: boolean;
  profile: EmployeeServiceProfile | null;
  kpis: ServiceKpis | null;
  quickCards: QuickServiceCardDef[];
  requests: UnifiedRequestItem[];
  notifications: any[];
  managerData?: ManagerViewData | null;
  hrData?: HrViewData | null;
  companyAdminData?: CompanyAdminViewData | null;
  platformAdminData?: PlatformAdminViewData | null;
}

export function StaffServicesClient({
  userRole,
  isSuperAdmin,
  profile,
  kpis,
  quickCards,
  requests,
  notifications,
  managerData,
  hrData,
  companyAdminData,
  platformAdminData,
}: StaffServicesClientProps) {
  // If Super Admin accesses /staff-services, provide default platform administration with optional Preview
  const [superAdminMode, setSuperAdminMode] = useState<"platform" | "preview">(
    isSuperAdmin ? "platform" : "preview"
  );

  const displayName = profile ? profile.firstName : (userRole === "SUPER_ADMIN" ? "Super Admin" : "Colleague");
  const leaveDays = kpis ? kpis.remainingLeaves : 24;
  const payslipVal = kpis?.netSalary ? kpis.netSalary : "14,000";

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* ── SUPER ADMIN SESSION SWITCHER BANNER ────────────────────────────────── */}
      {isSuperAdmin && (
        <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/40 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  Platform Architecture Guard
                </span>
                <Badge variant="outline" className="text-[10px] font-bold border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300">
                  Super Admin Session
                </Badge>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Staff Services is dedicated to enterprise employees. You can manage platform infrastructure or preview the employee experience.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => setSuperAdminMode("platform")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                superAdminMode === "platform"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              Platform Administration
            </button>
            <button
              onClick={() => setSuperAdminMode("preview")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                superAdminMode === "preview"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> Preview Employee Hub
            </button>
          </div>
        </div>
      )}

      {/* ── SUPER ADMIN PLATFORM EXPERIENCE (When in Platform Mode) ──────────── */}
      {isSuperAdmin && superAdminMode === "platform" && platformAdminData && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-3">
                  <ShieldCheck className="h-3.5 w-3.5" /> Master Platform Operations
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Commercial SaaS Multi-Tenant Control
                </h1>
                <p className="text-sm text-slate-400 font-medium max-w-2xl mt-1 leading-relaxed">
                  Platform administration plane for tenant isolation, subscription plans, module entitlements, and billing cycles.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Link
                  href="/super-admin/dashboard"
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
                >
                  Super Admin Command Center <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/super-admin/modules"
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-2"
                >
                  <Layers className="h-4 w-4" /> Module Marketplace
                </Link>
              </div>
            </div>
          </div>

          {/* Platform KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Tenants</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1.5">{platformAdminData.totalTenants}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">{platformAdminData.activeTenants} active deployments</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Companies</span>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1.5">{platformAdminData.totalCompanies}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{platformAdminData.totalUsers} registered users</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Module Marketplace</span>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1.5">{platformAdminData.totalModulesCount}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Configurable modules</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Support Desk</span>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1.5">{platformAdminData.activeSupportTickets}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Tickets in progress</p>
            </div>
          </div>
        </div>
      )}

      {/* ── MODERN EMPLOYEE PORTAL EXPERIENCE ─────────────────────────────────── */}
      {(!isSuperAdmin || superAdminMode === "preview") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Content Column (Col 1-9) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* 1. Header Profile Welcome Banner */}
            <ModernProfileWelcome
              name={displayName}
              completionPercentage={profile?.completionPercentage ?? 85}
              leaveBalanceDays={leaveDays}
              upcomingHoliday={{ name: "National Day", dateStr: "Dec 2" }}
              latestPayslipAmount={payslipVal}
              currency="AED"
            />

            {/* 2. Core 4 Pastel KPI Cards (Leave balance, Attendance, Latest payslip, My requests) */}
            <EmployeeProfileDashboardCards
              kpis={kpis ?? {
                totalLeaves: 30,
                usedLeaves: 6,
                remainingLeaves: 24,
                presencePct: 100,
                lateCount: 0,
                pendingRequestsCount: 3,
                unreadNotificationsCount: 2,
                netSalary: 14000,
                currency: "AED",
              }}
              attendanceStatus="Present"
              latestPayslipPeriod="Available"
              pendingRequestsCount={kpis?.pendingRequestsCount ?? requests.filter(r => r.status.toLowerCase().includes("pending") || r.status.toLowerCase().includes("review")).length ?? 3}
            />

            {/* 3. Employee Quick Services Cards Grid (Leave, Payslips, Letters, Loans, Certificates, Travel) */}
            <MinimalQuickServices />

            {/* 4. Top Tier Specialized Service Cards (Training Requests, Grievances & Support, General HR Requests) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickCards.slice(9, 12).map((card) => (
                <div key={card.id}>
                  <ServiceCardsGrid cards={[card]} />
                </div>
              ))}
            </div>

            {/* 5. Role-Based Extension Panels (Manager, HR Admin, Company Admin) */}
            <RoleExtensionPanels
              userRole={userRole}
              managerData={managerData}
              hrData={hrData}
              companyAdminData={companyAdminData}
              platformAdminData={platformAdminData}
            />

            {/* 6. Central Request Tracking Centre */}
            <UnifiedRequestTracker requests={requests} />
          </div>

          {/* Right Sidebar Column (Col 10-12) */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <ServiceNotificationsSidebar notifications={notifications} />
          </div>

        </div>
      )}

    </div>
  );
}
