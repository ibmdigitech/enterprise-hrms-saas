"use client";

import { useState } from "react";
import { FileText, DollarSign, CheckCircle2, Clock, AlertTriangle, Search, ChevronLeft, ChevronRight, ArrowDownLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface BillingClientProps {
  initialData: any;
  initialParams: {
    page: number;
    search: string;
    status: string;
  };
}

export function BillingClient({ initialData, initialParams }: BillingClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialParams.search);
  const [status, setStatus] = useState(initialParams.status);

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (search) params.set("search", search);
    if (status) params.set("status", status);

    router.push(`/super-admin/billing?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-7 w-7 text-indigo-400" /> Platform Invoices & Billing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global accounts receivable, payment transactions, subscription invoices, and VAT calculations.
          </p>
        </div>
      </div>

      {/* Revenue KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collected Revenue</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">
              {initialData.revenue.totalCollected.toLocaleString()} <span className="text-xs text-muted-foreground">AED</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Invoices</div>
            <div className="text-2xl font-bold text-amber-400 mt-0.5">
              {initialData.revenue.pendingAmount.toLocaleString()} <span className="text-xs text-muted-foreground">AED</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overdue Dues</div>
            <div className="text-2xl font-bold text-rose-400 mt-0.5">
              {initialData.revenue.overdueAmount.toLocaleString()} <span className="text-xs text-muted-foreground">AED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-card/90 border border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoice number or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="PAID">PAID</option>
          <option value="PENDING">PENDING</option>
          <option value="OVERDUE">OVERDUE</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <button
          onClick={() => applyFilters(1)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-lg text-sm font-medium transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-card/90 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Net Amount</th>
                <th className="py-3 px-4">Total (incl. VAT)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80 font-mono text-xs">
              {initialData.invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-sans font-medium text-foreground">
                    {inv.tenant?.name || "Tenant"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {format(new Date(inv.billingPeriodStart), "MM/dd")} -{" "}
                    {format(new Date(inv.billingPeriodEnd), "MM/dd/yyyy")}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {inv.amount.toLocaleString()} {inv.currency}
                  </td>
                  <td className="py-3 px-4 font-bold text-foreground">
                    {inv.totalAmount.toLocaleString()} {inv.currency}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        inv.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : inv.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {format(new Date(inv.dueDate), "yyyy-MM-dd")}
                  </td>
                </tr>
              ))}
              {initialData.invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground font-sans">
                    No invoices matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-card/90 border-t border-border text-xs text-muted-foreground font-sans">
            <div>
              Page {initialData.page} of {initialData.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={initialData.page <= 1}
                onClick={() => applyFilters(initialData.page - 1)}
                className="p-1 rounded bg-muted hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={initialData.page >= initialData.totalPages}
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

