"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Layers,
  Package,
  Users,
  Shield,
  TicketCheck,
  Activity,
  Settings2,
  PlugZap,
  Database,
  ShieldAlert,
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  HelpCircle,
  ChevronDown,
  Globe,
  Key,
  BarChart2,
  FileText,
  Lock,
  RefreshCw,
  ExternalLink,
  User,
  UserCog,
} from "lucide-react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeSelector } from "@/components/layout/ThemeSelector";
import { getOpenTicketCountAction } from "@/lib/actions/ticket-notifications";

interface SuperAdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onMenuClick: () => void;
}

export function SuperAdminHeader({ user, onMenuClick }: SuperAdminHeaderProps) {
  const pathname = usePathname();
  const isNotificationsActive = pathname === "/notifications";
  const isTicketsActive = pathname === "/super-admin/tickets";
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    getOpenTicketCountAction().then((res) => setOpenTicketsCount(res.openCount)).catch(() => {});
  }, [pathname]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  const navItems = [
    { title: "Dashboard", href: "/super-admin/dashboard", icon: LayoutDashboard, description: "Platform overview & metrics" },
    { title: "Companies", href: "/super-admin/companies", icon: Building2, description: "Manage tenant organizations" },
    { title: "Subscription Plans", href: "/super-admin/plans", icon: Layers, description: "Plan tiers & pricing" },
    { title: "Subscriptions", href: "/super-admin/subscriptions", icon: CreditCard, description: "Active subscriptions" },
    { title: "Billing & Invoices", href: "/super-admin/billing", icon: FileText, description: "Revenue & payments" },
    { title: "Modules", href: "/super-admin/modules", icon: Package, description: "Feature entitlements" },
    { title: "Platform Users", href: "/super-admin/users", icon: Users, description: "Admin & support accounts" },
    { title: "Roles & Permissions", href: "/super-admin/roles", icon: Shield, description: "Access control matrix" },
    { title: "Role Requests", href: "/super-admin/role-requests", icon: UserCog, description: "Review role access requests" },
    { title: "Support Tickets", href: "/super-admin/tickets", icon: TicketCheck, description: "Customer support" },
    { title: "Audit Logs", href: "/super-admin/audit", icon: Activity, description: "Security & admin events" },
    { title: "Integrations", href: "/super-admin/integrations", icon: PlugZap, description: "Third-party services" },
    { title: "Platform Settings", href: "/super-admin/settings", icon: Settings2, description: "Global configuration" },
    { title: "System Health", href: "/super-admin/health", icon: Database, description: "Monitoring & alerts" },
  ];

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
    if (e.key === "Escape") {
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!mounted) {
    return (
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background/75 px-3 backdrop-blur-xl md:h-20 md:gap-4 md:px-8"
        aria-busy="true"
        aria-label="Loading header"
      >
        <div className="h-9 w-full max-w-md animate-pulse rounded-xl bg-muted bg-card" />
        <div className="flex shrink-0 gap-2">
          <span className="h-9 w-9 animate-pulse rounded-xl bg-muted bg-card" />
          <span className="h-9 w-9 animate-pulse rounded-xl bg-muted bg-card" />
        </div>
      </motion.header>
    );
  }

  return (
    <TooltipProvider>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background/75 px-3 backdrop-blur-xl md:h-20 md:gap-4 md:px-8"
      >
        {/* Mobile Menu Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-xl"
              onClick={onMenuClick}
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <span className="rounded-lg border border-border bg-popover px-2.5 py-1 text-xs font-medium text-foreground shadow-lg">Open menu</span>
          </TooltipContent>
        </Tooltip>

        {/* Global Search */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="hidden sm:flex h-9 max-w-[280px] min-w-[190px] items-center gap-2 rounded-xl bg-muted/70 px-3 py-1.5 text-muted-foreground placeholder:text-muted-foreground transition-all text-xs hover:bg-muted"
              onClick={() => setSearchOpen(true)}
              aria-label="Global search (⌘K)"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="hidden sm:block truncate text-xs font-medium text-muted-foreground">Search commands...</span>
              <kbd className="ml-auto hidden items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground sm:inline-flex">
                <span>⌘</span>K
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <span className="rounded-lg border border-border bg-popover px-2.5 py-1 text-xs font-medium text-foreground shadow-lg">Global search (⌘K)</span>
          </TooltipContent>
        </Tooltip>

        {/* Command Palette */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex h-full items-start justify-center pt-20"
              onClick={() => setSearchOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <Command className="overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
                  <CommandInput placeholder="Type a command or search..." className="border-b border-border bg-muted/50 px-4 py-3" />
                  <CommandList className="max-h-96 overflow-auto">
                    <CommandEmpty className="py-8 text-center text-muted-foreground">No results found.</CommandEmpty>
                    <CommandGroup heading="Navigation">
                      {navItems.map((item) => (
                        <CommandItem
                          key={item.href}
                          onSelect={() => { setSearchOpen(false); window.location.href = item.href; }}
                          className="px-4 py-3 hover:bg-muted/70"
                        >
                          <item.icon className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-foreground">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandGroup heading="Quick Actions">
                      <CommandItem onSelect={() => { setSearchOpen(false); window.location.href = "/super-admin/companies/new"; }}>
                        <User className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>Add New Company</span>
                      </CommandItem>
                      <CommandItem onSelect={() => { setSearchOpen(false); window.location.href = "/super-admin/plans"; }}>
                        <Layers className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>Manage Plans</span>
                      </CommandItem>
                      <CommandItem onSelect={() => { setSearchOpen(false); window.location.href = "/super-admin/tickets"; }}>
                        <TicketCheck className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>View Support Tickets</span>
                      </CommandItem>
                      <CommandItem onSelect={() => { setSearchOpen(false); window.location.href = "/super-admin/audit"; }}>
                        <Activity className="h-4 w-4 mr-3 text-muted-foreground" />
                        <span>View Audit Logs</span>
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Section */}
        <div className="flex items-center gap-1.5">
          {/* Theme Selector — Light / Dark / System */}
          <Tooltip>
            <TooltipTrigger asChild>
              <ThemeSelector variant="compact" />
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              <span className="rounded-lg border border-border bg-popover px-2.5 py-1 text-xs font-medium text-foreground shadow-lg">
                Change appearance
              </span>
            </TooltipContent>
          </Tooltip>

          {/* Support Ticket Quick-Access Notification Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className={cn(
                  "relative h-9 w-9 rounded-xl transition-all",
                  isTicketsActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-label="Platform Support Tickets"
              >
                <Link href="/super-admin/tickets" className="relative flex items-center justify-center w-full h-full">
                  <TicketCheck className={cn("h-4 w-4", isTicketsActive ? "text-white" : "text-muted-foreground")} />
                  {openTicketsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-background">
                      {openTicketsCount > 9 ? "9+" : openTicketsCount}
                    </span>
                  )}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              <span className="rounded-lg border border-border bg-popover px-2.5 py-1 text-xs font-medium text-foreground shadow-lg">
                {isTicketsActive ? "Current Page: Support Tickets" : (openTicketsCount > 0 ? `Support Tickets (${openTicketsCount} Open)` : "Support Tickets")}
              </span>
            </TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className={cn(
                  "relative h-9 w-9 rounded-xl transition-all",
                  isNotificationsActive
                    ? "bg-indigo-600 text-foreground shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted"
                )}
                aria-label="Notifications"
              >
                <Link href="/notifications" className="relative flex items-center justify-center w-full h-full">
                  <Bell className={cn("h-4 w-4", isNotificationsActive ? "text-foreground" : "text-muted-foreground text-muted-foreground")} />
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 pointer-events-none">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 ring-1.5 ring-white dark:ring-slate-900" />
                  </span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              <span className="rounded-lg border border-border bg-popover px-2.5 py-1 text-xs font-medium text-foreground shadow-lg">
                {isNotificationsActive ? "Current Page: Notifications" : "Notifications"}
              </span>
            </TooltipContent>
          </Tooltip>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl bg-muted/70 p-0 transition-all hover:bg-muted"
                aria-label="User menu"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || "Super Admin"} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-black text-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border border-border bg-popover shadow-2xl" sideOffset={5} align="end">
              <DropdownMenuLabel className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                {session?.user?.role === "SUPER_ADMIN" ? "Super Administrator" : "Platform User"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="border-border" />
              <DropdownMenuItem className="text-foreground hover:bg-muted/80">
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground hover:bg-muted/80">
                <Shield className="mr-2 h-4 w-4" /> Security & MFA
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground hover:bg-muted/80">
                <Bell className="mr-2 h-4 w-4" /> Notifications
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground hover:bg-muted/80">
                <Key className="mr-2 h-4 w-4" /> API Keys
              </DropdownMenuItem>
              <DropdownMenuSeparator className="border-border" />
              <DropdownMenuItem className="text-foreground hover:bg-muted/80">
                <HelpCircle className="mr-2 h-4 w-4" /> Documentation
              </DropdownMenuItem>
              <DropdownMenuItem className="text-foreground hover:bg-muted/80">
                <Globe className="mr-2 h-4 w-4" /> Status Page
              </DropdownMenuItem>
              <DropdownMenuSeparator className="border-border" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 focus:bg-rose-50 dark:focus:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.header>
    </TooltipProvider>
  );
}