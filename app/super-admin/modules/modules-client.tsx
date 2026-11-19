"use client";

import { useState } from "react";
import { 
  Package, Plus, Building2, CheckCircle2, DollarSign, Sparkles, 
  Layers, Lock, Loader2, ArrowUpRight, ShieldCheck, Tag, Send, Check 
} from "lucide-react";
import { 
  createMarketplaceModuleAction, 
  updateMarketplaceModuleAction, 
  toggleTenantModuleAction 
} from "./modules-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ModulesMarketplaceClientProps {
  data: {
    modules: any[];
    totalTenants: number;
    tenants?: any[];
  };
}

export function ModulesMarketplaceClient({ data }: ModulesMarketplaceClientProps) {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>(data.modules);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<any | null>(null);

  // Assign to company modal
  const [assignModule, setAssignModule] = useState<any | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    data.tenants?.[0]?.id || ""
  );
  const [assignStatus, setAssignStatus] = useState<"ENABLED" | "TRIAL" | "DISABLED">("ENABLED");
  const [isAssigning, setIsAssigning] = useState(false);

  // New module state
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("WORKFORCE");
  const [description, setDescription] = useState("");
  const [priceMonthly, setPriceMonthly] = useState(149);
  const [priceAnnual, setPriceAnnual] = useState(1490);
  const [trialDays, setTrialDays] = useState(14);
  const [featuresStr, setFeaturesStr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["ALL", "CORE", "WORKFORCE", "PAYROLL", "FINANCE", "LIFECYCLE", "TALENT", "COMPLIANCE", "SERVICES", "AI"];

  const filtered = selectedCategory === "ALL" 
    ? modules 
    : modules.filter((m) => m.category === selectedCategory);

  const totalMonthlyRunRate = modules.reduce((sum, m) => sum + (m.estMonthlyRevenue || 0), 0);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim() || !name.trim()) {
      toast.error("Module key and name are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createMarketplaceModuleAction({
        key,
        name,
        category,
        description,
        priceMonthly,
        priceAnnual,
        trialDays,
        features: featuresStr.split(",").map((s) => s.trim()).filter(Boolean),
        dependencies: [],
      });

      if (res.success && res.module) {
        toast.success(`Module '${name}' published to marketplace!`);
        setIsCreateOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create module.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (mod: any) => {
    try {
      await updateMarketplaceModuleAction(mod.id, { isPublished: !mod.isPublished });
      toast.success(`Module ${!mod.isPublished ? "published" : "unpublished"}`);
      setModules((prev) =>
        prev.map((m) => (m.id === mod.id ? { ...m, isPublished: !m.isPublished } : m))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update module.");
    }
  };

  const openAssignModal = (mod: any) => {
    setAssignModule(mod);
    setSelectedTenantId(data.tenants?.[0]?.id || "");
    setAssignStatus("ENABLED");
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModule || !selectedTenantId) {
      toast.error("Please select a target company.");
      return;
    }

    setIsAssigning(true);
    try {
      await toggleTenantModuleAction({
        tenantId: selectedTenantId,
        moduleId: assignModule.id,
        status: assignStatus,
      });

      toast.success(`Module '${assignModule.name}' successfully ${assignStatus.toLowerCase()} for company!`);
      setIsAssignOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign module.");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & KPI Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-card border border-border shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Package className="h-3.5 w-3.5" /> Super Admin Module Control Center
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">SaaS Module Marketplace & Catalogue</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Control available modules, pricing tiers, trial durations, and monetize or activate feature extensions across customer companies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="px-5 py-3 rounded-2xl bg-background/60 border border-border">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Est. Module ARR</span>
            <div className="text-xl font-black text-emerald-400 font-mono">
              AED {(totalMonthlyRunRate * 12).toLocaleString()}
            </div>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="h-4 w-4" /> Register New Module
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-indigo-600 text-foreground shadow-md shadow-indigo-600/20"
                : "bg-card/90 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((m) => {
          const adoption = data.totalTenants > 0 ? Math.round((m.activeSubscribers / data.totalTenants) * 100) : 0;
          return (
            <div
              key={m.id}
              className="flex flex-col justify-between p-6 rounded-3xl bg-card/90 border border-border hover:border-border transition-all shadow-sm group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border/60 font-mono">
                    {m.category}
                  </span>
                  <div className="flex items-center gap-2">
                    {m.isCore ? (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Core Platform
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {m.isPublished ? "Published" : "Draft"}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-black text-foreground group-hover:text-indigo-400 transition-colors">
                  {m.name}
                </h3>
                <div className="text-[10px] text-muted-foreground font-mono mb-2">key: {m.key} &bull; v{m.version || "1.0.0"}</div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                  {m.description}
                </p>

                {/* Features Pills */}
                {m.features && m.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {m.features.slice(0, 3).map((f: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-background/60 text-muted-foreground border border-border"
                      >
                        {f}
                      </span>
                    ))}
                    {m.features.length > 3 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded text-muted-foreground">
                        +{m.features.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Pricing & Actions Section */}
              <div className="pt-4 border-t border-border/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Pricing</span>
                    <div className="font-bold text-foreground font-mono">
                      {m.isCore ? (
                        <span className="text-emerald-400">Included in Core</span>
                      ) : (
                        <span>
                          AED {m.priceMonthly} <span className="text-[10px] text-muted-foreground font-normal">/ mo</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Active Adoption</span>
                    <div className="font-bold text-indigo-400 font-mono">
                      {m.activeSubscribers} / {data.totalTenants} ({adoption}%)
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Assign to Company & Toggle Publish */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => openAssignModal(m)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <Building2 className="h-3 w-3" /> Assign to Company
                  </button>

                  {!m.isCore && (
                    <button
                      onClick={() => handleTogglePublish(m)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border transition-all ${
                        m.isPublished
                          ? "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                          : "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
                      }`}
                    >
                      {m.isPublished ? "Unpublish" : "Publish"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Module to Company Modal */}
      {isAssignOpen && assignModule && (
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent className="max-w-md bg-card border-border text-foreground p-6">
            <DialogHeader className="pb-3 border-b border-border">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-400" /> Entitle Module to Customer Company
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Activate <b>{assignModule.name}</b> for an organization. Enabling generates an official invoice for billing records.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAssignSubmit} className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Target Company / Organization
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  {data.tenants?.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Entitlement Status
                </label>
                <select
                  value={assignStatus}
                  onChange={(e) => setAssignStatus(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="ENABLED">ENABLED (Active & Paid - Generates Invoice)</option>
                  <option value="TRIAL">TRIAL (14-Day Free Evaluation)</option>
                  <option value="DISABLED">DISABLED (Revoke Access)</option>
                </select>
              </div>

              {assignStatus === "ENABLED" && assignModule.priceMonthly > 0 && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Automatic Invoice Generation
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    An invoice for <b>{assignModule.priceMonthly} AED (+ 5% VAT)</b> will be recorded in Platform Billing and available for PDF download.
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-foreground bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirm Entitlement
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Module Modal */}
      {isCreateOpen && (
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-xl bg-card border border-border text-foreground p-6 shadow-2xl">
            <DialogHeader className="pb-3 border-b border-border">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" /> Register New Platform Module
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Define the module slug, category, pricing, and feature capabilities for the marketplace.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateModule} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                    Module Key (Unique Slug)
                  </label>
                  <input
                    type="text"
                    required
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="e.g. employee_assets"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="CORE">CORE</option>
                    <option value="WORKFORCE">WORKFORCE</option>
                    <option value="PAYROLL">PAYROLL</option>
                    <option value="FINANCE">FINANCE</option>
                    <option value="LIFECYCLE">LIFECYCLE</option>
                    <option value="TALENT">TALENT</option>
                    <option value="COMPLIANCE">COMPLIANCE</option>
                    <option value="SERVICES">SERVICES</option>
                    <option value="AI">AI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                  Module Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Asset & Equipment Management"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details of the business functions provided by this module..."
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                    Price Monthly (AED)
                  </label>
                  <input
                    type="number"
                    value={priceMonthly}
                    onChange={(e) => setPriceMonthly(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                    Price Annual (AED)
                  </label>
                  <input
                    type="number"
                    value={priceAnnual}
                    onChange={(e) => setPriceAnnual(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                    Trial Days
                  </label>
                  <input
                    type="number"
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                  Features List (Comma separated)
                </label>
                <input
                  type="text"
                  value={featuresStr}
                  onChange={(e) => setFeaturesStr(e.target.value)}
                  placeholder="e.g. Asset Assignment, Depreciation, Serial QR Tracking"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-indigo-500"
                />
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
                  Publish Module
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
