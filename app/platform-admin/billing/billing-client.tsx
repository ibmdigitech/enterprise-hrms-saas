"use client";

import { useState } from "react";
import {
    CreditCard,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    Plus,
    FileText,
    Receipt,
    Building2,
    Calendar,
    ArrowUpRight,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { recordManualPaymentAction, createTenantCustomInvoiceAction } from "../billing-actions";
import { toast } from "sonner";

interface BillingClientProps {
    metrics: {
        mrr: number;
        arr: number;
        totalCollected: number;
        pendingAmount: number;
        activeSubscribers: number;
        totalTenants: number;
        invoices: any[];
        transactions: any[];
    };
    tenants: Array<{ id: string; name: string; slug: string }>;
}

export function BillingClient({ metrics, tenants }: BillingClientProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [activeTab, setActiveTab] = useState<"invoices" | "transactions">("invoices");

    // Modal state for manual payment
    const [payingInvoice, setPayingInvoice] = useState<any | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state for new custom invoice
    const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState(tenants[0]?.id || "");
    const [amount, setAmount] = useState(1000);
    const [description, setDescription] = useState("");
    const [dueDateDays, setDueDateDays] = useState(14);

    const filteredInvoices = metrics.invoices.filter((inv) => {
        const matchesSearch =
            inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
            inv.tenant.name.toLowerCase().includes(search.toLowerCase()) ||
            inv.tenant.slug.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    async function handleRecordPayment(e: React.FormEvent) {
        e.preventDefault();
        if (!payingInvoice) return;

        setIsSubmitting(true);
        try {
            await recordManualPaymentAction({
                invoiceId: payingInvoice.id,
                paymentMethod,
                reference: reference.trim() || `OFFLINE_${Date.now()}`,
                notes,
            });
            toast.success(`Invoice ${payingInvoice.invoiceNumber} marked as PAID.`);
            setPayingInvoice(null);
            setReference("");
            setNotes("");
        } catch (err: any) {
            toast.error(err.message || "Failed to record payment.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCreateInvoice(e: React.FormEvent) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await createTenantCustomInvoiceAction({
                tenantId: selectedTenantId,
                amount: Number(amount),
                description: description.trim() || "Enterprise Subscription / Add-on services",
                dueDateDays: Number(dueDateDays),
            });
            toast.success(`Invoice ${res.invoiceNumber} created successfully.`);
            setIsNewInvoiceOpen(false);
            setDescription("");
        } catch (err: any) {
            toast.error(err.message || "Failed to generate invoice.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Monthly Run Rate (MRR)</div>
                        <div className="text-2xl font-bold text-emerald-400 mt-0.5">
                            {metrics.mrr.toLocaleString()} <span className="text-xs font-normal text-slate-400">AED</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                        <ArrowUpRight className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Annual Run Rate (ARR)</div>
                        <div className="text-2xl font-bold text-white mt-0.5">
                            {metrics.arr.toLocaleString()} <span className="text-xs font-normal text-slate-400">AED</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                        <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Volume Invoiced</div>
                        <div className="text-2xl font-bold text-white mt-0.5">
                            {metrics.totalCollected.toLocaleString()} <span className="text-xs font-normal text-slate-400">AED</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending / Receivables</div>
                        <div className="text-2xl font-bold text-amber-400 mt-0.5">
                            {metrics.pendingAmount.toLocaleString()} <span className="text-xs font-normal text-slate-400">AED</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar & Tab Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveTab("invoices")}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "invoices"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Tenant Invoices ({metrics.invoices.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("transactions")}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "transactions"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Payment Ledger ({metrics.transactions.length})
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => setIsNewInvoiceOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create Custom Tenant Invoice
                </button>
            </div>

            {/* INVOICES VIEW */}
            {activeTab === "invoices" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search invoice # or tenant..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-2 w-64 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                            >
                                <option value="ALL">All Payment Statuses</option>
                                <option value="PAID">Paid</option>
                                <option value="PENDING">Pending</option>
                                <option value="OVERDUE">Overdue</option>
                            </select>
                        </div>

                        <span className="text-xs text-slate-400">
                            Showing {filteredInvoices.length} invoices
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-3.5">Invoice #</th>
                                    <th className="px-6 py-3.5">Subscriber</th>
                                    <th className="px-6 py-3.5">Amount (AED)</th>
                                    <th className="px-6 py-3.5">Issued / Due Date</th>
                                    <th className="px-6 py-3.5">Payment Status</th>
                                    <th className="px-6 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No subscription invoices recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((inv) => {
                                        const isPaid = inv.status === "PAID";
                                        return (
                                            <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs font-semibold text-white">
                                                    {inv.invoiceNumber}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-white">{inv.tenant.name}</div>
                                                    <div className="font-mono text-xs text-slate-500">{inv.tenant.slug}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">
                                                    <span className="font-semibold text-white">{inv.totalAmount.toLocaleString()}</span> AED
                                                    <span className="text-[11px] text-slate-500 block">incl. 5% VAT</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-400">
                                                    <div>Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                                                    {isPaid && (
                                                        <div className="text-emerald-400 text-[11px]">
                                                            Paid: {new Date(inv.paidAt).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {isPaid ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            Paid
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {inv.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {!isPaid && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPayingInvoice(inv)}
                                                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                                                        >
                                                            Record Payment
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TRANSACTIONS VIEW */}
            {activeTab === "transactions" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800">
                        <h2 className="text-base font-semibold text-white">Payment Gateway & Transfer Audit Ledger</h2>
                        <span className="text-xs text-slate-400">
                            Immutable log of successful and pending transactions across all tenant subscriber accounts.
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-3.5">Reference ID</th>
                                    <th className="px-6 py-3.5">Tenant</th>
                                    <th className="px-6 py-3.5">Amount (AED)</th>
                                    <th className="px-6 py-3.5">Gateway / Method</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {metrics.transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No payment transactions recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    metrics.transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-blue-400">{tx.transactionRef}</td>
                                            <td className="px-6 py-4 font-medium text-white">{tx.tenant.name}</td>
                                            <td className="px-6 py-4 font-mono text-xs font-semibold text-white">
                                                {tx.amount.toLocaleString()} AED
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                                    {tx.gateway} ({tx.paymentMethodType || "CARD"})
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Success
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL: RECORD MANUAL PAYMENT */}
            {payingInvoice && (
                <Dialog open={Boolean(payingInvoice)} onOpenChange={() => setPayingInvoice(null)}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-white">
                                Record Offline / Wire Payment
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-400">
                                Mark invoice <span className="font-mono text-white">{payingInvoice.invoiceNumber}</span> as paid.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                                <div className="text-slate-400">Organization: <span className="text-white font-semibold">{payingInvoice.tenant.name}</span></div>
                                <div className="text-slate-400">Total Due: <span className="text-emerald-400 font-mono font-bold">{payingInvoice.totalAmount.toLocaleString()} AED</span></div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="BANK_TRANSFER">UAE Bank Direct Transfer (IBAN)</option>
                                    <option value="CHEQUE">Corporate Cheque</option>
                                    <option value="CARD">Credit / Debit Card (Offline POS)</option>
                                    <option value="CASH">Cash Deposit</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Transaction / Reference Number</label>
                                <input
                                    type="text"
                                    placeholder="e.g. TR-ENBD-9823412"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Notes / Reconciliation Remarks</label>
                                <textarea
                                    rows={2}
                                    placeholder="Confirmed by finance team..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPayingInvoice(null)}
                                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
                                >
                                    {isSubmitting ? "Recording..." : "Confirm Payment"}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* MODAL: CREATE CUSTOM INVOICE */}
            {isNewInvoiceOpen && (
                <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-white">
                                Generate Custom Tenant Invoice
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-400">
                                Issue an enterprise add-on or custom subscription invoice to a subscriber.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateInvoice} className="space-y-4 pt-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Target Subscriber Organization</label>
                                <select
                                    value={selectedTenantId}
                                    onChange={(e) => setSelectedTenantId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                    {tenants.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.slug})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Invoice Amount (AED, excl. VAT)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                                <span className="text-[11px] text-slate-500 mt-0.5 block">
                                    5% UAE VAT (+{Math.round(amount * 0.05)} AED) will be automatically computed.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Invoice Item Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Annual Dedicated Database Cluster Fee"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Payment Term / Due In</label>
                                <select
                                    value={dueDateDays}
                                    onChange={(e) => setDueDateDays(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="7">7 Days</option>
                                    <option value="14">14 Days (Standard Net-14)</option>
                                    <option value="30">30 Days (Net-30)</option>
                                    <option value="60">60 Days (Net-60)</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsNewInvoiceOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
                                >
                                    {isSubmitting ? "Generating..." : "Issue Invoice"}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
