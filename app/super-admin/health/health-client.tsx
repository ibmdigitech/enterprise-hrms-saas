"use client";

import { Activity, Database, Server, CheckCircle2, AlertTriangle, ShieldCheck, Cpu, HardDrive } from "lucide-react";

interface HealthClientProps {
  data: any;
}

export function HealthClient({ data }: HealthClientProps) {
  const uptimeHours = (data.system.uptimeSeconds / 3600).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-7 w-7 text-indigo-400" /> Platform Infrastructure & Health
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status of PostgreSQL clusters, multi-tenant database pools, memory allocations, and edge runtime.
          </p>
        </div>
      </div>

      {/* Grid of Component Health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Database</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3.5 w-3.5" /> {data.database.status}
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">{data.database.latencyMs} ms</div>
          <div className="text-xs text-muted-foreground mt-1 font-mono">{data.database.driver}</div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Node.js Runtime</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              <Server className="h-3.5 w-3.5" /> {data.system.nodeVersion}
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">{uptimeHours} hrs</div>
          <div className="text-xs text-muted-foreground mt-1">Uptime without interruption</div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Heap Memory</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Cpu className="h-3.5 w-3.5" /> NORMAL
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">{data.system.memoryUsageMb} MB</div>
          <div className="text-xs text-muted-foreground mt-1">Active V8 memory allocation</div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Database Isolation</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
              <Database className="h-3.5 w-3.5" /> POOLED
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {data.platform.dedicatedDatabases}{" "}
            <span className="text-xs text-muted-foreground font-normal">Dedicated DBs</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {data.platform.totalTenants - data.platform.dedicatedDatabases} Shared Schemas
          </div>
        </div>
      </div>

      {/* Telemetry Summary */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-400" /> Platform Operational Capacity
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-xl bg-background/60 border border-border">
            <div className="text-2xl font-bold text-foreground font-mono">{data.platform.totalTenants}</div>
            <div className="text-xs text-muted-foreground mt-1">Registered Organizations</div>
          </div>
          <div className="p-4 rounded-xl bg-background/60 border border-border">
            <div className="text-2xl font-bold text-emerald-400 font-mono">{data.platform.totalEmployees}</div>
            <div className="text-xs text-muted-foreground mt-1">Managed Employees</div>
          </div>
          <div className="p-4 rounded-xl bg-background/60 border border-border">
            <div className="text-2xl font-bold text-indigo-400 font-mono">{data.platform.totalUsers}</div>
            <div className="text-xs text-muted-foreground mt-1">Active User Accounts</div>
          </div>
          <div className="p-4 rounded-xl bg-background/60 border border-border">
            <div className="text-2xl font-bold text-purple-400 font-mono">{data.platform.totalAuditEvents}</div>
            <div className="text-xs text-muted-foreground mt-1">Audit Ledger Entries</div>
          </div>
        </div>
      </div>
    </div>
  );
}

