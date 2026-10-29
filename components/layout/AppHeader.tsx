"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

interface AppHeaderProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string | null;
        tenantId?: string | null;
        tenantSlug?: string | null;
    };
    currentTenantName?: string | null;
    tenants?: Array<{ id: string; name: string; slug: string; role: string }>;
}

const Header = dynamic(
    () => import("@/components/layout/Header").then((module) => module.Header),
    {
        ssr: false,
        loading: () => (
            <header
                aria-busy="true"
                aria-label="Loading application controls"
                className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200/50 bg-white/70 px-3 backdrop-blur-xl dark:bg-slate-950/70 md:h-20 md:gap-4 md:px-8"
            >
                <div className="h-10 w-full max-w-md animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
                <div className="flex shrink-0 gap-2">
                    <span className="h-11 w-11 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
                    <span className="h-11 w-11 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
                </div>
            </header>
        ),
    },
);

export function AppHeader({ user, currentTenantName, tenants }: AppHeaderProps) {
    const pathname = usePathname();
    if (pathname.startsWith("/super-admin")) {
        return null;
    }
    return <Header user={user} currentTenantName={currentTenantName} tenants={tenants} />;
}