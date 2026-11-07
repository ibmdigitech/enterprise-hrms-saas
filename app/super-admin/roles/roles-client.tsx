"use client";

import { Shield, Users, Check, Lock, ChevronRight, Layers } from "lucide-react";

interface RolesClientProps {
  data: {
    roles: any[];
    totalUsers: number;
  };
}

export function RolesClient({ data }: RolesClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-7 w-7 text-indigo-400" /> Roles & Permissions Matrix
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hierarchical Role-Based Access Control (RBAC) definitions and permission scopes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border">
            Assigned Users: <strong className="text-foreground font-mono">{data.totalUsers}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.roles.map((r) => (
          <div
            key={r.role}
            className="flex flex-col justify-between p-5 rounded-2xl bg-card border border-border/80 hover:border-border/80 transition-all shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${r.badgeColor}`}>
                  {r.level}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" /> {r.userCount} users
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground">{r.name}</h3>
              <p className="text-xs text-indigo-400 font-mono mb-2">{r.role}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{r.description}</p>

              <div className="border-t border-border/60 pt-3">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-muted-foreground" /> Scope: {r.scope}
                </div>
                <ul className="space-y-1.5">
                  {r.permissions.map((p: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>Status: Built-in System Role</span>
              <span className="text-muted-foreground font-medium">Immutable</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

