"use client";

import { useState } from "react";
import { 
  FileText, DollarSign, CheckCircle2, Clock, AlertTriangle, 
  Search, ChevronLeft, ChevronRight, ArrowDownLeft, Download, Plus, Loader2 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { generateInvoicePdf } from "@/lib/billing/generate-invoice-pdf";
import { createBillingInvoiceAction } from "./billing-actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

  // New Invoice Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState(
    initialData.tenants?.[0]?.id || ""
  );
  const [invoiceAmount, setInvoiceAmount] = useState(750);
  const [invoiceNotes, setInvoiceNotes] = useState("Platform Subscription & Core Entitlement");
  const [invoiceStatus, setInvoiceStatus] = useState("PAID");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (search) params.set("search", search);
    if (status) params.set("status", status);

    router.push(`/super-admin/billing?${params.toString()}`);
  };

  const handleDownloadInvoice = (inv: any) => {
    try {
      generateInvoicePdf({
        invoiceNumber: inv.invoiceNumber,
        tenantName: inv.tenant?.name || "Customer Organization",
        tenantSlug: inv.tenant?.slug,
        billingPeriodStart: inv.billingPeriodStart,
        billingPeriodEnd: inv.billingPeriodEnd,
        amount: inv.amount,
        taxAmount: inv.taxAmount,
        totalAmount: inv.totalAmount,
        currency: inv.currency || "AED",
        status: inv.status,
        dueDate: inv.dueDate,
        paidAt: inv.paidAt,
        paymentMethod: inv.paymentMethod || "CARD",
        notes: inv.notes,
      });
      toast.success(`Generated official PDF for invoice ${inv.invoiceNumber}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate PDF.");
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      toast.error("Please select a customer company.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createBillingInvoiceAction({
        tenantId: selectedTenantId,
        amount: invoiceAmount,
        notes: invoiceNotes,
        status: invoiceStatus,
      });

      if (res.success) {
        toast.success(`Invoice ${res.invoice.invoiceNumber} created successfully!`);
        setIsCreateOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice.");
    } finally {
      setIsSubmitting(false);
    }
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

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" /> Issue Company Invoice
        </button>
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
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80 font-mono text-xs">
              {initialData.invoices.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{inv.invoiceNumber}</td>
                  <td className="py-3 px-4 font-sans font-medium text-foreground">
                    {inv.tenant?.name || "Customer Company"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-sans">
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
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(inv)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 text-xs font-sans font-semibold transition-all"
                    >
                      <Download className="h-3 w-3" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
              {initialData.invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground font-sans">
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

      {/* Manual Issue Invoice Modal */}
      {isCreateOpen && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md bg-card border-border text-foreground p-6">
            <DialogHeader className="pb-3 border-b border-border">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" /> Issue Subscription / Module Invoice
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Generate an official UAE VAT tax invoice and record the transaction for a customer organization.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateInvoice} className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Target Company / Organization
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  {initialData.tenants?.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Net Amount (AED before VAT)
                </label>
                <input
                  type="number"
                  required
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Total with 5% VAT: <b>{(invoiceAmount * 1.05).toLocaleString()} AED</b>
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Invoice Notes / Line Item Description
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Payment Status
                </label>
                <select
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="PAID">PAID (Settled Immediately)</option>
                  <option value="PENDING">PENDING (Awaiting Payment)</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-foreground bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Generate & Record Invoice
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
