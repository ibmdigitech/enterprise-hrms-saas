"use client";

import { Bell, Menu, Moon } from "lucide-react";

interface PlatformHeaderProps {
    totalTenants?: number;
    activeTenants?: number;
}

export function PlatformHeader({ totalTenants, activeTenants }: PlatformHeaderProps) {
    return (
        <header className="flex items-center justify-between border-b border-border bg-card/80 px-6 py-5 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    aria-label="Open menu"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-foreground transition hover:border-ring/40 hover:text-foreground"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    aria-label="Toggle theme"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-foreground transition hover:border-ring/40 hover:text-foreground"
                >
                    <Moon className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    aria-label="Notifications"
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-foreground transition hover:border-ring/40 hover:text-foreground"
                >
                    <Bell className="h-4 w-4" />
                    <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background bg-rose-500 text-[8px] font-bold text-white">
                        3
                    </span>
                </button>
                <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-2 py-1.5 pr-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-bold text-slate-950">
                        IB
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Platform</span>
                        <span className="text-xs font-semibold text-foreground">iBoo</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
