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
  Sun,
  Moon,
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
import { useTheme } from "next-themes";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

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
        className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200/50 bg-white/70 px-3 backdrop-blur-xl dark:bg-slate-950/70 dark:border-slate-800/50 md:h-20 md:gap-4 md:px-8"
        aria-busy="true"
        aria-label="Loading header"
      >
        <div className="h-10 w-full max-w-md animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
        <div className="flex shrink-0 gap-2">
          <span className="h-11 w-11 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
          <span className="h-11 w-11 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
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
        className="relative z-50 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200/50 bg-white/70 px-3 backdrop-blur-xl dark:bg-slate-950/70 dark:border-slate-800/50 md:h-20 md:gap-4 md:px-8"
      >
        {/* Mobile Menu Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10"
              onClick={onMenuClick}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <span className="text-sm font-medium text-slate-900 bg-white px-3 py-1.5 rounded-lg shadow-lg">Open menu</span>
          </TooltipContent>
        </Tooltip>

        {/* Global Search */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-10 w-10 max-w-[300px] min-w-[200px] items-center gap-2 rounded-xl bg-slate-100/50 px-3 py-2 text-slate-500 placeholder:text-slate-400 dark:bg-slate-800/50 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              onClick={() => setSearchOpen(true)}
              aria-label="Global search (⌘K)"
            >
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="hidden sm:block truncate text-sm font-medium">Search commands...</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-slate-200/50 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:bg-slate-700/50 dark:text-slate-400">
                <span>⌘</span>K
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="start">
            <span className="text-sm font-medium text-slate-900 bg-white px-3 py-1.5 rounded-lg shadow-lg">Global search (⌘K)</span>
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
                <Command className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                  <CommandInput placeholder="Type a command or search..." className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700" />
                  <CommandList className="max-h-96 overflow-auto">
                    <CommandEmpty className="py-8 text-center text-slate-500">No results found.</CommandEmpty>
                    <CommandGroup heading="Navigation">
                      {navItems.map((item) => (
                        <CommandItem
                          key={item.href}
                          onSelect={() => { setSearchOpen(false); window.location.href = item.href; }}
                          className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <item.icon className="h-4 w-4 mr-3 text-slate-400 shrink-0" />
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{item.title}</div>
                            <div className="text-xs text-slate-500">{item.description}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandGroup heading="Quick Actions">
                      <CommandItem onSelect={() => { setSearchOpen(false); window.location.href = "/super-admin/companies/new"; }}>
                        <User className="h-4 w-4 mr-3 text-slate-400" />
                        <span>Add New Company</span>
                      </CommandItem>
                      <CommandItem onSelect={() => { setSearchOpen(false); window.location.href = "/super-admin/plans"; }}>
                        <Layers className="h-4 w-4 mr-3 text-slate-400" />
                        <span>Manage Plans</span>
                      </CommandItem>
                      <CommandItem onSelect={() => { setSearchOpen(false); window.location.href = "/super-admin/tickets"; }}>
                        <TicketCheck className="h-4 w-4 mr-3 text-slate-400" />
                        <span>View Support Tickets</span>
                      </CommandItem>
                      <CommandItem onSelect={() => { setSearchOpen(false); window.location.href = "/super-admin/audit"; }}>
                        <Activity className="h-4 w-4 mr-3 text-slate-400" />
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
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-10 w-10 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300"
                aria-label="Toggle theme"
              >
                <div className="relative h-5 w-5 flex items-center justify-center">
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-indigo-400" />
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              <span className="text-sm font-medium text-slate-900 bg-white px-3 py-1.5 rounded-lg shadow-lg">Toggle theme</span>
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
                  "h-10 w-10 rounded-xl transition-all relative",
                  isNotificationsActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500"
                    : "bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}
                aria-label="Notifications"
              >
                <Link href="/notifications" className="relative flex items-center justify-center w-full h-full">
                  <Bell className={cn("h-5 w-5", isNotificationsActive ? "text-white" : "text-slate-600 dark:text-slate-400")} />
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 pointer-events-none">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                  </span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              <span className="text-sm font-medium text-slate-900 bg-white px-3 py-1.5 rounded-lg shadow-lg">
                {isNotificationsActive ? "Current Page: Notifications" : "Notifications"}
              </span>
            </TooltipContent>
          </Tooltip>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || "Super Admin"} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] font-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl" sideOffset={5} align="end">
              <DropdownMenuLabel className="text-xs font-semibold text-slate-400 px-2 py-1">
                {session?.user?.role === "SUPER_ADMIN" ? "Super Administrator" : "Platform User"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="border-slate-200 dark:border-slate-800" />
              <DropdownMenuItem className="text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                <User className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                <Shield className="h-4 w-4 mr-2" /> Security & MFA
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                <Bell className="h-4 w-4 mr-2" /> Notifications
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                <Key className="h-4 w-4 mr-2" /> API Keys
              </DropdownMenuItem>
              <DropdownMenuSeparator className="border-slate-200 dark:border-slate-800" />
              <DropdownMenuItem className="text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                <HelpCircle className="h-4 w-4 mr-2" /> Documentation
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                <Globe className="h-4 w-4 mr-2" /> Status Page
              </DropdownMenuItem>
              <DropdownMenuSeparator className="border-slate-200 dark:border-slate-800" />
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