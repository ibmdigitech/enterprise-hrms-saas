import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requirePageAnyPermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getOrganizationHierarchyData } from "@/app/lib/actions/organization";
import { OrganizationClient } from "./organization-client";
import { Building2, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrganizationPage() {
    await requirePageAnyPermission([PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE]);

    const session = await auth();
    if (!session?.user) redirect("/login");

    let data;
    try {
        data = await getOrganizationHierarchyData();
    } catch (err) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        <Building2 className="w-4 h-4" />
                        Multi-Company & Organization Architecture
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                        Corporate Structure & Entity Management
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Configure legal subsidiaries, branch worksites, and department reporting trees isolated to your tenant organization.
                    </p>
                </div>
            </div>

            <OrganizationClient data={data} />
        </div>
    );
}
