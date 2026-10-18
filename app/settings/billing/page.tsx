import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requirePageAnyPermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getTenantBillingData } from "@/lib/billing/tenant-billing";
import { BillingPortalClient } from "./billing-portal-client";
import { CreditCard, Shield } from "lucide-react";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TenantBillingPage() {
    await requirePageAnyPermission([PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_MANAGE]);

    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    // Resolve tenantId for current session
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            memberships: {
                where: { status: "ACTIVE" },
                take: 1,
            },
            employee: true,
        },
    });

    const activeTenantId = user?.memberships[0]?.tenantId || user?.employee?.tenantId;
    if (!activeTenantId) {
        redirect("/dashboard");
    }

    let billingData;
    try {
        billingData = await getTenantBillingData(activeTenantId);
    } catch (err) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        <CreditCard className="w-4 h-4" />
                        Subscription & Invoicing Center
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                        Plans, Quotas & Payment History
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Manage your organization&apos;s subscription tier, track capacity usage quotas, and download official UAE VAT receipts.
                    </p>
                </div>
            </div>

            <BillingPortalClient data={billingData} />
        </div>
    );
}
