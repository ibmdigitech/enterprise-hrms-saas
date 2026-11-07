"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Building2, LogOut, Activity, ShieldAlert } from "lucide-react";
import { NavigationLinks } from "@/components/layout/NavigationLinks";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user?: { name?: string | null; email?: string | null; image?: string | null; role?: string | null };
  currentTenantName?: string | null;
}

export function Sidebar({ user, currentTenantName }: SidebarProps) {
  const pathname = usePathname();
  if (pathname.startsWith("/super-admin")) {
    return null;
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <aside className={cn(
      "relative hidden h-screen w-[270px] shrink-0 flex-col overflow-hidden border-r",
      "bg-sidebar-background text-sidebar-foreground",
      "border-sidebar-border",
      "lg:flex"
    )}>

      {/* Subtle gradient blob at top */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-0 right-0 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />

      {/* ── Logo ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center gap-3 border-b px-5 py-5 border-sidebar-border">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-600 shadow-lg shadow-primary/40">
          <Building2 className="h-5 w-5 text-primary-foreground" />
          {/* Live dot */}
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar-background bg-emerald-500" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-black leading-tight tracking-tight text-sidebar-foreground">
            {currentTenantName || "Enterprise HR"}
          </p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.22em] text-sidebar-primary">
            Workforce Portal
          </p>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        <NavigationLinks role={user?.role} />
      </div>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="relative z-10 border-t p-3 space-y-2 border-sidebar-border">
        {/* Super Admin Quick Access Pill (for Super Admin users) */}
        {user?.role === "SUPER_ADMIN" && (
          <Link
            href="/super-admin/dashboard"
            className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-sidebar-accent to-violet-950/80 px-3 py-2 text-sidebar-primary ring-1 ring-sidebar-ring/30 transition-all hover:ring-sidebar-ring/60 hover:text-sidebar-primary-foreground"
          >
            <ShieldAlert className="h-4 w-4 text-sidebar-primary shrink-0" />
            <span className="text-[11px] font-bold tracking-wide">Super Admin Portal</span>
          </Link>
        )}

        {/* System status pill - 0 Issues */}
        <div className="flex items-center gap-2 rounded-xl bg-sidebar-accent px-3 py-2 ring-1 ring-sidebar-border">
          <div className="relative flex shrink-0 items-center justify-center">
            <Activity className="h-3 w-3 text-emerald-400" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-sidebar-accent-foreground">0 Issues — All systems operational</span>
        </div>

        {/* User + Sign out */}
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-teal-500 text-[11px] font-black text-primary-foreground shadow">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-sidebar-foreground leading-tight">
              {user?.name ?? "User"}
            </p>
            <p className="truncate text-[10px] text-muted-foreground leading-tight">
              {user?.role ?? "Staff"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <LogOut className="h-[14px] w-[14px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}