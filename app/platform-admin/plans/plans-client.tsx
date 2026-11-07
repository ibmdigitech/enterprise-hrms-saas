"use client";

import { useState } from "react";
import { Layers, Check, Edit2, Sparkles, Building2, Users, MapPin, Save } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { updatePlanAction } from "./plan-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PlansClientProps {
    plans: any[];
}

export function PlansClient({ plans }: PlansClientProps) {
    const [editingPlan, setEditingPlan] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    // Edit form states
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [priceMonthly, setPriceMonthly] = useState(0);
    const [priceAnnual, setPriceAnnual] = useState(0);
    const [maxEmployees, setMaxEmployees] = useState(50);
    const [maxCompanies, setMaxCompanies] = useState(1);
    const [maxLocations, setMaxLocations] = useState(2);
    const [hasPayroll, setHasPayroll] = useState(true);
    const [hasCompliance, setHasCompliance] = useState(true);
    const [hasRecruitment, setHasRecruitment] = useState(false);
    const [hasCustomTheme, setHasCustomTheme] = useState(false);
    const [hasApiAccess, setHasApiAccess] = useState(false);

    function startEdit(plan: any) {
        setEditingPlan(plan);
        setName(plan.name);
        setDescription(plan.description || "");
        setPriceMonthly(plan.priceMonthly);
        setPriceAnnual(plan.priceAnnual);
        setMaxEmployees(plan.maxEmployees);
        setMaxCompanies(plan.maxCompanies);
        setMaxLocations(plan.maxLocations);
        setHasPayroll(plan.hasPayroll);
        setHasCompliance(plan.hasCompliance);
        setHasRecruitment(plan.hasRecruitment);
        setHasCustomTheme(plan.hasCustomTheme);
        setHasApiAccess(plan.hasApiAccess);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!editingPlan) return;

        setLoading(true);
        try {
            await updatePlanAction({
                id: editingPlan.id,
                name,
                description,
                priceMonthly,
                priceAnnual,
                maxEmployees,
                maxCompanies,
                maxLocations,
                hasPayroll,
                hasCompliance,
                hasRecruitment,
                hasCustomTheme,
                hasApiAccess,
            });
            toast.success(`Plan ${name} updated successfully.`);
            setEditingPlan(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to update plan.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isPopular = plan.isPopular;
                    return (
                        <div
                            key={plan.id}
                            className={cn(
                                "relative rounded-2xl bg-card border p-6 flex flex-col justify-between transition-all",
                                isPopular
                                    ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                                    : "border-border hover:border-muted-foreground/30"
                            )}
                        >
                            {isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Most Popular
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                                    <button
                                        type="button"
                                        onClick={() => startEdit(plan)}
                                        className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Edit Plan"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <p className="text-xs text-muted-foreground mt-2 min-h-[32px]">{plan.description}</p>

                                <div className="mt-5 pb-5 border-b border-border">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-extrabold text-foreground">
                                            {plan.priceMonthly.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-medium">AED / month</span>
                                    </div>
                                    <div className="text-[11px] text-muted-foreground/70 mt-0.5">
                                        or {plan.priceAnnual.toLocaleString()} AED billed annually
                                    </div>
                                </div>

                                {/* Quotas */}
                                <div className="py-4 space-y-2 border-b border-border text-xs">
                                    <div className="flex items-center justify-between text-muted-foreground/80">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="w-3.5 h-3.5 text-primary" /> Max Employees
                                        </span>
                                        <span className="font-semibold text-foreground">{plan.maxEmployees}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-muted-foreground/80">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <Building2 className="w-3.5 h-3.5 text-primary" /> Max Legal Companies
                                        </span>
                                        <span className="font-semibold text-foreground">{plan.maxCompanies}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-muted-foreground/80">
                                        <span className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5 text-primary" /> Max Branches / Sites
                                        </span>
                                        <span className="font-semibold text-foreground">{plan.maxLocations}</span>
                                    </div>
                                </div>

                                {/* Module Toggles */}
                                <div className="pt-4 space-y-2">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Included Modules
                                    </div>
                                    <div className="space-y-1.5 text-xs text-muted-foreground/80">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>UAE Payroll & WPS Generation</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Visa & Labour Document Compliance</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {plan.hasRecruitment ? (
                                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                                            )}
                                            <span className={plan.hasRecruitment ? "" : "text-muted-foreground line-through"}>
                                                Recruitment & ATS Pipeline
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {plan.hasCustomTheme ? (
                                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                                            )}
                                            <span className={plan.hasCustomTheme ? "" : "text-muted-foreground line-through"}>
                                                Custom Branding Studio
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {plan.hasApiAccess ? (
                                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                                            )}
                                            <span className={plan.hasApiAccess ? "" : "text-muted-foreground line-through"}>
                                                REST API & Dedicated Database
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => startEdit(plan)}
                                className="mt-6 w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-colors border border-border"
                            >
                                Edit Plan Config
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* EDIT PLAN MODAL */}
            {editingPlan && (
                <Dialog open={Boolean(editingPlan)} onOpenChange={() => setEditingPlan(null)}>
                    <DialogContent className="bg-popover border-border max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-foreground">
                                Edit Plan: {editingPlan.name}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Update pricing, employee quotas, and included feature modules.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSave} className="space-y-4 pt-2">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Plan Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-input border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-input border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Monthly Price (AED)</label>
                                    <input
                                        type="number"
                                        value={priceMonthly}
                                        onChange={(e) => setPriceMonthly(Number(e.target.value))}
                                        className="w-full bg-input border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Annual Price (AED)</label>
                                    <input
                                        type="number"
                                        value={priceAnnual}
                                        onChange={(e) => setPriceAnnual(Number(e.target.value))}
                                        className="w-full bg-input border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Max Staff</label>
                                    <input
                                        type="number"
                                        value={maxEmployees}
                                        onChange={(e) => setMaxEmployees(Number(e.target.value))}
                                        className="w-full bg-input border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Max Companies</label>
                                    <input
                                        type="number"
                                        value={maxCompanies}
                                        onChange={(e) => setMaxCompanies(Number(e.target.value))}
                                        className="w-full bg-input border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Max Branches</label>
                                    <input
                                        type="number"
                                        value={maxLocations}
                                        onChange={(e) => setMaxLocations(Number(e.target.value))}
                                        className="w-full bg-input border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-border">
                                <div className="text-xs font-medium text-muted-foreground mb-2">Entitlement Flags</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <label className="flex items-center gap-2 p-2 rounded bg-input border-border cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasRecruitment}
                                            onChange={(e) => setHasRecruitment(e.target.checked)}
                                            className="rounded border-muted-foreground text-primary"
                                        />
                                        <span>Recruitment ATS</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-2 rounded bg-input border-border cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasCustomTheme}
                                            onChange={(e) => setHasCustomTheme(e.target.checked)}
                                            className="rounded border-muted-foreground text-primary"
                                        />
                                        <span>Custom Branding</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-2 rounded bg-input border-border cursor-pointer col-span-2">
                                        <input
                                            type="checkbox"
                                            checked={hasApiAccess}
                                            onChange={(e) => setHasApiAccess(e.target.checked)}
                                            className="rounded border-muted-foreground text-primary"
                                        />
                                        <span>REST API & Dedicated Database Support</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingPlan(null)}
                                    className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 shadow-sm"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {loading ? "Saving..." : "Save Plan Changes"}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}