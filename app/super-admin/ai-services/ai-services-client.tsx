"use client";

import { useState } from "react";
import { 
  Sparkles, Cpu, ShieldCheck, DollarSign, Activity, Lock, 
  CheckCircle2, Bot, Sliders, Zap 
} from "lucide-react";
import { updateAiModuleAction } from "./ai-services-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AiServicesClientProps {
  data: {
    aiModules: any[];
    stats: {
      totalTokens: number;
      totalCostAed: number;
      totalBudgetAed: number;
      totalTenants: number;
    };
  };
}

export function AiServicesClient({ data }: AiServicesClientProps) {
  const router = useRouter();
  const [modules, setModules] = useState<any[]>(data.aiModules);

  const handleToggleActive = async (mod: any) => {
    try {
      await updateAiModuleAction(mod.id, { isActive: !mod.isActive });
      toast.success(`${mod.name} is now ${!mod.isActive ? "enabled" : "disabled"}`);
      setModules((prev) =>
        prev.map((m) => (m.id === mod.id ? { ...m, isActive: !m.isActive } : m))
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update AI module.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> AI Services Marketplace & Governance
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Enterprise AI Modular Control Center</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Configure multi-provider LLMs (OpenAI, Google Gemini), manage per-tenant token allowances, and govern automated HR intelligence with zero data leakage.
          </p>
        </div>

        {/* Global Consumption KPIs */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="px-5 py-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Total Tokens Consumed</span>
            <div className="text-xl font-black text-violet-400 font-mono">
              {(data.stats.totalTokens / 1_000_000).toFixed(2)}M Tokens
            </div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">AI Governance Status</span>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="h-4 w-4" /> Multi-Tenant Isolated
            </div>
          </div>
        </div>
      </div>

      {/* AI Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <div
            key={m.id}
            className="flex flex-col justify-between p-6 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition-all shadow-sm group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-violet-950/40 text-violet-300 border border-violet-800/40 font-mono flex items-center gap-1.5">
                  <Cpu className="h-3 w-3" /> {m.provider} &bull; {m.defaultModel}
                </span>

                <button
                  onClick={() => handleToggleActive(m)}
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border transition-all ${
                    m.isActive
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {m.isActive ? "Active" : "Disabled"}
                </button>
              </div>

              <h3 className="text-lg font-black text-white group-hover:text-violet-400 transition-colors">
                {m.name}
              </h3>
              <div className="text-[10px] text-slate-500 font-mono mb-2">service_id: {m.key}</div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{m.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">Monthly Addon</span>
                  <div className="font-bold text-white">
                    AED {m.priceMonthly} <span className="text-[10px] text-slate-400 font-normal">/ mo</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block font-sans">Base Allowance</span>
                  <div className="font-bold text-violet-400">
                    {(m.tokenAllowance / 1_000).toLocaleString()}k tokens
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Tenant Queries: {m._count?.usageLogs || 0}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Human-in-the-loop Guard
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

