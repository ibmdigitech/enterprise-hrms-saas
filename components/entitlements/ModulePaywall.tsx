"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModulePaywallProps {
  moduleName: string;
  description?: string;
  category?: string;
  priceMonthly?: number;
  currency?: string;
}

export function ModulePaywall({
  moduleName,
  description = "This advanced capability is available as an independent module or through an enterprise package.",
  category = "Enterprise Feature",
  priceMonthly = 199,
  currency = "AED",
}: ModulePaywallProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-16 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in duration-300">
      <div className="h-16 w-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-600/10">
        <Lock className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900">
          <Sparkles className="h-3 w-3" /> {category}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Unlock the {moduleName} Module
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg mx-auto">
          {description}
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full space-y-4">
        <div className="flex items-center justify-between text-left">
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Subscription Price</span>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {currency} {priceMonthly.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ month</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-bold">
            14-Day Free Trial Available
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link href="/settings/billing" className="w-full sm:flex-1">
            <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-wider shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
              <span>Subscribe or Start Trial</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/support" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-12 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800">
              Contact Sales
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-slate-400 font-medium">
        <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Cancel anytime</span>
        <span>&bull;</span>
        <span>Instant Activation</span>
        <span>&bull;</span>
        <span>Multi-currency UAE Support</span>
      </div>
    </div>
  );
}

