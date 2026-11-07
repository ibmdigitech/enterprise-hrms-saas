"use client";

import Link from "next/link";
import { 
  Calendar, CreditCard, FileText, Award, Plane, Landmark, ArrowUpRight
} from "lucide-react";

export function MinimalQuickServices() {
  const quickItems = [
    { label: "Leave", href: "/leaves", icon: Calendar },
    { label: "Payslips", href: "/payroll", icon: CreditCard },
    { label: "Letters", href: "/letters", icon: FileText },
    { label: "Loans", href: "/loans", icon: Landmark },
    { label: "Certificates", href: "/letters", icon: Award },
    { label: "Travel", href: "/travel", icon: Plane },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
        Quick Services
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800 transition-all duration-200 shadow-2xs hover:shadow-xs group hover:-translate-y-0.5"
            >
              <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition-colors mb-2">
                <IconComponent className="h-5 w-5 transition-transform group-hover:scale-110" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
