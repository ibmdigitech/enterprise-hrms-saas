"use client";

import { Package, CheckCircle2, Building2, Zap, Shield, Sparkles } from "lucide-react";

interface ModulesClientProps {
  data: {
    modules: any[];
    totalTenants: number;
  };
}

export function ModulesClient({ data }: ModulesClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Package className="h-7 w-7 text-indigo-400" /> Platform Feature Modules
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global functional capabilities, feature flags, and tenant adoption rates across subscription tiers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.modules.map((m) => {
          const adoption = data.totalTenants > 0 ? Math.round((m.activeTenants / data.totalTenants) * 100) : 0;

          return (
            <div
              key={m.id}
              className="flex flex-col justify-between p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {m.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === "CORE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : m.status === "ENTERPRISE"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{m.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-6">{m.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" /> Tenant Adoption
                  </span>
                  <span className="font-mono text-white font-bold">
                    {m.activeTenants} / {data.totalTenants} ({adoption}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${adoption}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

