"use client";

import { useState } from "react";
import { Activity, Search, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface AuditClientProps {
  initialData: any;
  initialParams: {
    page: number;
    action: string;
    actorEmail: string;
    outcome: string;
  };
}

export function AuditClient({ initialData, initialParams }: AuditClientProps) {
  const router = useRouter();
  const [action, setAction] = useState(initialParams.action);
  const [actorEmail, setActorEmail] = useState(initialParams.actorEmail);
  const [outcome, setOutcome] = useState(initialParams.outcome);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (action) params.set("action", action);
    if (actorEmail) params.set("actorEmail", actorEmail);
    if (outcome) params.set("outcome", outcome);

    router.push(`/super-admin/audit?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-7 w-7 text-indigo-400" /> Platform Security & Audit Trail
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Immutable system-wide event logs tracking authentications, privilege grants, mutations, and policy triggers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border">
            Recorded Events: <strong className="text-foreground font-mono">{initialData.total}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-card/90 border border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by action (e.g. tenant.create, auth.login)..."
            value={action}
            onChange={(e) => setAction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
          />
        </div>

        <input
          type="text"
          placeholder="Filter by actor email..."
          value={actorEmail}
          onChange={(e) => setActorEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 min-w-[180px]"
        />

        <select
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
          }}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Outcomes</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="DENIED">DENIED</option>
          <option value="ERROR">ERROR</option>
        </select>

        <button
          onClick={() => applyFilters(1)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-foreground rounded-lg text-sm font-medium transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Audit Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-card/90 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target / Resource</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80 font-mono text-xs">
              {initialData.logs.map((log: any) => {
                const isExpanded = expandedId === log.id;

                return (
                  <>
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">
                        {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                      </td>
                      <td className="py-3 px-4 text-foreground font-semibold">{log.action}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div>{log.actorEmail || "SYSTEM"}</div>
                        {log.actorRole && <div className="text-[10px] text-muted-foreground">{log.actorRole}</div>}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{log.target || "—"}</td>
                      <td className="py-3 px-4">
                        {log.outcome === "SUCCESS" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> SUCCESS
                          </span>
                        )}
                        {log.outcome === "DENIED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" /> DENIED
                          </span>
                        )}
                        {log.outcome === "ERROR" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                            <XCircle className="h-3.5 w-3.5" /> ERROR
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{log.ipAddress || "—"}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="px-2 py-1 rounded bg-muted hover:bg-slate-700 text-muted-foreground text-[11px] inline-flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          JSON
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${log.id}-detail`} className="bg-background/70 border-b border-border">
                        <td colSpan={7} className="p-4">
                          <div className="bg-card border border-border rounded-lg p-3 max-h-60 overflow-y-auto">
                            <div className="text-[11px] font-sans text-muted-foreground mb-1">
                              <strong>Path:</strong> {log.requestMethod || "GET"} {log.requestPath || "—"}
                            </div>
                            <pre className="text-[11px] text-indigo-300 whitespace-pre-wrap">
                              {JSON.stringify(log.detail || {}, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {initialData.logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground font-sans">
                    No audit records match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-card/90 border-t border-border text-xs text-muted-foreground font-sans">
            <div>
              Page {initialData.page} of {initialData.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={initialData.page <= 1}
                onClick={() => applyFilters(initialData.page - 1)}
                className="p-1 rounded bg-muted hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={initialData.page >= initialData.totalPages}
                onClick={() => applyFilters(initialData.page + 1)}
                className="p-1 rounded bg-muted hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

