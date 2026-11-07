"use client";

import { PlugZap, CheckCircle2, ShieldCheck, ExternalLink, Sliders } from "lucide-react";

interface IntegrationsClientProps {
  integrations: any[];
}

export function IntegrationsClient({ integrations }: IntegrationsClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <PlugZap className="h-7 w-7 text-indigo-400" /> Platform Integrations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            External gateways, government compliance interfaces, identity providers, and storage connectors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item) => (
          <div
            key={item.key}
            className="flex flex-col justify-between p-5 rounded-2xl bg-card border border-border hover:border-border transition-all shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  {item.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> {item.status}
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2">{item.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">{item.description}</p>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">ID: {item.key}</span>
              <button className="px-3 py-1.5 rounded-lg bg-muted hover:bg-slate-700 text-xs font-semibold text-foreground transition-colors flex items-center gap-1">
                <Sliders className="h-3.5 w-3.5" /> Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

