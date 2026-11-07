"use client";

import Link from "next/link";
import { Calendar, Gift, Wallet } from "lucide-react";
import { motion } from "framer-motion";

interface ModernProfileWelcomeProps {
  name: string;
  completionPercentage?: number;
  leaveBalanceDays?: number;
  upcomingHoliday?: { name: string; dateStr: string };
  latestPayslipAmount?: string | number | null;
  currency?: string;
}

export function ModernProfileWelcome({
  name,
  completionPercentage = 85,
  leaveBalanceDays = 24,
  upcomingHoliday = { name: "Upcoming Holiday", dateStr: "Dec 2" },
  latestPayslipAmount = "14,000",
  currency = "AED",
}: ModernProfileWelcomeProps) {
  // SVG circular progress calculation for 85%
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className="w-full bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs backdrop-blur-md"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Left: Circular Completion Ring + Welcome Header */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Circular 85% Progress Ring */}
          <div className="relative flex items-center justify-center shrink-0 w-18 h-18">
            <svg className="w-18 h-18 -rotate-90 transform">
              <circle
                cx="36"
                cy="36"
                r={radius}
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="5.5"
                stroke="currentColor"
                fill="transparent"
              />
              <motion.circle
                cx="36"
                cy="36"
                r={radius}
                className="text-indigo-600 dark:text-indigo-500"
                strokeWidth="5.5"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-sm font-black text-slate-900 dark:text-white">
              {completionPercentage}%
            </span>
          </div>

          {/* Welcome Text + Profile completion bar */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Good Morning, {name}!
            </h1>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Profile Completion
              </span>
              <div className="w-24 sm:w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-600 rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Clean Pastel Summary Chips */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* 1. Leave Balance - Mint / Teal chip */}
          <Link
            href="/leaves"
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-teal-50/70 hover:bg-teal-50 dark:bg-teal-950/20 dark:hover:bg-teal-950/30 border border-teal-100/90 dark:border-teal-900/40 transition-all duration-200 group flex-1 sm:flex-initial min-w-[130px] hover:-translate-y-0.5"
          >
            <div className="h-9 w-9 rounded-xl bg-white dark:bg-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-2xs">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leave Balance</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {leaveBalanceDays} Days
              </span>
            </div>
          </Link>

          {/* 2. Upcoming Holiday - Warm Peach chip */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100/90 dark:border-amber-900/40 flex-1 sm:flex-initial min-w-[140px]">
            <div className="h-9 w-9 rounded-xl bg-white dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
              <Gift className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Upcoming Holiday</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {upcomingHoliday.dateStr}
              </span>
            </div>
          </div>

          {/* 3. Latest Payslip - Soft Lavender chip */}
          <Link
            href="/payroll"
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-purple-50/70 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/30 border border-purple-100/90 dark:border-purple-900/40 transition-all duration-200 group flex-1 sm:flex-initial min-w-[140px] hover:-translate-y-0.5"
          >
            <div className="h-9 w-9 rounded-xl bg-white dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-2xs">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latest Payslip</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {currency} {typeof latestPayslipAmount === "number" ? latestPayslipAmount.toLocaleString() : latestPayslipAmount || "--"}
              </span>
            </div>
          </Link>
        </div>

      </div>
    </motion.div>
  );
}
