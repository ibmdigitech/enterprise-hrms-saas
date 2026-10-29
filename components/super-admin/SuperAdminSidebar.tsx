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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  UserPlus,
  FileText,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  HelpCircle,
  ChevronUp,
} from "lucide-react";
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
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
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
    title: "Dashboard",
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
    title: "Modules",
    href: "/super-admin/modules",
    icon: Package,
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
}

export function SuperAdminSidebar({ user, mobileOpen = false, onMobileClose }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
// mobileOpen managed via props
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();

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
    if (href === "/super-admin/dashboard" || href === "/super-admin/companies") {
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

  // Render consistently on SSR and client to eliminate blank flash and layout shift

  const NavLink = ({ item, level = 0, isChild = false }: { item: SuperAdminNavItem; level?: number; isChild?: boolean }) => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const groupExpanded = isGroupExpanded(item);

    if (hasChildren && !isChild) {
      return (
        <Collapsible open={groupExpanded} onOpenChange={(open) => toggleGroup(item.title)}>
          <CollapsibleTrigger
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 cursor-pointer",
              collapsed ? "justify-center" : "",
              active || groupExpanded
                ? "bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-white border border-indigo-500/20 shadow-sm shadow-indigo-500/10"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-100 hover:border-white/10"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200 relative overflow-hidden",
                "bg-white/5 ring-1 ring-white/10 group-hover:ring-white/20",
                (active || groupExpanded) && "ring-indigo-500/30 bg-indigo-500/10"
              )}
            >
              <item.icon className={cn("h-3.5 w-3.5 transition-all duration-200 group-hover:scale-110", active && "text-indigo-400")} />
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 transition-opacity group-hover:opacity-10" />
            </span>
            {!collapsed && (
              <>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] truncate">
                  {item.title}
                </span>
                {item.badge && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-1.5 text-[10px] font-bold text-white shadow-sm shadow-indigo-500/20">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {!collapsed && (
              <div
                className={cn(
                  "h-3.5 w-3.5 text-slate-600 transition-all duration-300 group-hover:text-slate-400 flex-shrink-0",
                  groupExpanded && "text-indigo-400 rotate-180"
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
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 border-l-2",
          collapsed ? "justify-center" : "",
          isChild ? "pl-7 py-2 text-xs" : "",
          active
            ? "bg-indigo-600/20 text-white border-indigo-400 font-semibold shadow-md shadow-indigo-900/30"
            : "text-slate-400 hover:bg-white/8 hover:text-white hover:border-white/20 border-transparent"
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200 relative overflow-hidden shrink-0",
            active ? "bg-indigo-500/20 ring-1 ring-indigo-500/40 text-indigo-400" : "bg-white/5 ring-1 ring-white/10 group-hover:ring-white/20 group-hover:bg-white/10 text-slate-400 group-hover:text-white"
          )}
        >
          <item.icon className="h-3.5 w-3.5 transition-all duration-200 group-hover:scale-110" />
        </span>
        {!collapsed && (
          <>
            <span className={cn("truncate transition-colors", active ? "text-white" : "text-slate-300 group-hover:text-white")}>
              {item.title}
            </span>
            {item.badge && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-1.5 text-[10px] font-bold text-white shadow-sm shadow-indigo-500/20 ml-auto"
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
            <span className="text-sm font-medium text-slate-900 bg-white px-3 py-1.5 rounded-lg shadow-lg">{item.title}</span>
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
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-slate-950 border-r border-slate-800 shadow-2xl lg:hidden"
              aria-label="Mobile Navigation Drawer"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
                    <ShieldAlert className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Super Admin</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">Platform Control</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onMobileClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
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
            "relative z-30 hidden lg:flex flex-col shrink-0 h-screen bg-slate-950 border-r border-slate-800/60 transition-all duration-300",
            collapsed ? "w-16" : "w-[260px]"
          )}
          aria-label="Super Admin Navigation"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("relative flex items-center gap-3 border-b border-slate-800/50 p-4", collapsed && "justify-center")}
          >
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30"
            >
              <ShieldAlert className="h-5 w-5 text-white" />
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-500"
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
                  <p className="truncate text-sm font-bold text-white bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Super Admin</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-400">Platform Control</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
            {superAdminNavigation.map((group, index) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.3 }}
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
            className={cn("border-t border-slate-800/50 p-3 space-y-3", collapsed && "items-center")}
          >
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
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/5",
                      collapsed && "justify-center px-2"
                    )}
                    aria-expanded={false}
                    aria-haspopup="true"
                  >
                    <motion.div whileHover={{ scale: 1.1 }} className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.image || undefined} alt={user?.name || "Super Admin"} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-[11px] font-black">
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
                          <p className="truncate text-sm font-semibold text-slate-100 leading-tight">{user?.name ?? "Super Admin"}</p>
                          <p className="truncate text-[11px] text-slate-500 leading-tight">{user?.email ?? "admin@platform.com"}</p>
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
                      <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 shadow-2xl" sideOffset={5}>
                        <DropdownMenuLabel className="text-xs font-semibold text-slate-400 px-2 py-1">Account</DropdownMenuLabel>
                        <DropdownMenuSeparator className="border-slate-800" />
                        <DropdownMenuItem className="text-slate-300 hover:bg-indigo-500/10 hover:text-white">
                          <Settings2 className="h-4 w-4 mr-2" /> Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 hover:bg-indigo-500/10 hover:text-white">
                          <Shield className="h-4 w-4 mr-2" /> Security
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 hover:bg-indigo-500/10 hover:text-white">
                          <Bell className="h-4 w-4 mr-2" /> Notifications
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="border-slate-800" />
                        <DropdownMenuItem
                          onClick={() => signOut({ callbackUrl: "/login" })}
                          className="text-rose-400 hover:bg-rose-500/10 focus:bg-rose-500/10"
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
                    "h-8 w-8 rounded-lg text-slate-500 transition-all hover:bg-white/5 hover:text-slate-200",
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
                <span className="text-sm font-medium text-slate-900 bg-white px-3 py-1.5 rounded-lg shadow-lg">
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