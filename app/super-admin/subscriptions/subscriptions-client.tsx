"use client";

import { useState, useTransition } from "react";
import { CreditCard, Search, Building2, CheckCircle, Ban, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { updateSubscriptionStatusAction } from "./subscriptions-actions";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface SubscriptionsClientProps {
  initialData: any;
  initialParams: {
    page: number;
    search: string;
    status: string;
    planTier: string;
  };
}

export function SubscriptionsClient({ initialData, initialParams }: SubscriptionsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialParams.search);
  const [status, setStatus] = useState(initialParams.status);
  const [planTier, setPlanTier] = useState(initialParams.planTier);

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (planTier) params.set("planTier", planTier);

    router.push(`/super-admin/subscriptions?${params.toString()}`);
  };

  const handleStatusChange = (subId: string, newStatus: string) => {
    startTransition(async () => {
      await updateSubscriptionStatusAction(subId, newStatus);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-indigo-400" /> Active Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time subscriber state, billing periods, usage consumption against plan quotas, and renewal lifecycle.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-card/90 border border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tenant name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={planTier}
          onChange={(e) => setPlanTier(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Tiers</option>
          <option value="STARTER">STARTER</option>
          <option value="GROWTH">GROWTH</option>
          <option value="ENTERPRISE">ENTERPRISE</option>
          <option value="TRIAL">TRIAL</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="TRIAL">TRIAL</option>
          <option value="PAST_DUE">PAST_DUE</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <button
          onClick={() => applyFilters(1)}
          disabled={isPending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-lg text-sm font-medium transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-card/90 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Tier / Plan</th>
                <th className="py-3 px-4">Billing Cycle</th>
                <th className="py-3 px-4">Staff Utilization</th>
                <th className="py-3 px-4">Period End</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80 text-xs">
              {initialData.subscriptions.map((sub: any) => {
                const currentStaff = sub.tenant?._count?.employees || 0;
                const maxStaff = sub.maxEmployees || 50;
                const percent = Math.min(100, Math.round((currentStaff / maxStaff) * 100));

                return (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{sub.tenant?.name || "Unnamed Tenant"}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{sub.tenant?.slug}.hrms-saas.com</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold font-mono text-[11px]">
                        {sub.planTier}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {sub.billingCycle || "MONTHLY"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              percent > 90 ? "bg-rose-500" : percent > 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          {currentStaff} / {maxStaff} ({percent}%)
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {sub.currentPeriodEnd
                        ? format(new Date(sub.currentPeriodEnd), "yyyy-MM-dd")
                        : "Ongoing"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : sub.status === "TRIAL"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={sub.status}
                        disabled={isPending}
                        onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                        className="bg-background border border-border/80 rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="TRIAL">TRIAL</option>
                        <option value="PAST_DUE">PAST_DUE</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              {initialData.subscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No subscriptions match current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-card/90 border-t border-border text-xs text-muted-foreground">
            <div>
              Page {initialData.page} of {initialData.totalPages} ({initialData.total} records)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={initialData.page <= 1 || isPending}
                onClick={() => applyFilters(initialData.page - 1)}
                className="p-1 rounded bg-muted hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={initialData.page >= initialData.totalPages || isPending}
                onClick={() => applyFilters(initialData.page + 1)}
                className="p-1 rounded bg-muted hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

