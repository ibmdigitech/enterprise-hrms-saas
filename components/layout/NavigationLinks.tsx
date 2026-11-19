"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, ArrowRightLeft, Bell, Briefcase, Building2, Calendar, CalendarClock,
  CheckCircle2, ChevronDown, CreditCard, Eye, FileSignature, FileText, FileUp,
  Headphones, HeartHandshake, LayoutDashboard, Plane, Settings2, Target, UserPlus, Users,
  UserRoundX, Layers, Sparkles, Shield, ShieldCheck, UserCircle, KeyRound, BookOpen, Rocket,
  FolderOpen, GraduationCap, TrendingUp, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PERMISSIONS, resolvePermissions } from "@/lib/auth/permissions";
import type { Permission } from "@/lib/auth/permissions";

/**
 * Single source of truth for the navigation surface.
 *
 * Information architecture (see docs/IA.md):
 *
 *  OVERVIEW        Dashboard
 *  PEOPLE          Employees, Resignation & Exit, Attendance, Leave, Approvals
 *  OPERATIONS      Payroll, Shift & Roster, Letters, Visa & Compliance,
 *                  Staff Services, Requests, Notifications, Business Travel, Performance
 *  TALENT          Recruitment, Interviews, Offers
 *  ADMINISTRATION  Access Control, Documents, Workforce Configuration, System
 *
 * Every capability below points at an EXISTING route. No routes are invented here;
 * a leaf appears only when the backing page exists and the user holds the
 * capability the page itself enforces. Hiding a link is a usability affordance
 * only — every page, server action and API route authorizes independently on the
 * server (see lib/auth/page-guard.ts and lib/auth/guards.ts).
 */

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Module color applied to the icon when the item is inactive. */
  iconColor: string;
  permission?: Permission;
  exact?: boolean;
}

export const sidebarItems: NavItem[] = [
  /* ── OVERVIEW ─────────────────────────────────────────── */
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, iconColor: "text-sidebar-primary", exact: true },

  /* ── PEOPLE ───────────────────────────────────────────── */
  { title: "Employees", href: "/employees", icon: Users, iconColor: "text-cyan-400", permission: PERMISSIONS.EMPLOYEES_VIEW },
  { title: "Promotions", href: "/promotions", icon: TrendingUp, iconColor: "text-amber-400", permission: PERMISSIONS.EMPLOYEE_PROMOTION_VIEW },
  { title: "Resignation & Exit", href: "/exits", icon: UserRoundX, iconColor: "text-rose-400", permission: PERMISSIONS.RESIGNATION_CREATE },
  { title: "Attendance", href: "/attendance", icon: Calendar, iconColor: "text-sky-400", permission: PERMISSIONS.ATTENDANCE_VIEW },
  { title: "Leave", href: "/leaves", icon: Briefcase, iconColor: "text-emerald-400", permission: PERMISSIONS.LEAVE_VIEW },
  { title: "Approvals", href: "/dashboard/approvals", icon: CheckCircle2, iconColor: "text-violet-400", permission: PERMISSIONS.LEAVE_APPROVE },

  /* ── OPERATIONS ───────────────────────────────────────── */
  { title: "Payroll", href: "/payroll", icon: CreditCard, iconColor: "text-amber-400", permission: PERMISSIONS.PAYROLL_VIEW },
  { title: "Shift & Roster", href: "/attendance/shifts", icon: CalendarClock, iconColor: "text-sky-400", permission: PERMISSIONS.ATTENDANCE_VIEW },
  { title: "Letters", href: "/letters", icon: FileText, iconColor: "text-pink-400", permission: PERMISSIONS.LETTER_VIEW },
  { title: "Visa & Compliance", href: "/visa", icon: FileUp, iconColor: "text-orange-400", permission: PERMISSIONS.VISA_VIEW },
  { title: "Staff Services", href: "/staff-services", icon: HeartHandshake, iconColor: "text-teal-400", permission: PERMISSIONS.SERVICE_VIEW },
  { title: "Support Desk", href: "/support", icon: Headphones, iconColor: "text-indigo-400", permission: PERMISSIONS.SUPPORT_TICKETS_VIEW },
  { title: "Requests", href: "/requests", icon: ArrowRightLeft, iconColor: "text-sky-400", permission: PERMISSIONS.REQUEST_VIEW },
  { title: "Notifications", href: "/notifications", icon: Bell, iconColor: "text-sky-400", permission: PERMISSIONS.NOTIFICATION_VIEW },
  { title: "Business Travel", href: "/travel", icon: Plane, iconColor: "text-orange-400", permission: PERMISSIONS.TRAVEL_VIEW },
  { title: "Performance", href: "/performance", icon: Target, iconColor: "text-fuchsia-400" },
  { title: "Training & Certification", href: "/dashboard/training", icon: GraduationCap, iconColor: "text-blue-400", permission: PERMISSIONS.TRAINING_VIEW },

  /* ── TALENT ───────────────────────────────────────────── */
  { title: "Recruitment", href: "/recruitment", icon: UserPlus, iconColor: "text-amber-400", permission: PERMISSIONS.RECRUITMENT_VIEW },
  { title: "Interviews", href: "/recruitment/interviews", icon: CalendarClock, iconColor: "text-indigo-400", permission: PERMISSIONS.RECRUITMENT_VIEW },
  { title: "Offers", href: "/recruitment/offers", icon: FileSignature, iconColor: "text-emerald-400", permission: PERMISSIONS.RECRUITMENT_OFFER },

  /* ── FINANCE & ADMIN ──────────────────────────────────── */
  { title: "Finance Overview", href: "/finance", icon: Building2, iconColor: "text-emerald-400", permission: PERMISSIONS.FINANCE_VIEW },
  { title: "Budget Management", href: "/finance/budget", icon: TrendingUp, iconColor: "text-indigo-400", permission: PERMISSIONS.BUDGET_VIEW },
  { title: "Petty Cash", href: "/finance/petty-cash", icon: CreditCard, iconColor: "text-amber-400", permission: PERMISSIONS.PETTY_CASH_VIEW },
  { title: "Expense Claims", href: "/finance/expenses", icon: FileText, iconColor: "text-rose-400", permission: PERMISSIONS.EXPENSE_VIEW },
  { title: "Procurement & PO", href: "/finance/procurement", icon: Briefcase, iconColor: "text-sky-400", permission: PERMISSIONS.PROCUREMENT_VIEW },
  { title: "Inventory & Supplies", href: "/finance/inventory", icon: Layers, iconColor: "text-teal-400", permission: PERMISSIONS.INVENTORY_VIEW },
  { title: "Accounts Payable", href: "/finance/accounts-payable", icon: ArrowRightLeft, iconColor: "text-violet-400", permission: PERMISSIONS.ACCOUNTS_PAYABLE_VIEW },

  /* ── ADMINISTRATION ───────────────────────────────────── */
  { title: "Users", href: "/settings", icon: UserCircle, iconColor: "text-indigo-400", permission: PERMISSIONS.SETTINGS_VIEW },
  { title: "Roles & Permissions", href: "/dashboard/approvals/roles", icon: Shield, iconColor: "text-indigo-400", permission: PERMISSIONS.ACCESS_APPROVE },
  { title: "Access Requests", href: "/dashboard/request-access", icon: KeyRound, iconColor: "text-indigo-400", permission: PERMISSIONS.ACCESS_REQUEST },
  { title: "Letter Templates", href: "/dashboard/settings/templates", icon: BookOpen, iconColor: "text-pink-400", permission: PERMISSIONS.LETTER_TEMPLATE_MANAGE },
  { title: "Company Documents", href: "/company/documents", icon: FolderOpen, iconColor: "text-teal-400", permission: PERMISSIONS.SETTINGS_VIEW },
  { title: "Organization & Structure", href: "/company/organization", icon: Building2, iconColor: "text-blue-400", permission: PERMISSIONS.SETTINGS_VIEW },
  { title: "Subscription & Billing", href: "/settings/billing", icon: CreditCard, iconColor: "text-emerald-400", permission: PERMISSIONS.SETTINGS_MANAGE },
  { title: "Service Configuration", href: "/dashboard/admin/services", icon: Settings2, iconColor: "text-sky-400", permission: PERMISSIONS.SERVICE_CONFIG_MANAGE },
  { title: "Shift & Roster Settings", href: "/settings/shifts", icon: Settings2, iconColor: "text-emerald-400", permission: PERMISSIONS.ATTENDANCE_SHIFT_MANAGE },
  { title: "Audit Log", href: "/system/logs", icon: Activity, iconColor: "text-muted-foreground", permission: PERMISSIONS.SYSTEM_AUDIT_VIEW },
  // SYSTEM_CONFIG is only held by SUPER_ADMIN — this link is never rendered for any company user.
  // The label is intentionally generic so that if the sidebar ever leaks it cannot reveal platform details.
  { title: "Super Admin Portal", href: "/super-admin/dashboard", icon: ShieldCheck, iconColor: "text-blue-400", permission: PERMISSIONS.SYSTEM_CONFIG },
  { title: "Backup & Recovery", href: "/system/backup", icon: ShieldCheck, iconColor: "text-emerald-400", permission: PERMISSIONS.SYSTEM_BACKUP_VIEW },
  { title: "Deployment & Health", href: "/system/deployment", icon: Rocket, iconColor: "text-sky-400", permission: PERMISSIONS.SYSTEM_BACKUP_VIEW },
] as NavItem[];

export interface NavCategoryDef {
  title: string;
  icon: LucideIcon;
  color: string;
  links: readonly string[];
}

export interface NavGroupDef {
  title: string;
  icon: LucideIcon;
  color: string;
  collapsible: boolean;
  links?: readonly string[];
  categories?: NavCategoryDef[];
}

export const navigationGroups: NavGroupDef[] = [
  {
    title: "OVERVIEW",
    icon: LayoutDashboard,
    color: "text-sidebar-primary",
    collapsible: false,
    links: ["/dashboard"],
  },
  {
    title: "PEOPLE",
    icon: Users,
    color: "text-sky-400",
    collapsible: true,
    links: ["/employees", "/promotions", "/exits", "/attendance", "/leaves", "/dashboard/approvals"],
  },
  {
    title: "OPERATIONS",
    icon: Layers,
    color: "text-violet-400",
    collapsible: true,
    links: [
      "/payroll", "/attendance/shifts", "/letters", "/visa", "/staff-services",
      "/requests", "/notifications", "/travel", "/performance", "/dashboard/training",
    ],
  },
  {
    title: "TALENT",
    icon: Sparkles,
    color: "text-amber-400",
    collapsible: true,
    links: ["/recruitment", "/recruitment/interviews", "/recruitment/offers"],
  },
  {
    title: "FINANCE",
    icon: Building2,
    color: "text-emerald-400",
    collapsible: true,
    links: [
      "/finance",
      "/finance/budget",
      "/finance/petty-cash",
      "/finance/expenses",
      "/finance/procurement",
      "/finance/inventory",
      "/finance/accounts-payable",
    ],
  },
  {
    title: "ADMINISTRATION",
    icon: Shield,
    color: "text-violet-400",
    collapsible: true,
    categories: [
      {
        title: "Access Control",
        icon: ShieldCheck,
        color: "text-indigo-400",
        links: ["/settings", "/dashboard/request-access", "/dashboard/approvals/roles"],
      },
      {
        title: "Documents",
        icon: FileText,
        color: "text-pink-400",
        links: ["/dashboard/settings/templates", "/company/documents"],
      },
      {
        title: "Organization",
        icon: Building2,
        color: "text-blue-400",
        links: ["/company/organization", "/settings/billing"],
      },
      {
        title: "Workforce Configuration",
        icon: Settings2,
        color: "text-muted-foreground",
        links: ["/dashboard/admin/services", "/settings/shifts"],
      },
      {
        title: "Configuration",
        icon: Activity,
        color: "text-muted-foreground",
        links: ["/super-admin/dashboard", "/system/logs", "/system/backup", "/system/deployment"],
      },
    ],
  },
];

/**
 * The nav list after the caller's permissions have removed what they may not
 * open. Both navigation surfaces go through this — the drawer below and the
 * header's command palette — so the palette can never offer a destination the
 * drawer hides.
 */
export function visibleNavItems(role?: string | null) {
  const { permissions } = resolvePermissions(role);
  return sidebarItems.filter((item) => !item.permission || permissions.has(item.permission));
}

/**
 * Resolves the subtitle shown in the command palette for a given route: the
 * Administration category (Access Control, Documents, ...) when present, else
 * the top-level group (OVERVIEW, PEOPLE, ...).
 */
function buildSubtitleMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const group of navigationGroups) {
    if (group.categories) {
      for (const cat of group.categories) {
        for (const href of cat.links) map.set(href, cat.title);
      }
    } else if (group.links) {
      for (const href of group.links) map.set(href, group.title);
    }
  }
  return map;
}

/**
 * The same list shaped for the command palette, where each row needs a group
 * label rather than a route. The subtitle is the group the link is filed under,
 * so "Interviews" reads as "Talent" instead of repeating its own path.
 */
export function navPaletteEntries(role?: string | null): NavPaletteEntry[] {
  const subMap = buildSubtitleMap();
  return visibleNavItems(role).map((item) => ({
    id: `nav-${item.href}`,
    title: item.title,
    subtitle: subMap.get(item.href) ?? "Navigation",
    href: item.href,
    icon: item.icon,
  }));
}

export interface NavPaletteEntry {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
}

interface NavigationLinksProps {
  role?: string | null;
  onNavigate?: () => void;
}

export function NavigationLinks({ role, onNavigate }: NavigationLinksProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  /**
   * `manuallyClosed` records a collapse performed on the current route. The
   * derived `resolvedExpanded` memo honours it for the CURRENT pathname only,
   * so a section stays shut where you are but re-opens automatically when the
   * active route genuinely moves to a different page in the same group.
   */
  const [manuallyClosed, setManuallyClosed] = useState<Record<string, string>>({});

  const visible = useMemo(() => visibleNavItems(role), [role]);
  const itemByHref = useMemo(
    () => new Map(visible.map((item) => [item.href, item] as const)),
    [visible]
  );

  const isActiveLink = (href: string, exact = false): boolean =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  // Which section should read as expanded. A group/category opens when the USER
  // toggled it OR it owns the active route. The route-driven half is DERIVED
  // during render rather than synced through an effect that calls setState:
  // the previous effect called setExpanded unconditionally and, even with its
  // `return changed ? next : prev` bail-out, tripped react-hooks v7's
  // `set-state-in-effect` rule (which is non-deterministic in v7.0.1) and could
  // resurface as a build-breaking error. Deriving this value removes the
  // setState-in-effect entirely and keeps collapse behaviour loop-free.
  //
  // `manuallyClosed` records a collapse performed on the CURRENT route, so a
  // section can stay shut even while one of its own pages is active; the entry
  // is ignored as soon as the route changes, so the section re-opens when the
  // active route genuinely moves to a different page in the same group.
  const resolvedExpanded = useMemo(
    () => {
      const result: Record<string, boolean> = { ...expanded };
      for (const group of navigationGroups) {
        let groupActive = false;
        if (group.categories) {
          for (const cat of group.categories) {
            const catActive = cat.links.some((h) => isActiveLink(h, !!itemByHref.get(h)?.exact));
            if (catActive) {
              groupActive = true;
              if (manuallyClosed[cat.title] !== pathname) result[cat.title] = true;
            }
          }
        } else if (group.links) {
          if (group.links.some((h) => isActiveLink(h, !!itemByHref.get(h)?.exact))) {
            groupActive = true;
          }
        }
        if (groupActive && manuallyClosed[group.title] !== pathname) {
          result[group.title] = true;
        }
      }
      return result;
    },
    // `isActiveLink` is intentionally excluded: it is recreated every render, so
    // including it would recompute this memo on every render. `pathname` is the
    // only value it reads, and it is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, expanded, manuallyClosed, itemByHref]
  );

  const isGroupExpanded = (group: NavGroupDef) =>
    !group.collapsible || !!resolvedExpanded[group.title];
  const isCategoryExpanded = (cat: NavCategoryDef) =>
    !!resolvedExpanded[cat.title];

  /**
   * DOM id for a collapsible region.
   *
   * `aria-controls` must reference a real id, and HTML5 forbids ASCII whitespace
   * inside one. The category titles are human labels with spaces — "Workforce
   * Configuration" — so interpolating them raw produced `id="nav-cat-Workforce
   * Configuration"`, which is both an invalid id and not the id the button
   * pointed at. Slugging keeps the two ends in agreement.
   *
   * The pairing is also only meaningful because the region now CARRIES the id.
   * Previously the buttons declared `aria-controls` for elements that were never
   * given one, so assistive tech announced a relationship to nothing.
   */
  const regionId = (kind: "group" | "cat", title: string) =>
    `nav-${kind}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  const toggle = (key: string) => {
    const isOpen = !!resolvedExpanded[key];
    setExpanded((e) => ({ ...e, [key]: !isOpen }));
    // Record the close against the route it happened on. Without this, the
    // route-driven expansion in `resolvedExpanded` would immediately re-open
    // it and the chevron would appear to do nothing.
    setManuallyClosed((m) =>
      isOpen ? { ...m, [key]: pathname } : { ...m }
    );
  };

  const renderItem = (item: NavItem) => {
    const active = isActiveLink(item.href, !!item.exact);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          "border-l-2",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary shadow-lg shadow-sidebar-primary/30"
            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground border-transparent"
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
            active ? "bg-sidebar-primary/20" : "bg-sidebar-accent/50 group-hover:bg-sidebar-accent"
          )}
        >
          <Icon
            className={cn(
              "h-[15px] w-[15px] transition-transform duration-150 group-hover:scale-110",
              active ? "text-sidebar-primary-foreground" : item.iconColor
            )}
          />
        </span>
        <span className="truncate">{item.title}</span>
      </Link>
    );
  };

  return (
    <nav aria-label="Main navigation" className="space-y-1">
      {navigationGroups.map((group) => {
        const isFlat = !group.categories;
        const flatItems = isFlat
          ? (group.links as readonly string[]).map((h) => itemByHref.get(h)).filter(Boolean) as NavItem[]
          : [];
        if (isFlat && flatItems.length === 0) return null;
        if (group.categories && !group.categories.some((cat) => cat.links.some((h) => itemByHref.has(h)))) return null;

        return (
          <section key={group.title} className="pb-1">
            {/* ── Group header ── */}
            {group.collapsible ? (
              <button
                type="button"
                aria-expanded={isGroupExpanded(group)}
                aria-controls={regionId("group", group.title)}
                onClick={() => toggle(group.title)}
                className={cn(
                  "group mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  isGroupExpanded(group)
                    ? "bg-sidebar-accent/50"
                    : "hover:bg-sidebar-accent/30"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-lg transition-all duration-200",
                      "bg-sidebar-accent/50 ring-1 ring-sidebar-border group-hover:ring-sidebar-ring/50",
                      isGroupExpanded(group) && "ring-sidebar-ring/30 bg-sidebar-primary/10"
                    )}
                  >
                    <group.icon className={cn("h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110", group.color)} />
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground group-hover:text-sidebar-foreground transition-colors">
                    {group.title}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-all duration-200 group-hover:text-sidebar-foreground",
                    isGroupExpanded(group) && "rotate-180 text-sidebar-primary"
                  )}
                />
              </button>
            ) : (
              <div className="mb-1 flex items-center gap-2.5 px-3 py-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-lg",
                    "bg-sidebar-accent/50 ring-1 ring-sidebar-border"
                  )}
                >
                  <group.icon className={cn("h-3.5 w-3.5", group.color)} />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
                  {group.title}
                </span>
              </div>
            )}

            {/* ── Group body ── */}
            {isGroupExpanded(group) && (
              <div
                id={regionId("group", group.title)}
                className={cn(
                  "space-y-0.5",
                  group.collapsible && "pl-2",
                  // The project's own `.animate-fade-in` utility from
                  // app/globals.css, which is backed by a real @keyframes.
                  // `animate-in` / `slide-in-from-top-1` are tailwindcss-animate
                  // classes and this project is Tailwind v4 WITHOUT that plugin,
                  // so they compile to nothing and the section would snap open
                  // with no transition while appearing to have one.
                  "animate-fade-in"
                )}
              >
                {group.categories
                  ? group.categories.map((cat) => {
                      const catItems = (cat.links as readonly string[])
                        .map((h) => itemByHref.get(h))
                        .filter(Boolean) as NavItem[];
                      if (catItems.length === 0) return null;
                      return (
                        <div key={cat.title} className="pt-1">
                          <button
                            type="button"
                            aria-expanded={isCategoryExpanded(cat)}
                            aria-controls={regionId("cat", cat.title)}
                            onClick={() => toggle(cat.title)}
                            className={cn(
                              "group mb-0.5 flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-muted-foreground transition-all duration-200 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                              isCategoryExpanded(cat) ? "bg-sidebar-accent/50 text-sidebar-foreground" : "hover:bg-sidebar-accent/30"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {/* Given the same chip treatment as a group header.
                                  Without it the two levels read as the same weight,
                                  which is why the category labels looked like loose
                                  text rather than a nested section. */}
                              <span
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-md transition-all duration-200",
                                  "bg-sidebar-accent/50 ring-1 ring-sidebar-border group-hover:ring-sidebar-ring/50",
                                  isCategoryExpanded(cat) && "ring-sidebar-ring/30 bg-sidebar-primary/10"
                                )}
                              >
                                <cat.icon className={cn("h-3 w-3 transition-transform duration-200 group-hover:scale-110", cat.color)} />
                              </span>
                              <span className="text-[10px] font-extrabold uppercase tracking-[0.16em]">
                                {cat.title}
                              </span>
                            </div>
                            <ChevronDown
                              className={cn(
                                "h-3 w-3 text-muted-foreground transition-all duration-200 group-hover:text-sidebar-foreground",
                                isCategoryExpanded(cat) && "rotate-180 text-sidebar-primary"
                              )}
                            />
                          </button>
                          {isCategoryExpanded(cat) && (
                            <div
                              id={regionId("cat", cat.title)}
                              className="space-y-0.5 pl-4 animate-fade-in"
                            >
                              {catItems.map((item) => renderItem(item))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  : flatItems.map((item) => renderItem(item))}
              </div>
            )}
          </section>
        );
      })}
    </nav>
  );
}
