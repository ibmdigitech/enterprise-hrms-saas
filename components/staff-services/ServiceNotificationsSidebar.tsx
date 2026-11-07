"use client";

import Link from "next/link";
import { Bell, FileText, ChevronRight, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

interface ServiceNotificationsSidebarProps {
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type?: string;
    createdAt: Date | string;
    link?: string | null;
  }>;
}

export function ServiceNotificationsSidebar({ notifications }: ServiceNotificationsSidebarProps) {
  // If empty, provide standard feed placeholders
  const displayItems = notifications.length > 0 ? notifications.slice(0, 5) : [
    {
      id: "demo-1",
      title: "Request updated",
      message: "Request updated today.",
      createdAt: new Date(),
      link: "/requests",
    },
    {
      id: "demo-2",
      title: "Payslip Generated",
      message: "Monthly payslip is AED 14,000",
      createdAt: new Date(),
      link: "/payroll",
    },
    {
      id: "demo-3",
      title: "Request updated",
      message: "Request updated to an employees.",
      createdAt: new Date(),
      link: "/requests",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
          Recent Service<br />Notifications & Alerts
        </h3>
        <Link 
          href="/notifications" 
          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          title="View all notifications"
        >
          <Bell className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {displayItems.map((item) => (
          <Link
            key={item.id}
            href={item.link || "/notifications"}
            className="group flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/50 dark:bg-slate-950/40 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 transition-all duration-200"
          >
            <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              {item.title.toLowerCase().includes("payslip") ? (
                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              ) : (
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {item.title}
                </p>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {item.message}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

