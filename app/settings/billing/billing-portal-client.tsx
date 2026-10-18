"use client";

import { useState } from "react";
import {
    CreditCard,
    DollarSign,
    CheckCircle2,
    Clock,
    Zap,
    Download,
    Shield,
    Users,
    Building2,
    MapPin,
    ArrowRight,
    Sparkles,
    Check,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { upgradeTenantPlanAction } from "@/lib/billing/tenant-billing";
import { toast } from "sonner";

interface BillingPortalClientProps {
    data: {
        tenant: {
            id: string;
            name: string;
            slug: string;
            currency: string;
            status: string;
        };
        subscription: any;
        invoices: any[];
        availablePlans: any[];
        usage: {
            employees: { current: number; max: number };
            companies: { current: number; max: number };
            locations: { current: number; max: number };
        };
    };
}

export function BillingPortalClient({ data }: BillingPortalClientProps) {
    const { tenant, subscription, invoices, availablePlans, usage } = data;
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("ANNUAL");
    const [selectedPlanSlug, setSelectedPlanSlug] = useState(subscription?.planTier || "GROWTH");
    const [loading, setLoading] = useState(false);

    const empPercent = Math.min(Math.round((usage.employees.current / usage.employees.max) * 100), 100);
    const compPercent = Math.min(Math.round((usage.companies.current / usage.companies.max) * 100), 100);
    const locPercent = Math.min(Math.round((usage.locations.current / usage.locations.max) * 100), 100);

    async function handleUpgrade() {
        setLoading(true);
        try {
            await upgradeTenantPlanAction({
                tenantId: tenant.id,
                planSlug: selectedPlanSlug,
                billingCycle,
            });
            toast.success(`Successfully switched to ${selectedPlanSlug} plan!`);
            setIsUpgradeModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to update subscription.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Current Subscription Card */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {subscription?.planTier || "TRIAL"} PLAN
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Active Subscription
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mt-1">
                            {tenant.name} Subscription
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Billed {subscription?.billingCycle?.toLowerCase() || "monthly"} in UAE Dirhams (AED). Next renewal:{" "}
                            <span className="text-slate-200 font-medium">
                                {subscription?.currentPeriodEnd
                                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                                    : "30 days from trial start"}
                            </span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-2 shrink-0 transition-all active:scale-95"
                    >
                        <Zap className="w-4 h-4 fill-white" />
                        Upgrade / Change Plan
                    </button>
                </div>

                {/* Quotas & Capacity Meters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                    <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span className="flex items-center gap-1.5 font-medium text-slate-300">
                                <Users className="w-4 h-4 text-blue-400" />
                                Workforce Seats
                            </span>
                            <span className="font-semibold text-white">
                                {usage.employees.current} / {usage.employees.max} staff
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    empPercent >= 90 ? "bg-rose-500" : "bg-blue-500"
                                }`}
                                style={{ width: `${empPercent}%` }}
                            />
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1.5 block">
                            {usage.employees.max - usage.employees.current} seats remaining
                        </span>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span className="flex items-center gap-1.5 font-medium text-slate-300">
                                <Building2 className="w-4 h-4 text-emerald-400" />
                                Subsidiary Companies
                            </span>
                            <span className="font-semibold text-white">
                                {usage.companies.current} / {usage.companies.max} entities
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    compPercent >= 100 ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                style={{ width: `${compPercent}%` }}
                            />
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1.5 block">
                            {usage.companies.max - usage.companies.current} company slots remaining
                        </span>
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span className="flex items-center gap-1.5 font-medium text-slate-300">
                                <MapPin className="w-4 h-4 text-purple-400" />
                                Branch Locations
                            </span>
                            <span className="font-semibold text-white">
                                {usage.locations.current} / {usage.locations.max} sites
                            </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    locPercent >= 100 ? "bg-amber-500" : "bg-purple-500"
                                }`}
                                style={{ width: `${locPercent}%` }}
                            />
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1.5 block">
                            {usage.locations.max - usage.locations.current} location slots remaining
                        </span>
                    </div>
                </div>
            </div>

            {/* Invoices & Receipts Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-white">Billing History & Invoices</h3>
                        <p className="text-xs text-slate-400">
                            Download tax receipts and audit official payment statements strictly isolated to {tenant.name}.
                        </p>
                    </div>
                    <span className="text-xs text-slate-400">{invoices.length} invoices recorded</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-3.5">Invoice #</th>
                                <th className="px-6 py-3.5">Billing Period</th>
                                <th className="px-6 py-3.5">Total Amount (AED)</th>
                                <th className="px-6 py-3.5">Payment Method</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                                        No billing invoices generated yet.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-semibold text-white">
                                            {inv.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-300">
                                            {new Date(inv.billingPeriodStart).toLocaleDateString()} –{" "}
                                            {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs font-semibold text-white">
                                            {inv.totalAmount.toLocaleString()} AED
                                            <span className="text-[11px] text-slate-500 block font-normal">
                                                incl. 5% UAE VAT
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-300">
                                            {inv.paymentMethod || "CARD (•••• 4242)"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inv.status === "PAID" ? (
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
                                            <button
                                                type="button"
                                                onClick={() => toast.success(`Receipt for ${inv.invoiceNumber} ready.`)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors border border-slate-700"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* UPGRADE PLAN MODAL */}
            {isUpgradeModalOpen && (
                <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-4xl p-6">
                        <DialogHeader className="text-center pb-4 border-b border-slate-800">
                            <DialogTitle className="text-2xl font-bold text-white">
                                Upgrade or Switch Your Subscription Plan
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-1">
                                Instant quota allocation with pro-rated billing in UAE Dirhams (AED).
                            </DialogDescription>

                            {/* Billing Cycle Toggle */}
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <span className={`text-xs font-medium ${billingCycle === "MONTHLY" ? "text-white" : "text-slate-400"}`}>
                                    Monthly Billing
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle(billingCycle === "MONTHLY" ? "ANNUAL" : "MONTHLY")}
                                    className="w-12 h-6 rounded-full bg-slate-800 p-1 transition-colors relative border border-slate-700"
                                >
                                    <div
                                        className={`w-4 h-4 rounded-full bg-blue-500 transition-transform ${
                                            billingCycle === "ANNUAL" ? "translate-x-6" : "translate-x-0"
                                        }`}
                                    />
                                </button>
                                <span className={`text-xs font-medium flex items-center gap-1.5 ${billingCycle === "ANNUAL" ? "text-white" : "text-slate-400"}`}>
                                    Annual Billing
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                        SAVE 20%
                                    </span>
                                </span>
                            </div>
                        </DialogHeader>

                        {/* Plan Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            {availablePlans.map((plan) => {
                                const isSelected = selectedPlanSlug === plan.slug;
                                const price = billingCycle === "ANNUAL" ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;

                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlanSlug(plan.slug)}
                                        className={`rounded-2xl p-5 border cursor-pointer transition-all flex flex-col justify-between ${
                                            isSelected
                                                ? "bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/30"
                                                : "bg-slate-950 border-slate-800 hover:border-slate-700"
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-white text-lg">{plan.name}</h4>
                                                {isSelected && (
                                                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-4">
                                                <div className="text-2xl font-extrabold text-white">
                                                    {price.toLocaleString()}{" "}
                                                    <span className="text-xs font-normal text-slate-400">AED/mo</span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {billingCycle === "ANNUAL" ? `Billed ${plan.priceAnnual} AED annually` : "Billed monthly"}
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                    <span>Up to {plan.maxEmployees} employees</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                    <span>{plan.maxCompanies} legal companies</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                    <span>{plan.maxLocations} branch locations</span>
                                                </div>
                                                {plan.hasRecruitment && (
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                        <span>Recruitment & ATS Module</span>
                                                    </div>
                                                )}
                                                {plan.hasCustomTheme && (
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                        <span>Custom Theme & Logo</span>
                                                    </div>
                                                )}
                                                {plan.hasApiAccess && (
                                                    <div className="flex items-center gap-2">
                                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                        <span>Dedicated DB & API Access</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className={`mt-6 w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                                                isSelected
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "bg-slate-800 text-slate-300 hover:text-white"
                                            }`}
                                        >
                                            {isSelected ? "Selected Tier" : "Select Plan"}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Shield className="w-4 h-4 text-emerald-400" />
                                Encrypted payment processing via Stripe & UAE PCI-DSS gateways.
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsUpgradeModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpgrade}
                                    disabled={loading}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-2"
                                >
                                    {loading ? "Processing..." : `Confirm & Upgrade to ${selectedPlanSlug}`}
                                </button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
