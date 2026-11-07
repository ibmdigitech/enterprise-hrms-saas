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
  Sparkles,
  Users,
  Shield,
  UserCog,
  TicketCheck,
  Activity,
  Settings2,
  PlugZap,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  UserPlus,
  FileText,
  LogOut,
  X,
  Bell,
  ArrowRightLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
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
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

export interface SuperAdminNavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  children?: SuperAdminNavItem[];
  permission?: string;
}

export const superAdminNavigation: SuperAdminNavItem[] = [
  {
    title: "Normal Dashboard",
    href: "/dashboard",
    icon: Building2,
    badge: "HRMS",
    children: [
      { title: "Main Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Employees", href: "/employees", icon: Users },
      { title: "Payroll Center", href: "/payroll", icon: CreditCard },
      { title: "Attendance & Shifts", href: "/attendance", icon: Calendar },
      { title: "Leaves Management", href: "/leaves", icon: Briefcase },
      { title: "Approvals Queue", href: "/dashboard/approvals", icon: CheckCircle2 },
      { title: "Workforce Settings", href: "/settings", icon: Settings2 },
    ],
  },
  {
    title: "Super Admin Dashboard",
    href: "/super-admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Companies",
    href: "/super-admin/companies",
    icon: Building2,
    children: [
      { title: "All Companies", href: "/super-admin/companies", icon: Building2 },
      { title: "Add Company", href: "/super-admin/companies/new", icon: UserPlus },
    ],
  },
  {
    title: "Subscription Plans",
    href: "/super-admin/plans",
    icon: Layers,
  },
  {
    title: "Subscriptions",
    href: "/super-admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Billing & Invoices",
    href: "/super-admin/billing",
    icon: FileText,
  },
  {
    title: "Module Marketplace",
    href: "/super-admin/modules",
    icon: Package,
  },
  {
    title: "AI Services & Models",
    href: "/super-admin/ai-services",
    icon: Sparkles,
  },
  {
    title: "Platform Users",
    href: "/super-admin/users",
    icon: Users,
  },
  {
    title: "Roles & Permissions",
    href: "/super-admin/roles",
    icon: Shield,
  },
  {
    title: "Role Requests",
    href: "/super-admin/role-requests",
    icon: UserCog,
  },
  {
    title: "Support Tickets",
    href: "/super-admin/tickets",
    icon: TicketCheck,
    badge: "3",
  },
  {
    title: "Audit Logs",
    href: "/super-admin/audit",
    icon: Activity,
  },
  {
    title: "Integrations",
    href: "/super-admin/integrations",
    icon: PlugZap,
  },
  {
    title: "Platform Settings",
    href: "/super-admin/settings",
    icon: Settings2,
  },
  {
    title: "System Health",
    href: "/super-admin/health",
    icon: Database,
  },
];

interface SuperAdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function SuperAdminSidebar({ user, mobileOpen = false, onMobileClose }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("super-admin-sidebar-collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("super-admin-sidebar-collapsed", collapsed.toString());
    }
  }, [collapsed, mounted]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "SA";

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/super-admin/dashboard" || href === "/super-admin/companies") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const hasActiveChild = (children?: SuperAdminNavItem[]) =>
    children?.some((child) => isActive(child.href)) ?? false;

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isGroupExpanded = (item: SuperAdminNavItem) => {
    if (expandedGroups[item.title] !== undefined) {
      return expandedGroups[item.title];
    }
    return hasActiveChild(item.children);
  };

  const NavLink = ({ item, level = 0, isChild = false }: { item: SuperAdminNavItem; level?: number; isChild?: boolean }) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const groupExpanded = isGroupExpanded(item);

    if (hasChildren && !isChild) {
      return (
        <Collapsible open={groupExpanded} onOpenChange={() => toggleGroup(item.title)}>
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50 cursor-pointer",
              collapsed ? "justify-center" : "",
              active || groupExpanded
                ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20 shadow-xs"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground hover:border-sidebar-border"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200 relative overflow-hidden",
                "bg-sidebar-accent/50 ring-1 ring-sidebar-border group-hover:ring-sidebar-ring/50",
                (active || groupExpanded) && "ring-sidebar-ring/30 bg-sidebar-primary/10"
              )}
            >
              <item.icon className={cn("h-3.5 w-3.5 transition-all duration-200 group-hover:scale-110", (active || groupExpanded) ? "text-sidebar-primary" : "text-muted-foreground")} />
              <span className="absolute inset-0 bg-gradient-to-r from-primary to-teal-600 opacity-0 transition-opacity group-hover:opacity-10" />
            </span>
            {!collapsed && (
              <>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] truncate text-sidebar-foreground">
                  {item.title}
                </span>
                {item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm shadow-emerald-500/20">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {!collapsed && (
              <div
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-all duration-300 group-hover:text-sidebar-foreground flex-shrink-0",
                  groupExpanded && "text-sidebar-primary rotate-180"
                )}
              >
                <ChevronDown />
              </div>
            )}
          </CollapsibleTrigger>

          <AnimatePresence>
            {!collapsed && groupExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 space-y-0.5 pl-2"
              >
                {item.children?.map((child) => (
                  <NavLink key={child.href} item={child} level={level + 1} isChild={true} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Collapsible>
      );
    }

    const linkElement = (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50 border-l-2",
          collapsed ? "justify-center" : "",
          isChild ? "pl-7 py-2 text-xs" : "",
          active
            ? "bg-sidebar-primary/15 text-sidebar-primary border-sidebar-primary font-semibold shadow-xs"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground border-transparent"
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200 relative overflow-hidden shrink-0",
            active ? "bg-sidebar-primary/20 ring-1 ring-sidebar-primary/40 text-sidebar-primary" : "bg-sidebar-accent/50 ring-1 ring-sidebar-border group-hover:ring-sidebar-ring/50 text-muted-foreground group-hover:text-sidebar-foreground"
          )}
        >
          <item.icon className="h-3.5 w-3.5 transition-all duration-200 group-hover:scale-110" />
        </span>
        {!collapsed && (
          <>
            <span className={cn("truncate transition-colors", active ? "text-sidebar-primary font-bold" : "text-muted-foreground group-hover:text-sidebar-foreground")}>
              {item.title}
            </span>
            {item.badge && (
              <span
                className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm shadow-emerald-500/20"
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed && !isChild) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {linkElement}
          </TooltipTrigger>
          <TooltipContent side="right" align="center" className="z-50">
            <span className="text-sm font-medium text-sidebar-foreground bg-sidebar-background px-3 py-1.5 rounded-lg shadow-lg">{item.title}</span>
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkElement;
  };

  return (
    <>
      {/* Mobile Backdrop & Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-sidebar-background border-r border-sidebar-border shadow-2xl lg:hidden text-sidebar-foreground"
              aria-label="Mobile Navigation Drawer"
            >
              <div className="flex items-center justify-between border-b border-sidebar-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-600 shadow-md">
                    <ShieldAlert className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-sidebar-foreground">Super Admin</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-sidebar-primary">Platform Control</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Switcher to Normal Dashboard */}
              <div className="px-3 pt-3 pb-1">
                <Link
                  href="/dashboard"
                  onClick={onMobileClose}
                  className="group flex items-center justify-between gap-2.5 rounded-xl bg-emerald-500/10 p-2.5 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 transition-all hover:ring-emerald-500 hover:bg-emerald-500/20 shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-bold text-sidebar-foreground truncate">Normal Dashboard</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 truncate">Open HRMS Workspace</div>
                    </div>
                  </div>
                  <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </Link>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {superAdminNavigation.map((item) => (
                  <div key={item.title} onClick={onMobileClose}>
                    <NavLink item={item} />
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <TooltipProvider>
        <motion.aside
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "relative z-30 hidden lg:flex flex-col shrink-0 h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300 text-sidebar-foreground",
            collapsed ? "w-16" : "w-[260px]"
          )}
          aria-label="Super Admin Navigation"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("relative flex items-center gap-3 border-b border-sidebar-border p-4", collapsed && "justify-center")}
          >
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal-600 shadow-lg shadow-primary/30"
            >
              <ShieldAlert className="h-5 w-5 text-primary-foreground" />
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar-background bg-emerald-500"
              />
            </motion.div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-w-0"
                >
                  <p className="truncate text-sm font-bold text-sidebar-foreground">Super Admin</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-sidebar-primary">Platform Control</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Prominent Switcher to Normal Dashboard */}
          {!collapsed ? (
            <div className="px-3 pt-3 pb-1">
              <Link
                href="/dashboard"
                className="group flex items-center justify-between gap-2.5 rounded-xl bg-emerald-500/10 p-2.5 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 transition-all hover:ring-emerald-500 hover:bg-emerald-500/20 shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-xs font-bold text-sidebar-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">Normal Dashboard</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 truncate">Open HRMS Workspace</div>
                  </div>
                </div>
                <ArrowRightLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ) : (
            <div className="flex justify-center pt-3 pb-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25 transition-all"
                  >
                    <Building2 className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" className="z-50">
                  <span className="text-xs font-bold text-sidebar-foreground bg-sidebar-background px-2.5 py-1 rounded shadow">Normal Dashboard</span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-label="Main navigation">
            {superAdminNavigation.map((group, index) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index, duration: 0.25 }}
              >
                <NavLink item={group} />
              </motion.div>
            ))}
          </nav>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn("border-t border-sidebar-border p-3 space-y-2", collapsed && "items-center")}
          >
            {/* Quick Switch to Normal Dashboard Pill */}
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 px-3 py-2 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30 transition-all hover:ring-emerald-500/60 hover:text-emerald-900 dark:hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title="Go to Normal Dashboard"
            >
              <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {!collapsed && (
                <span className="text-[11px] font-bold tracking-wide truncate">Go to Normal Dashboard</span>
              )}
            </Link>

            {/* User Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn("relative", collapsed && "flex justify-center")}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-sidebar-accent",
                      collapsed && "justify-center px-2"
                    )}
                    aria-expanded={false}
                    aria-haspopup="true"
                  >
                    <motion.div whileHover={{ scale: 1.1 }} className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.image || undefined} alt={user?.name || "Super Admin"} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-teal-600 text-[11px] font-black text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.div
                          key="expanded"
                          initial={{ opacity: 0, x: -20, width: 0 }}
                          animate={{ opacity: 1, x: 0, width: "auto" }}
                          exit={{ opacity: 0, x: -20, width: 0 }}
                          className="min-w-0 flex-1 text-left overflow-hidden"
                        >
                          <p className="truncate text-sm font-semibold text-sidebar-foreground leading-tight">{user?.name ?? "Super Admin"}</p>
                          <p className="truncate text-[11px] text-muted-foreground leading-tight">{user?.email ?? "admin@platform.com"}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </DropdownMenuTrigger>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      key="dropdown"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <DropdownMenuContent className="w-56 bg-popover border-border shadow-2xl" sideOffset={5}>
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1">Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="border-border" />
                        <Link href="/dashboard">
                          <DropdownMenuItem className="text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 cursor-pointer font-medium">
                            <Building2 className="h-4 w-4 mr-2" /> Normal Dashboard
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem className="text-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
                          <Settings2 className="h-4 w-4 mr-2" /> Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
                          <Shield className="h-4 w-4 mr-2" /> Security
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
                          <Bell className="h-4 w-4 mr-2" /> Notifications
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="border-border" />
                        <DropdownMenuItem
                          onClick={() => signOut({ callbackUrl: "/login" })}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10"
                        >
                          <LogOut className="h-4 w-4 mr-2" /> Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </DropdownMenu>
            </motion.div>

            {/* Collapse Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCollapsed(!collapsed)}
                  className={cn(
                    "h-8 w-8 rounded-lg text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    collapsed ? "ml-auto" : "mx-auto"
                  )}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  aria-expanded={!collapsed}
                >
                  <motion.div
                    initial={{ rotate: collapsed ? 90 : 0 }}
                    animate={{ rotate: collapsed ? 90 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  </motion.div>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side={collapsed ? "right" : "left"} align="center">
                <span className="text-sm font-medium text-sidebar-foreground bg-sidebar-background px-3 py-1.5 rounded-lg shadow-lg">
                  {collapsed ? "Expand sidebar" : "Collapse sidebar"}
                </span>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        </motion.aside>
      </TooltipProvider>
    </>
  );
}
