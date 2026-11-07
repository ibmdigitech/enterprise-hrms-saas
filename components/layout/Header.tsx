"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Settings, LogOut, User, Search, ShieldCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signOut } from "next-auth/react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CommandSearch } from "@/components/layout/CommandSearch";
import { HeaderClock } from "@/components/layout/HeaderClock";
import { HeaderTimezone } from "@/components/layout/HeaderTimezone";
import { NavigationLinks } from "@/components/layout/NavigationLinks";
import { Menu } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TenantSwitcher, TenantOption } from "@/components/tenant/tenant-switcher";
import { ThemeSelector } from "@/components/layout/ThemeSelector";

interface HeaderProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string | null;
        tenantId?: string | null;
        tenantSlug?: string | null;
    };
    currentTenantName?: string | null;
    tenants?: TenantOption[];
}

/**
 * Shared chrome for every header icon control.
 *
 * Uses semantic color tokens that adapt to light/dark mode.
 */
const ICON_BUTTON =
    "h-9 w-9 shrink-0 rounded-xl bg-secondary/50 text-foreground shadow-xs ring-1 ring-inset ring-border/70 transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:shadow-sm hover:ring-primary/20 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:transform-none";

export function Header({ user, currentTenantName, tenants = [] }: HeaderProps) {
    const pathname = usePathname();
    const isNotificationsActive = pathname === "/notifications";
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    // Below `md` there is no room for a 448px field next to three 44px controls,
    // so search collapses to an icon that expands the field over the row.
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    const userInitials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : "U";

return (
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/70 px-3 backdrop-blur-xl md:h-20 md:gap-4 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-6">
                {/* Mobile Menu Trigger */}
                <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn(ICON_BUTTON, "lg:hidden")}>
                            <Menu className="h-4 w-4" />
                            <span className="sr-only">Open navigation menu</span>
                        </Button>
                    </DialogTrigger>
                    {/* Edge-anchored drawer, so it must fully OVERRIDE the
                        shared base's centring — not just its `left`.
                        `cn` runs tailwind-merge, so `left-0` beat
                        `left-[50%]` but NOTHING beat the base's companion
                        `translate-x-[-50%] translate-y-[-50%]`. The panel
                        inherited a half-width left shift (off-screen) and a
                        vertical re-centre that clipped a full-height panel at
                        both ends. `translate-x-0 translate-y-0` is the actual
                        fix and is mandatory if the base keeps centring.
                        `inset-y-0` + `h-[100dvh]` drop `top-[50%]` and pin the
                        panel to the viewport; `overflow-y-hidden` stops the
                        base's `overflow-y-auto` double-barring the panel that
                        already scrolls via its `flex-1 overflow-y-auto` child,
                        and `flex` drops the base's `grid`. */}
                    <DialogContent
                            className="fixed inset-y-0 left-0 translate-x-0 translate-y-0 z-50 flex flex-col w-[85vw] max-w-[320px] h-[100dvh] max-h-[100dvh] overflow-y-hidden p-0 m-0 border-0 rounded-none sm:rounded-none data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left bg-sidebar-background"
                            /* This panel is dark BY ITS OWN CLASS, whatever the app
                               theme is. With the app in light mode a theme-derived
                               close icon is dark slate on a slate-900 panel and
                               vanishes. The panel colour is the caller's decision,
                               so the caller supplies the icon colour too. */
                            closeButtonClassName="text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:ring-ring/70"
                    >
                        <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
                        <div className="mt-10 flex-1 overflow-y-auto p-4 scrollbar-hide">
                            <NavigationLinks role={user?.role} onNavigate={() => setMobileMenuOpen(false)} />
                        </div>
                    </DialogContent>
                </Dialog>

                {/* SaaS Multi-Tenant Organization Switcher */}
                <TenantSwitcher
                    currentTenantId={user?.tenantId || null}
                    currentTenantName={currentTenantName || user?.tenantSlug || "Organization"}
                    tenants={tenants}
                />

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(ICON_BUTTON, "md:hidden")}
                    aria-label="Search"
                    title="Search (⌘K, or Ctrl+K)"
                    aria-expanded={mobileSearchOpen}
                    onClick={() => setMobileSearchOpen(true)}
                >
                    <Search className="h-4 w-4" />
                </Button>

                {/* Below `md` the expanded field sits over the header, so a
                    scrim makes the row opaque (the field is translucent by
                    design) and gives a tap target to dismiss it. `z-55` puts it
                    under the field at `z-60`; `md:hidden` means it can never
                    appear on a screen with room for the inline field. */}
                {mobileSearchOpen && (
                    <button
                        type="button"
                        aria-label="Close search"
                        className="absolute inset-0 z-[55] h-full w-full cursor-default bg-background/95 md:hidden"
                        onClick={() => setMobileSearchOpen(false)}
                    />
                )}

                {/* `min-w-0` so the field shrinks instead of pushing the right
                    cluster out of the header; `flex-1` lets it fill the gap
                    between the menu button and the clock from `md` up. */}
                <div
                    className={cn(
                        "min-w-[160px] flex-1 max-w-sm lg:max-w-md",
                        mobileSearchOpen
                            ? "absolute inset-x-3 top-1/2 z-[60] -translate-y-1/2 md:static md:z-auto md:translate-y-0"
                            : "hidden md:block"
                    )}
                >
                    <CommandSearch
                        role={user?.role}
                        autoFocus={mobileSearchOpen}
                        onDismiss={() => setMobileSearchOpen(false)}
                    />
                </div>

                {/* `shrink-0` and `whitespace-nowrap` inside the clock and
                    timezone are what keep this row to ONE line each. Without
                    them the flex algorithm narrows these items and the text
                    wraps at its spaces — "GMT" / "+4" / "(UAE)" on three lines —
                    which tripled the header height. */}
                <div className="hidden shrink-0 items-center gap-6 border-l border-border pl-6 xl:flex">
                    <HeaderClock />
                    <HeaderTimezone />
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {/* Notification Bell Button with Active Route Highlight & Pinpoint Pulse Badge */}
                <Button 
                    asChild 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                        ICON_BUTTON,
                        "relative",
                        isNotificationsActive && "bg-primary text-primary-foreground ring-2 ring-primary shadow-md shadow-primary/30 hover:bg-primary/90 hover:text-primary-foreground"
                    )}
                >
                    <Link 
                        href="/notifications" 
                        aria-label="Notifications" 
                        title={isNotificationsActive ? "Current Page: Notifications" : "View Notifications"}
                    >
                        <Bell className={cn("h-4 w-4 transition-transform group-hover:scale-105", isNotificationsActive ? "text-primary-foreground" : "text-muted-foreground")} />
                        
                        {/* Active Notification Indicator Pinpoint Badge */}
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2 pointer-events-none">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-1.5 ring-background" />
                        </span>
                    </Link>
                </Button>

                {/* Settings stays reachable from the account popover below, so
                    the duplicate icon is the first thing to go on small screens. */}
                <Button asChild variant="ghost" size="icon" className={cn(ICON_BUTTON, "hidden sm:inline-flex")}>
                    <Link href="/settings" aria-label="Settings" title="Settings">
                        <Settings className="h-4 w-4" />
                    </Link>
                </Button>

                <span aria-hidden="true" className="hidden h-7 w-px border-border lg:block" />

                <Popover>
                    <PopoverTrigger asChild>
                        {/* `min-w-0` on the name column and `truncate` on the name
                            itself: a flex item defaults to min-width:auto, so a
                            long user name refuses to shrink and pushes the
                            avatar past the viewport edge below `lg`. `shrink-0`
                            on the avatar keeps it at a stable tap target. The
                            name column itself is hidden below `lg`, where the
                            avatar alone identifies the account. */}
                        <div className="group flex cursor-pointer items-center gap-2.5 rounded-xl p-1 pr-1.5 outline-none transition-colors duration-200 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring">
                            <div className="hidden min-w-0 flex-col items-end lg:flex">
                                <span className="max-w-[10rem] truncate text-sm font-black tracking-tight text-foreground transition-colors group-hover:text-primary">{user?.name || "User"}</span>
                                <div className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{user?.role || "STAFF"}</span>
                                </div>
                            </div>
                            <Avatar className="h-9 w-9 shrink-0 rounded-xl border-2 border-background shadow-sm transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:transform-none">
                                {user?.image && <AvatarImage src={user.image} alt="" />}
                                <AvatarFallback className="bg-primary font-black text-primary-foreground">{userInitials}</AvatarFallback>
                            </Avatar>
                            <span className="sr-only">Account menu for {user?.name || "user"}</span>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-64 rounded-2xl border border-border bg-popover/90 p-2 shadow-2xl backdrop-blur-xl">
                        <div className="mb-2 flex items-center gap-3 border-b border-border p-3 pb-4">
                            <Avatar className="h-12 w-12 rounded-xl">
                                {user?.image && <AvatarImage src={user.image} alt="" />}
                                <AvatarFallback className="bg-primary font-black text-primary-foreground">{userInitials}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="w-32 truncate text-sm font-black leading-tight text-foreground">{user?.name || "User"}</span>
                                <span className="w-32 truncate text-[10px] font-bold text-muted-foreground">{user?.email || "No email"}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            {user?.role === "SUPER_ADMIN" && (
                                <Button asChild variant="ghost" className="h-10 w-full justify-start rounded-xl text-xs font-black text-primary bg-primary/10 hover:bg-primary/20 hover:text-primary">
                                    <Link href="/super-admin/dashboard">
                                        <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                                        Super Admin Portal
                                    </Link>
                                </Button>
                            )}
                            <Button asChild variant="ghost" className="h-10 w-full justify-start rounded-xl text-xs font-bold text-muted-foreground hover:bg-accent hover:text-primary">
                                <Link href="/settings">
                                    <User className="mr-2 h-4 w-4" />
                                    Profile Settings
                                </Link>
                            </Button>
                            <ThemeSelector variant="dropdown" showLabel={false} />
                            <Button
                                variant="ghost"
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="h-10 w-full justify-start rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </header>
    );
}
