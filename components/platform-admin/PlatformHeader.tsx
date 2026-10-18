"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, LayoutDashboard, CreditCard, Layers, Activity, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformHeaderProps {
    totalTenants?: number;
    activeTenants?: number;
}

export function PlatformHeader({ totalTenants, activeTenants }: PlatformHeaderProps) {
    const pathname = usePathname();

    const navTabs = [
        {
            label: "Command Center",
            href: "/platform-admin/dashboard",
            icon: LayoutDashboard,
            exact: true,
        },
        {
            label: "Tenants & Infrastructure",
            href: "/platform-admin",
            icon: Building2,
            exact: true,
        },
        {
            label: "Global Billing & Invoices",
            href: "/platform-admin/billing",
            icon: CreditCard,
        },
        {
            label: "Subscription Plans",
            href: "/platform-admin/plans",
            icon: Layers,
        },
        {
            label: "Platform Security Logs",
            href: "/platform-admin/audit",
            icon: Activity,
        },
    ];

    return (
        <div className="border-b border-slate-800 bg-slate-950 px-8 pt-8 pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                        <ShieldAlert className="w-4 h-4 text-blue-400 animate-pulse" />
                        Platform Control Plane
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
                        SaaS Multi-Tenant Operations
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Manage global organizations, database-per-tenant isolation, subscription tiers, and platform revenue.
                    </p>
                </div>
                {totalTenants !== undefined && (
                    <div className="flex items-center gap-3">
                        <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                            <span className="font-semibold text-emerald-400">{activeTenants}</span> active / <span className="font-semibold text-white">{totalTenants}</span> total organizations
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                {navTabs.map((tab) => {
                    const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                isActive
                                    ? "border-blue-500 text-blue-400 bg-blue-500/5 rounded-t-lg"
                                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-slate-500")} />
                            {tab.label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
