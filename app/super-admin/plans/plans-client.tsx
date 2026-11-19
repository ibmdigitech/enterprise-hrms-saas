"use client";

import { useState, useTransition } from "react";
import { 
  Layers, Check, X, Shield, Users, Building, MapPin, Zap, Sparkles, 
  Edit3, DollarSign, Wallet, FileCheck2, Cpu, CheckCircle2, Loader2, Package 
} from "lucide-react";
import { togglePlanActiveAction, updatePlanAction } from "./plans-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PlansClientProps {
  plans: any[];
}

export function PlansClient({ plans }: PlansClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Edit Plan State
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields for editing
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPriceMonthly, setFormPriceMonthly] = useState(0);
  const [formPriceAnnual, setFormPriceAnnual] = useState(0);
  const [formMaxEmployees, setFormMaxEmployees] = useState(50);
  const [formMaxCompanies, setFormMaxCompanies] = useState(1);
  const [formMaxLocations, setFormMaxLocations] = useState(2);
  const [formHasPayroll, setFormHasPayroll] = useState(true);
  const [formHasCompliance, setFormHasCompliance] = useState(true);
  const [formHasRecruitment, setFormHasRecruitment] = useState(false);
  const [formHasCustomTheme, setFormHasCustomTheme] = useState(false);
  const [formHasApiAccess, setFormHasApiAccess] = useState(false);
  const [formHasFinanceEngine, setFormHasFinanceEngine] = useState(false);
  const [formHasMarketplace, setFormHasMarketplace] = useState(true);
  const [formHasLetterSeal, setFormHasLetterSeal] = useState(false);
  const [formHasBiometrics, setFormHasBiometrics] = useState(false);
  const [formHasAiCopilot, setFormHasAiCopilot] = useState(false);

  const handleToggle = (planId: string, current: boolean) => {
    startTransition(async () => {
      await togglePlanActiveAction(planId, !current);
      toast.success(`Plan ${!current ? "activated" : "deactivated"}`);
      router.refresh();
    });
  };

  const openEditModal = (p: any) => {
    setEditingPlan(p);
    setFormDisplayName(p.displayName || p.name);
    setFormDescription(p.description || "");
    setFormPriceMonthly(p.priceMonthly || 0);
    setFormPriceAnnual(p.priceAnnual || 0);
    setFormMaxEmployees(p.maxEmployees || 50);
    setFormMaxCompanies(p.maxCompanies || 1);
    setFormMaxLocations(p.maxLocations || 1);
    setFormHasPayroll(!!p.hasPayroll);
    setFormHasCompliance(!!p.hasCompliance);
    setFormHasRecruitment(!!p.hasRecruitment);
    setFormHasCustomTheme(!!p.hasCustomTheme);
    setFormHasApiAccess(!!p.hasApiAccess);
    setFormHasFinanceEngine(!!p.features?.hasFinanceEngine);
    setFormHasMarketplace(p.features?.hasMarketplace !== false);
    setFormHasLetterSeal(!!p.features?.hasLetterSeal);
    setFormHasBiometrics(!!p.features?.hasBiometrics);
    setFormHasAiCopilot(!!(p.features?.hasAiCopilot || p.features?.aiModules));
    setIsEditOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSaving(true);
    try {
      const mergedFeatures = {
        ...(typeof editingPlan.features === "object" ? editingPlan.features : {}),
        hasFinanceEngine: formHasFinanceEngine,
        hasMarketplace: formHasMarketplace,
        hasLetterSeal: formHasLetterSeal,
        hasBiometrics: formHasBiometrics,
        hasAiCopilot: formHasAiCopilot,
        hasTaxInvoicing: true,
      };

      await updatePlanAction(editingPlan.id, {
        displayName: formDisplayName,
        description: formDescription,
        priceMonthly: formPriceMonthly,
        priceAnnual: formPriceAnnual,
        maxEmployees: formMaxEmployees,
        maxCompanies: formMaxCompanies,
        maxLocations: formMaxLocations,
        hasPayroll: formHasPayroll,
        hasCompliance: formHasCompliance,
        hasRecruitment: formHasRecruitment,
        hasCustomTheme: formHasCustomTheme,
        hasApiAccess: formHasApiAccess,
        features: mergedFeatures,
      });

      toast.success(`Plan '${formDisplayName}' updated successfully!`);
      setIsEditOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update plan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-7 w-7 text-primary" /> Subscription Plans & Feature Tiers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global tier definitions, workforce quotas, Enterprise Finance engine, add-on marketplace entitlements, and multi-currency pricing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const hasFinance = !!(p.features?.hasFinanceEngine || p.slug === "GROWTH" || p.slug === "ENTERPRISE");
          const hasMarketplace = p.features?.hasMarketplace !== false;
          const hasLetterSeal = !!(p.features?.hasLetterSeal || p.slug === "GROWTH" || p.slug === "ENTERPRISE");
          const hasBiometrics = !!(p.features?.hasBiometrics || p.slug === "GROWTH" || p.slug === "ENTERPRISE");
          const hasAiCopilot = !!(p.features?.hasAiCopilot || p.features?.aiModules || p.slug === "GROWTH" || p.slug === "ENTERPRISE");

          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col justify-between rounded-2xl p-6 bg-card border transition-all",
                p.isPopular
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              {p.isPopular && (
                <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-primary text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-xl font-bold text-foreground">{p.displayName || p.name}</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        p.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {p.isActive ? "Active" : "Archived"}
                    </span>
                    <button
                      onClick={() => openEditModal(p)}
                      title="Edit Plan & Features"
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground min-h-[32px] mb-4">{p.description}</p>

                <div className="mb-6 pb-4 border-b border-border">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{p.priceMonthly.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.currency} / month
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground/70 mt-1">
                    Annual: {p.priceAnnual.toLocaleString()} {p.currency} / year
                  </div>
                </div>

                {/* Quotas */}
                <div className="space-y-2 mb-6 text-xs text-muted-foreground/80">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> Max Staff
                    </span>
                    <span className="font-semibold text-foreground">{p.maxEmployees} employees</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Building className="h-3.5 w-3.5" /> Legal Entities
                    </span>
                    <span className="font-semibold text-foreground">{p.maxCompanies} companies</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> Branches
                    </span>
                    <span className="font-semibold text-foreground">{p.maxLocations} locations</span>
                  </div>
                </div>

                {/* Newly Added Features & Capability Checklist */}
                <div className="space-y-2 text-xs border-t border-border pt-4 mb-6">
                  {/* Enterprise Finance Engine */}
                  <div className="flex items-center gap-2">
                    {hasFinance ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasFinance ? "text-foreground font-semibold flex items-center gap-1.5" : "text-muted-foreground line-through flex items-center gap-1.5"}>
                      <Wallet className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      Enterprise Finance Engine (Budgets, Petty Cash, POs)
                    </span>
                  </div>

                  {/* Module Marketplace */}
                  <div className="flex items-center gap-2">
                    {hasMarketplace ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasMarketplace ? "text-foreground flex items-center gap-1.5" : "text-muted-foreground line-through flex items-center gap-1.5"}>
                      <Package className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      Add-on Module Marketplace & Extensions
                    </span>
                  </div>

                  {/* Payroll & WPS */}
                  <div className="flex items-center gap-2">
                    {p.hasPayroll ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={p.hasPayroll ? "text-foreground" : "text-muted-foreground line-through"}>Payroll Automation & UAE WPS SIF</span>
                  </div>

                  {/* Visa & Compliance */}
                  <div className="flex items-center gap-2">
                    {p.hasCompliance ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={p.hasCompliance ? "text-foreground" : "text-muted-foreground line-through"}>Visa & Compliance Engine</span>
                  </div>

                  {/* Recruitment */}
                  <div className="flex items-center gap-2">
                    {p.hasRecruitment ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={p.hasRecruitment ? "text-foreground" : "text-muted-foreground line-through"}>Recruitment & Applicant Pipeline</span>
                  </div>

                  {/* Official Letter & Stamps */}
                  <div className="flex items-center gap-2">
                    {hasLetterSeal ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasLetterSeal ? "text-foreground flex items-center gap-1.5" : "text-muted-foreground line-through flex items-center gap-1.5"}>
                      <FileCheck2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      Official Letter Request & Digital Stamps
                    </span>
                  </div>

                  {/* Biometric Attendance Device Sync */}
                  <div className="flex items-center gap-2">
                    {hasBiometrics ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasBiometrics ? "text-foreground flex items-center gap-1.5" : "text-muted-foreground line-through flex items-center gap-1.5"}>
                      <Cpu className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      Biometric Attendance Sync & Shifts
                    </span>
                  </div>

                  {/* White-label Branding */}
                  <div className="flex items-center gap-2">
                    {p.hasCustomTheme ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={p.hasCustomTheme ? "text-foreground" : "text-muted-foreground line-through"}>White-label Custom Branding</span>
                  </div>

                  {/* REST API */}
                  <div className="flex items-center gap-2">
                    {p.hasApiAccess ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={p.hasApiAccess ? "text-foreground" : "text-muted-foreground line-through"}>REST API & Webhooks Access</span>
                  </div>

                  {/* AI Copilot */}
                  <div className="flex items-center gap-2">
                    {hasAiCopilot ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={hasAiCopilot ? "text-foreground flex items-center gap-1.5" : "text-muted-foreground line-through flex items-center gap-1.5"}>
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      AI Insights & Copilot Suite
                    </span>
                  </div>

                  {/* Tax Invoicing */}
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-foreground flex items-center gap-1.5 font-medium">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      UAE VAT 5% Invoicing & PDF Receipts
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">
                  {p._count?.subscriptions || 0} active subscribers
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="px-3 py-1.5 rounded-lg font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
                  >
                    Edit Features
                  </button>
                  <button
                    onClick={() => handleToggle(p.id, p.isActive)}
                    disabled={isPending}
                    className={cn(
                      "px-3 py-1.5 rounded-lg font-medium transition-colors",
                      p.isActive
                        ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                        : "bg-emerald-600 text-foreground hover:bg-emerald-500"
                    )}
                  >
                    {p.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Plan Modal */}
      {isEditOpen && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl bg-card border-border text-foreground p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-3 border-b border-border">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" /> Edit Plan: {formDisplayName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure plan pricing, limits, and toggle feature entitlements for customer companies.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSavePlan} className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Plan Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Price Monthly (AED)
                  </label>
                  <input
                    type="number"
                    value={formPriceMonthly}
                    onChange={(e) => setFormPriceMonthly(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Price Annual (AED)
                  </label>
                  <input
                    type="number"
                    value={formPriceAnnual}
                    onChange={(e) => setFormPriceAnnual(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Quotas */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Max Staff Seats
                  </label>
                  <input
                    type="number"
                    value={formMaxEmployees}
                    onChange={(e) => setFormMaxEmployees(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Max Companies
                  </label>
                  <input
                    type="number"
                    value={formMaxCompanies}
                    onChange={(e) => setFormMaxCompanies(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Max Branch Sites
                  </label>
                  <input
                    type="number"
                    value={formMaxLocations}
                    onChange={(e) => setFormMaxLocations(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="pt-2 border-t border-border">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                  Included Platform Features & Entitlements
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={formHasFinanceEngine}
                      onChange={(e) => setFormHasFinanceEngine(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-medium text-foreground">Enterprise Finance Engine</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={formHasMarketplace}
                      onChange={(e) => setFormHasMarketplace(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-medium text-foreground">Module Marketplace Access</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={formHasPayroll}
                      onChange={(e) => setFormHasPayroll(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-medium text-foreground">Payroll & UAE WPS SIF</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={formHasCompliance}
                      onChange={(e) => setFormHasCompliance(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-medium text-foreground">Visa & Compliance Engine</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={formHasRecruitment}
                      onChange={(e) => setFormHasRecruitment(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-medium text-foreground">Recruitment & ATS Pipeline</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={formHasLetterSeal}
                      onChange={(e) => setFormHasLetterSeal(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-medium text-foreground">Official Letter & Digital Stamps</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={formHasBiometrics}
                      onChange={(e) => setFormHasBiometrics(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-medium text-foreground">Biometric Clock-In & Shifts</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={formHasCustomTheme}
                      onChange={(e) => setFormHasCustomTheme(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-medium text-foreground">White-label Branding</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={formHasApiAccess}
                      onChange={(e) => setFormHasApiAccess(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-medium text-foreground">REST API & Webhooks</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="checkbox"
                      checked={formHasAiCopilot}
                      onChange={(e) => setFormHasAiCopilot(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className="font-medium text-foreground">AI Copilot & Insights Suite</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-foreground bg-primary hover:bg-primary/90 disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save Plan Changes
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
