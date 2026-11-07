"use client";

import { useState, useTransition } from "react";
import { Layers, Check, X, Shield, Users, Building, MapPin, Zap } from "lucide-react";
import { togglePlanActiveAction } from "./plans-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PlansClientProps {
  plans: any[];
}

export function PlansClient({ plans }: PlansClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = (planId: string, current: boolean) => {
    startTransition(async () => {
      await togglePlanActiveAction(planId, !current);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Layers className="h-7 w-7 text-primary" /> Subscription Plans
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global tier definitions, workforce quotas, module entitlements, and multi-currency pricing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
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
                  <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
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

                {/* Features */}
                <div className="space-y-2 text-xs border-t border-border pt-4 mb-6">
                  <div className="flex items-center gap-2">
                    {p.hasPayroll ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={p.hasPayroll ? "text-foreground" : "text-muted-foreground line-through"}>Payroll & UAE WPS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.hasCompliance ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={p.hasCompliance ? "text-foreground" : "text-muted-foreground line-through"}>Visa & Compliance Engine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.hasRecruitment ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={p.hasRecruitment ? "text-foreground" : "text-muted-foreground line-through"}>Recruitment Pipeline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.hasCustomTheme ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={p.hasCustomTheme ? "text-foreground" : "text-muted-foreground line-through"}>White-label Custom Branding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.hasApiAccess ? <Check className="h-4 w-4 text-emerald-500 shrink-0" /> : <X className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={p.hasApiAccess ? "text-foreground" : "text-muted-foreground line-through"}>REST API & Webhooks Access</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">
                  {p._count?.subscriptions || 0} active subscribers
                </span>
                <button
                  onClick={() => handleToggle(p.id, p.isActive)}
                  disabled={isPending}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-medium transition-colors",
                    p.isActive
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "bg-emerald-600 text-foreground hover:bg-emerald-500"
                  )}
                >
                  {p.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}