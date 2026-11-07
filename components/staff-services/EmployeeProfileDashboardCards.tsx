"use client";

import Link from "next/link";
import { 
  Calendar, Clock, Wallet, FileText, ArrowUpRight
} from "lucide-react";
import type { ServiceKpis } from "./types";

interface EmployeeProfileDashboardCardsProps {
  kpis: ServiceKpis;
  attendanceStatus?: string;
  latestPayslipPeriod?: string;
  pendingRequestsCount?: number;
}

export function EmployeeProfileDashboardCards({
  kpis,
  attendanceStatus = "Present",
  latestPayslipPeriod = "Available",
  pendingRequestsCount = 0,
}: EmployeeProfileDashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Leave Balance - Soft Blue (Image 2 Match) */}
      <Link 
        href="/leaves"
        className="group relative p-5 sm:p-6 rounded-3xl bg-[#f0f6ff] hover:bg-[#e6f0fd] dark:bg-blue-950/30 dark:hover:bg-blue-950/45 border border-blue-100/90 dark:border-blue-900/50 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between min-h-[140px]"
      >
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 rounded-xl bg-blue-100/80 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <span className="text-[11px] font-bold text-blue-600/70 dark:text-blue-400/70 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            Apply <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Leave balance
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            {kpis.totalLeaves === 0 ? "No allocation" : `${kpis.remainingLeaves} Days`}
          </div>
        </div>
      </Link>

      {/* 2. Attendance - Soft Mint / Teal (Image 2 Match) */}
      <Link 
        href="/attendance"
        className="group relative p-5 sm:p-6 rounded-3xl bg-[#ecfdf5] hover:bg-[#d1fae5]/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/45 border border-emerald-100/90 dark:border-emerald-900/50 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between min-h-[140px]"
      >
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 rounded-xl bg-emerald-100/80 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <span className="text-[11px] font-bold text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            Logs <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Attendance
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            {attendanceStatus}
          </div>
        </div>
      </Link>

      {/* 3. Latest Payslip - Soft Lavender / Purple (Image 2 Match) */}
      <Link 
        href="/payroll"
        className="group relative p-5 sm:p-6 rounded-3xl bg-[#f5f3ff] hover:bg-[#ede9fe]/70 dark:bg-purple-950/30 dark:hover:bg-purple-950/45 border border-purple-100/90 dark:border-purple-900/50 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between min-h-[140px]"
      >
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 rounded-xl bg-purple-100/80 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <span className="text-[11px] font-bold text-purple-600/70 dark:text-purple-400/70 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            View <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Latest payslip
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1 flex items-baseline gap-1.5">
            <span>{latestPayslipPeriod}</span>
            {kpis?.netSalary && (
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                ({kpis.currency || "AED"} {kpis.netSalary})
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* 4. My Requests - Soft Peach / Amber (Image 2 Match) */}
      <Link 
        href="#requests-section"
        className="group relative p-5 sm:p-6 rounded-3xl bg-[#fff7ed] hover:bg-[#ffedd5]/70 dark:bg-amber-950/30 dark:hover:bg-amber-950/45 border border-amber-100/90 dark:border-amber-900/50 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col justify-between min-h-[140px]"
      >
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 rounded-xl bg-amber-100/80 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <span className="text-[11px] font-bold text-amber-600/70 dark:text-amber-400/70 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            Track <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            My requests
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            {pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : "3 Pending"}
          </div>
        </div>
      </Link>
    </div>
  );
}

