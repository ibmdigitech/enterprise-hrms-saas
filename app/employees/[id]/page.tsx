import Link from "next/link";
import {
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Mail,
    MapPin,
    Phone,
    ShieldAlert,
    ShieldCheck,
    UserCircle,
    Users,
    TrendingUp,
    Wallet,
    Clock,
    CreditCard,
    FileText,
    AlertTriangle,
    HeartPulse,
    BadgeCheck,
    Landmark,
    FileCheck,
    Sparkles,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { requirePageUser } from "@/lib/auth/page-guard";
import { PERMISSIONS, resolvePermissions } from "@/lib/auth/permissions";
import { scopeEmployeeWhere } from "@/lib/auth/scope";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";
import { classifyEmployeeState } from "@/lib/workflow/lifecycle-consistency";
import { EmployeeAvatar } from "../employee-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROFILE_SELECT, FULL_SELECT } from "./employee-select";
import { LIFECYCLE_STAGE, UNKNOWN_STAGE } from "./lifecycle-stage";
import { PromotionDialog } from "./promotion-dialog";
import { PromotionHistoryTable } from "./promotion-history-table";
import { PrintButton } from "./PrintButton";
import { CopyButton } from "./CopyButton";

/**
 * /employees/[id] — Enterprise Employee 360° Profile Hub.
 *
 * AUTHORIZATION HAPPENS BEFORE ANY RENDER AND BEFORE ANY QUERY
 *  - No session            -> `requirePageUser` redirects to /login.
 *  - No capability         -> an explicit unauthorized state; nothing is
 *                             queried, so the page cannot confirm that a
 *                             particular employee exists.
 *  - Out of scope / absent -> an explicit not-found state. The organisational
 *                             predicate is part of the `where` clause, so the
 *                             two cases are indistinguishable to the viewer —
 *                             see the note in `app/api/employees/[id]/route.ts`.
 *
 * LIFECYCLE IS THE HEADLINE, NOT `currentStatus`
 * The directory badge is `Employee.currentStatus`, which the entry/edit form
 * and offboarding both write WITHOUT advancing the stage, so it is the
 * non-authoritative column. `Employee.lifecycle` is the one the CHECK
 * constraint and `LIFECYCLE_TRANSITIONS` govern, so it is what this page leads
 * with. `currentStatus` and `isActive` appear only inside the consistency
 * panel, and only as evidence of a disagreement — this page introduces no
 * fourth status badge and no new state column.
 */

export const dynamic = "force-dynamic";

function formatDate(value: Date | string | null | undefined): string {
    if (!value) return "—";
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function calculateTenure(joiningDate: Date | string | null | undefined): string {
    if (!joiningDate) return "Pending start";
    const start = typeof joiningDate === "string" ? new Date(joiningDate) : joiningDate;
    if (Number.isNaN(start.getTime())) return "Pending start";
    const now = new Date();
    if (now < start) return "Pre-joining";

    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (diffMonths < 1) return "New Joiner (< 1 mo)";
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    if (years === 0) return `${months} mo${months > 1 ? "s" : ""}`;
    if (months === 0) return `${years} yr${years > 1 ? "s" : ""}`;
    return `${years} yr${years > 1 ? "s" : ""} ${months} mo${months > 1 ? "s" : ""}`;
}

type DocComplianceStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "NOT_ON_FILE";

function getDocumentStatus(expiry: Date | string | null | undefined): {
    status: DocComplianceStatus;
    label: string;
    badgeClass: string;
    daysRemaining: number | null;
} {
    if (!expiry) {
        return {
            status: "NOT_ON_FILE",
            label: "Not on file",
            badgeClass: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
            daysRemaining: null,
        };
    }
    const date = typeof expiry === "string" ? new Date(expiry) : expiry;
    if (Number.isNaN(date.getTime())) {
        return {
            status: "NOT_ON_FILE",
            label: "Not on file",
            badgeClass: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700",
            daysRemaining: null,
        };
    }

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (days < 0) {
        return {
            status: "EXPIRED",
            label: `Expired (${Math.abs(days)}d ago)`,
            badgeClass: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800",
            daysRemaining: days,
        };
    }
    if (days <= 30) {
        return {
            status: "EXPIRING_SOON",
            label: `Expires in ${days}d`,
            badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
            daysRemaining: days,
        };
    }
    return {
        status: "VALID",
        label: `Valid (${days}d left)`,
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        daysRemaining: days,
    };
}

function Section({
    title,
    icon: Icon,
    badge,
    children,
    className = "",
}: {
    title: string;
    icon: typeof Users;
    badge?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 sm:p-7 shadow-sm transition-all hover:shadow-md ${className}`}>
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </div>
                    {title}
                </h2>
                {badge}
            </div>
            {children}
        </section>
    );
}

function Field({
    label,
    value,
    subtext,
    copyable = false,
    className = "",
}: {
    label: string;
    value: React.ReactNode;
    subtext?: string;
    copyable?: boolean;
    className?: string;
}) {
    const isBlank = value === null || value === undefined || value === "" || value === "—";
    return (
        <div className={`min-w-0 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/40 p-3.5 transition-colors hover:border-slate-200 dark:hover:border-slate-700/60 ${className}`}>
            <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                {label}
            </dt>
            <dd className="mt-1 flex items-center justify-between gap-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                <div className="min-w-0 truncate">
                    {isBlank ? (
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-600 italic">Not on file</span>
                    ) : (
                        value
                    )}
                    {subtext && <span className="block text-[11px] font-normal text-slate-400 dark:text-slate-500 mt-0.5">{subtext}</span>}
                </div>
                {!isBlank && copyable && typeof value === "string" && (
                    <CopyButton text={value} label={label} />
                )}
            </dd>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Terminal states                                                      */
/* ------------------------------------------------------------------ */

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
            <Link
                href="/employees"
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Back to directory
            </Link>
            {children}
        </div>
    );
}

function UnauthorizedState() {
    return (
        <Shell>
            <div
                role="alert"
                className="rounded-[2rem] border-2 border-amber-300 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-950/40 md:p-12 shadow-sm"
            >
                <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white md:text-2xl">
                    Not authorized
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-600 dark:text-slate-300">
                    Your role cannot open employee profiles. Nothing was loaded. If you believe this
                    is wrong, ask an administrator to review your access.
                </p>
                <Button
                    asChild
                    className="mt-6 h-11 rounded-xl bg-indigo-600 px-6 font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-md"
                >
                    <Link href="/dashboard">Back to dashboard</Link>
                </Button>
            </div>
        </Shell>
    );
}

function NotFoundState() {
    return (
        <Shell>
            {/* Deliberately not a 403. Whether the record is missing or simply
                outside the viewer's scope, the answer is the same — otherwise
                this page confirms who works for the company to anyone who can
                guess an id. */}
            <div
                role="status"
                className="rounded-[2rem] border-2 border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-950 md:p-12 shadow-sm"
            >
                <UserCircle className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" aria-hidden="true" />
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white md:text-2xl">
                    Employee not found
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
                    This record does not exist, or it is outside the part of the workforce your role
                    can see.
                </p>
                <Button
                    asChild
                    className="mt-6 h-11 rounded-xl bg-indigo-600 px-6 font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-md"
                >
                    <Link href="/employees">Back to directory</Link>
                </Button>
            </div>
        </Shell>
    );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { user, subject } = await requirePageUser();

    const { permissions } = resolvePermissions(user.role);
    // Mirrors the API route exactly. `employees.view` is the directory
    // capability; `leave.view` is what makes a MANAGER (approves their team's
    // leave) and a STAFF member (reads their own record) legitimate readers of
    // a single profile. FINANCE holds neither and belongs on the payroll
    // surface, not here.
    const canReadProfile =
        permissions.has(PERMISSIONS.EMPLOYEES_VIEW) || permissions.has(PERMISSIONS.LEAVE_VIEW);

    if (!canReadProfile) {
        await logSecurityEvent({
            action: SECURITY_ACTION.ACCESS_DENIED,
            actorEmail: user.email,
            actorRole: user.role,
            target: "page:employee-detail",
            outcome: "DENIED",
        });
        return <UnauthorizedState />;
    }

    const { id } = await params;
    const isSelf = subject.employeeId === id;
    const canViewRestricted = permissions.has(PERMISSIONS.EMPLOYEES_VIEW) || isSelf;

    // Scope is part of the query, not a filter applied afterwards. Hoisted so
    // it is visibly built once, before either branch runs.
    //
    // The requested id and the scope clause are ANDed rather than merged:
    // `scopeEmployeeWhere(subject, { id })` would, under SELF scope, return
    // `{ id: subject.employeeId }` and silently REPLACE the requested id, so
    // visiting another employee's URL would render your own record with a 200
    // instead of the not-found state. `AND` makes an out-of-scope id match no
    // row at all, which is what the guard comment above claims.
    const where = { AND: [{ id }, scopeEmployeeWhere(subject)] };

    // The discriminant is what lets TypeScript keep the two result shapes
    // apart. Without it the ternary collapses to one shape and the restricted
    // block below would either not typecheck or be forced behind a cast.
    const result = canViewRestricted
        ? {
              restricted: true as const,
              employee: await prisma.employee.findFirst({ where, select: FULL_SELECT }),
          }
        : {
              restricted: false as const,
              employee: await prisma.employee.findFirst({ where, select: PROFILE_SELECT }),
          };

    if (!result.employee) return <NotFoundState />;

    const { employee } = result;
    /** Null for a caller without `employees.view`; the whole-shape record for one with it. */
    const restricted = result.restricted ? result.employee : null;

    const stage = LIFECYCLE_STAGE[employee.lifecycle] ?? UNKNOWN_STAGE;
    const divergences = classifyEmployeeState({
        id: employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        lifecycle: employee.lifecycle,
        currentStatus: employee.currentStatus,
        isActive: employee.isActive,
    });

    const [promotions, leaveRequests, auditLogs] = await Promise.all([
        prisma.employeePromotion.findMany({
            where: { employeeId: id },
            orderBy: { effectiveDate: "desc" },
        }),
        prisma.leaveRequest.findMany({
            where: { employeeId: id },
            orderBy: { createdAt: "desc" },
            take: 10,
        }),
        prisma.auditLog.findMany({
            where: { employeeId: id },
            orderBy: { createdAt: "desc" },
            take: 8,
        }),
    ]);

    const canRequestPromotion = permissions.has(PERMISSIONS.EMPLOYEE_PROMOTION_CREATE);

    // UAE Statutory Compliance Documents
    const documents = [
        { label: "Passport", expiry: employee.passportExpiry, number: restricted?.passportNumber },
        { label: "Emirates ID", expiry: employee.emiratesIdExpiry, number: restricted?.emiratesId },
        { label: "Visa", expiry: employee.visaExpiry, number: restricted?.visaNumber, extra: employee.visaType },
        { label: "Medical insurance", expiry: employee.medicalInsuranceExpiry, number: null },
        { label: "ILOE insurance", expiry: employee.iloeInsuranceExpiry, number: null },
        { label: "Labour Card", expiry: employee.labourCardExpiry, number: restricted?.labourCardNumber },
        { label: "Residence Permit", expiry: employee.residencePermitExpiry, number: restricted?.residencePermitNumber },
    ];

    const docsOnRecord = documents.filter((d) => d.expiry !== null).length;
    const tenureString = calculateTenure(employee.joiningDate);

    // Compensation calculation
    const basicPay = restricted?.basicSalary ?? 0;
    const housingPay = restricted?.housingAllowance ?? 0;
    const transportPay = restricted?.transportAllowance ?? 0;
    const otherPay = restricted?.otherAllowance ?? 0;
    const totalMonthlyCompensation = basicPay + housingPay + transportPay + otherPay;
    const hasCompensationData = totalMonthlyCompensation > 0;

    return (
        <div className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-8">
            {/* Top Navigation & Action Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Link
                        href={permissions.has(PERMISSIONS.EMPLOYEES_VIEW) ? "/employees" : "/dashboard"}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {permissions.has(PERMISSIONS.EMPLOYEES_VIEW) ? "Directory" : "Dashboard"}
                    </Link>
                    <span className="text-slate-300 dark:text-slate-700">/</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Profile: {employee.firstName} {employee.lastName}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <PrintButton />
                    {canRequestPromotion && (
                        <PromotionDialog
                            employee={{
                                id: employee.id,
                                firstName: employee.firstName,
                                lastName: employee.lastName,
                                designation: employee.designation,
                                department: employee.department,
                                basicSalary: restricted ? restricted.basicSalary : null,
                                housingAllowance: restricted ? restricted.housingAllowance : null,
                                transportAllowance: restricted ? restricted.transportAllowance : null,
                                otherAllowance: restricted ? restricted.otherAllowance : null,
                            }}
                        />
                    )}
                    {permissions.has(PERMISSIONS.EMPLOYEES_VIEW) && (
                        <Link href="/employees">
                            <Button
                                variant="default"
                                className="h-10 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 font-bold text-xs uppercase tracking-wider text-white shadow-sm"
                            >
                                <Users className="h-4 w-4" aria-hidden="true" />
                                All Employees
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* ── Executive Hero Profile Header ───────────────────────── */}
            <section
                aria-labelledby="lifecycle-heading"
                className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-900 p-6 sm:p-8 text-white shadow-2xl"
            >
                {/* Decorative background glow blobs */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left: Avatar & Identity Details */}
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <div className="relative shrink-0">
                            <EmployeeAvatar
                                employee={employee}
                                className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-white/10 shadow-2xl rounded-3xl"
                                fallbackClassName="text-2xl sm:text-3xl font-black"
                            />
                            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 shadow-md">
                                <BadgeCheck className="h-4 w-4 text-emerald-400" />
                            </div>
                        </div>

                        <div className="min-w-0 space-y-2">
                            {/* Authoritative Stage Badge & Note */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <Badge
                                    className={`rounded-xl border-0 px-3.5 py-1 text-xs font-black uppercase tracking-widest shadow-sm flex items-center gap-1.5 ${stage.badge}`}
                                >
                                    <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                                    {employee.lifecycle.replace(/_/g, " ")}
                                </Badge>
                                <span className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    Employee.lifecycle
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                                    Lifecycle stage — authoritative
                                </span>
                            </div>

                            {/* Full Name & Designation */}
                            <div>
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
                                    {employee.firstName} {employee.lastName}
                                </h1>
                                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm sm:text-base font-semibold text-slate-300">
                                    <span>{employee.designation || "Designation Unassigned"}</span>
                                    <span className="text-slate-600">•</span>
                                    <span className="text-indigo-300">{employee.department || "General"}</span>
                                    {employee.workLocation && (
                                        <>
                                            <span className="text-slate-600">•</span>
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                                                <MapPin className="h-3 w-3 text-slate-400" />
                                                {employee.workLocation}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Stage Note */}
                            <p className="max-w-2xl text-xs font-medium text-slate-400 leading-relaxed">
                                {stage.note}
                            </p>

                            {/* Tag Chips */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                {employee.rollNumber && (
                                    <div className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-mono font-bold text-slate-200">
                                        <span className="text-[9px] uppercase tracking-wider text-slate-400">Roll:</span>
                                        {employee.rollNumber}
                                        <CopyButton text={employee.rollNumber} label="Roll number" className="text-slate-400 hover:text-white" />
                                    </div>
                                )}
                                {employee.employeeCode && (
                                    <div className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-mono font-bold text-slate-200">
                                        <span className="text-[9px] uppercase tracking-wider text-slate-400">Code:</span>
                                        {employee.employeeCode}
                                        <CopyButton text={employee.employeeCode} label="Employee code" className="text-slate-400 hover:text-white" />
                                    </div>
                                )}
                                {employee.employmentType && (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 border border-indigo-400/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                                        <Briefcase className="h-3 w-3 text-indigo-300" />
                                        {employee.employmentType.replace(/_/g, " ")}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick Direct Contact Hub */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-md">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Direct Contact
                        </span>
                        {employee.email && (
                            <a
                                href={`mailto:${employee.email}`}
                                className="inline-flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
                            >
                                <span className="inline-flex items-center gap-1.5 truncate">
                                    <Mail className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                    <span className="truncate max-w-[180px]">{employee.email}</span>
                                </span>
                                <CopyButton text={employee.email} label="Email" className="text-slate-400 hover:text-white" />
                            </a>
                        )}
                        {employee.phone ? (
                            <a
                                href={`tel:${employee.phone}`}
                                className="inline-flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
                            >
                                <span className="inline-flex items-center gap-1.5 truncate">
                                    <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                    <span>{employee.phone}</span>
                                </span>
                                <CopyButton text={employee.phone} label="Phone" className="text-slate-400 hover:text-white" />
                            </a>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-normal text-slate-400 italic">
                                <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                Phone pending
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Divergence Record Consistency Audit ─────────────────── */}
                {divergences.length > 0 && (
                    <div className="mt-6 rounded-2xl border-2 border-amber-400/80 bg-amber-950/60 p-4.5 text-amber-200">
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-300">
                            <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                            Record consistency — the columns disagree
                        </h3>
                        <p className="mt-1 text-xs text-amber-300/80">
                            The database detected mismatched state across legacy columns. The authoritative stage is <code className="font-bold text-amber-200">Employee.lifecycle</code>.
                        </p>
                        <ul className="mt-3 space-y-2">
                            {divergences.map((finding) => (
                                <li key={finding.code} className="rounded-xl bg-amber-900/40 border border-amber-800/60 p-2.5 text-xs text-amber-100">
                                    <span className="font-mono font-black uppercase tracking-wider text-amber-300">
                                        [{finding.code}]
                                    </span>
                                    <span className="ml-2 font-medium">{finding.detail}</span>
                                    <span className="mt-1 block text-[11px] font-bold uppercase tracking-wider text-amber-300/90">
                                        Non-authoritative column values — currentStatus: {finding.currentStatus} · isActive:{" "}
                                        {String(finding.isActive)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {/* ── Executive 4-Stat Metric Strip ───────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1: Tenure & Joining */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tenure &amp; Service</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            <Calendar className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-xl font-black text-slate-900 dark:text-white">{tenureString}</span>
                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Joined {formatDate(employee.joiningDate)}
                        </span>
                    </div>
                </div>

                {/* 2: Probation & Confirmation */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Probation Term</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                            {employee.probationDays ? `${employee.probationDays} Days` : "90 Days"}
                        </span>
                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            {employee.lifecycle === "CONFIRMED" || employee.lifecycle === "ACTIVE"
                                ? "Confirmed Permanent"
                                : "Active Evaluation Term"}
                        </span>
                    </div>
                </div>

                {/* 3: Reporting Manager */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Direct Supervisor</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-base font-black truncate block text-slate-900 dark:text-white">
                            {employee.manager
                                ? `${employee.manager.firstName} ${employee.manager.lastName}`
                                : "Executive Level"}
                        </span>
                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {employee.manager?.department ? `${employee.manager.department} Dept` : "Direct Board Reporting"}
                        </span>
                    </div>
                </div>

                {/* 4: Statutory Compliance Health */}
                <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4.5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">UAE Compliance</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                            {docsOnRecord} / {documents.length} Files
                        </span>
                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            {docsOnRecord >= 5 ? "Statutory Compliant" : "Documentation Pending"}
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Main Profile Bento Grid ─────────────────────────────── */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* 1: Personal & Contact Information */}
                <Section
                    title="Contact & Personal Information"
                    icon={Phone}
                    badge={
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Direct Records
                        </span>
                    }
                >
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field
                            label="Email"
                            value={
                                employee.email ? (
                                    <a href={`mailto:${employee.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                                        {employee.email}
                                    </a>
                                ) : null
                            }
                            copyable={Boolean(employee.email)}
                        />
                        <Field
                            label="Mobile"
                            value={
                                employee.phone ? (
                                    <a href={`tel:${employee.phone}`} className="text-slate-800 dark:text-slate-100 hover:underline">
                                        {employee.phone}
                                    </a>
                                ) : null
                            }
                            copyable={Boolean(employee.phone)}
                        />
                        <Field label="Gender" value={employee.gender} />
                        <Field label="Blood group" value={employee.bloodGroup} />
                        <Field label="Marital status" value={employee.maritalStatus} />
                        <div className="sm:col-span-2">
                            <Field
                                label="Current address"
                                value={employee.address}
                                subtext={employee.address ? "Active residential address" : undefined}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <Field
                                label="Permanent address"
                                value={employee.permanentAddress}
                                subtext={employee.permanentAddress ? "Official home country address" : undefined}
                            />
                        </div>
                    </dl>

                    <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <h3 className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Emergency Contact Protocol
                        </h3>
                        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field
                                label="Emergency contact"
                                value={employee.emergencyContact}
                                subtext={employee.emergencyContact ? "Designated emergency guardian" : undefined}
                            />
                            <Field
                                label="Emergency phone"
                                value={
                                    employee.emergencyPhone ? (
                                        <a href={`tel:${employee.emergencyPhone}`} className="text-rose-600 dark:text-rose-400 hover:underline">
                                            {employee.emergencyPhone}
                                        </a>
                                    ) : null
                                }
                                copyable={Boolean(employee.emergencyPhone)}
                            />
                        </dl>
                    </div>
                </Section>

                {/* 2: Employment & Organizational Details */}
                <Section
                    title="Employment & Organization"
                    icon={Briefcase}
                    badge={
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Corporate Hierarchy
                        </span>
                    }
                >
                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Designation" value={employee.designation} />
                        <Field label="Department" value={employee.department} />
                        <Field
                            label="Joined"
                            value={
                                <span className="inline-flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden="true" />
                                    {formatDate(employee.joiningDate)}
                                </span>
                            }
                            subtext={employee.joiningDate ? `Calculated service: ${tenureString}` : undefined}
                        />
                        <Field
                            label="Employment type"
                            value={employee.employmentType?.replace(/_/g, " ")}
                        />
                        <Field
                            label="Work location"
                            value={
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                                    {employee.workLocation}
                                </span>
                            }
                        />
                        <Field
                            label="Probation days"
                            value={employee.probationDays ? `${employee.probationDays} Days` : null}
                        />
                        <Field
                            label="Reports to"
                            value={
                                employee.manager
                                    ? `${employee.manager.firstName} ${employee.manager.lastName}`
                                    : null
                            }
                        />
                        <Field
                            label="Manager department"
                            value={employee.manager?.department}
                        />
                    </dl>

                    <div className="mt-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4">
                        <div className="flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <span className="font-bold text-indigo-950 dark:text-indigo-200">Corporate Master Assignment:</span>
                                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                                    Assigned to <span className="font-semibold text-slate-900 dark:text-white">{employee.department || "General Department"}</span> under work location <span className="font-semibold text-slate-900 dark:text-white">{employee.workLocation || "Head Office"}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 3: UAE Statutory Documents & Expiry Compliance */}
                <Section
                    title="Document expiry & UAE Compliance"
                    icon={ShieldCheck}
                    badge={
                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300">
                            {docsOnRecord} / {documents.length} Registered
                        </Badge>
                    }
                >
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {documents.map((doc) => {
                                const status = getDocumentStatus(doc.expiry);
                                return (
                                    <div
                                        key={doc.label}
                                        className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-3.5 flex flex-col justify-between"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                                {doc.label}
                                            </span>
                                            <Badge
                                                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border ${status.badgeClass}`}
                                            >
                                                {status.label}
                                            </Badge>
                                        </div>

                                        <div className="mt-2">
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {doc.expiry ? formatDate(doc.expiry) : "Not on file"}
                                            </div>
                                            {doc.number && (
                                                <div className="mt-1 flex items-center justify-between text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span>No: {doc.number}</span>
                                                    <CopyButton text={doc.number} label={doc.label} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <Field label="Visa type" value={employee.visaType} />
                            <Field
                                label="Compliance Status"
                                value={docsOnRecord >= 5 ? "Fully Documented" : "Action Required"}
                                subtext="UAE Labour & Residency Standard"
                            />
                        </div>

                        {!canViewRestricted && (
                            <p className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                Document numbers, government ID, date of birth and nationality are not
                                shown at your access level.
                            </p>
                        )}
                    </div>
                </Section>

                {/* 4: Compensation & Restricted Banking (for employees.view holders) */}
                {restricted ? (
                    <Section
                        title="Restricted records & Compensation"
                        icon={Wallet}
                        badge={
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                Authorized Access
                            </Badge>
                        }
                    >
                        {/* Financial Gross CTC Card */}
                        <div className="mb-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-4 sm:p-5 text-white border border-emerald-800/40 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                                    Gross Monthly Compensation
                                </span>
                                <Wallet className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div className="mt-2 flex flex-wrap items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-black text-white">
                                    {hasCompensationData
                                        ? `AED ${totalMonthlyCompensation.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : "Compensation Pending Setup"}
                                </span>
                                {hasCompensationData && (
                                    <span className="text-xs font-medium text-emerald-300">
                                        / month · Est. Annual: AED {(totalMonthlyCompensation * 12).toLocaleString("en-GB", { minimumFractionDigits: 0 })}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Pay Components */}
                        <div className="mb-4">
                            <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">
                                Monthly pay components
                            </dt>
                            <dd className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                    <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xs">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Basic</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                                            {typeof restricted.basicSalary === "number" ? `AED ${restricted.basicSalary.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                                        </span>
                                        {hasCompensationData && typeof restricted.basicSalary === "number" && totalMonthlyCompensation > 0 && (
                                            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1 block">
                                                {((restricted.basicSalary / totalMonthlyCompensation) * 100).toFixed(0)}% of package
                                            </span>
                                        )}
                                    </div>
                                    <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xs">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Housing</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                                            {typeof restricted.housingAllowance === "number" ? `AED ${restricted.housingAllowance.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                                        </span>
                                        {hasCompensationData && typeof restricted.housingAllowance === "number" && totalMonthlyCompensation > 0 && (
                                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1 block">
                                                {((restricted.housingAllowance / totalMonthlyCompensation) * 100).toFixed(0)}% of package
                                            </span>
                                        )}
                                    </div>
                                    <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xs">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transport</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                                            {typeof restricted.transportAllowance === "number" ? `AED ${restricted.transportAllowance.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                                        </span>
                                        {hasCompensationData && typeof restricted.transportAllowance === "number" && totalMonthlyCompensation > 0 && (
                                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                                                {((restricted.transportAllowance / totalMonthlyCompensation) * 100).toFixed(0)}% of package
                                            </span>
                                        )}
                                    </div>
                                    <div className="rounded-xl bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-slate-800 shadow-xs">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Other</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                                            {typeof restricted.otherAllowance === "number" ? `AED ${restricted.otherAllowance.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
                                        </span>
                                        {hasCompensationData && typeof restricted.otherAllowance === "number" && totalMonthlyCompensation > 0 && (
                                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-1 block">
                                                {((restricted.otherAllowance / totalMonthlyCompensation) * 100).toFixed(0)}% of package
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </dd>
                        </div>

                        {/* Banking & Identity Fields */}
                        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field label="Bank" value={restricted.bankName} />
                            <Field label="Account number" value={restricted.accountNumber} copyable={Boolean(restricted.accountNumber)} />
                            <div className="sm:col-span-2">
                                <Field label="IBAN" value={restricted.iban} copyable={Boolean(restricted.iban)} />
                            </div>
                            <Field label="IFSC" value={restricted.ifscCode} copyable={Boolean(restricted.ifscCode)} />
                            <Field label="Date of birth" value={formatDate(restricted.dateOfBirth)} />
                            <Field label="Nationality" value={restricted.nationality} />
                            <div className="sm:col-span-2">
                                <Field label="Government ID" value={restricted.governmentId} copyable={Boolean(restricted.governmentId)} />
                            </div>
                            <Field label="Passport number" value={restricted.passportNumber} copyable={Boolean(restricted.passportNumber)} />
                            <Field label="Emirates ID" value={restricted.emiratesId} copyable={Boolean(restricted.emiratesId)} />
                            <div className="sm:col-span-2">
                                <Field label="Visa number" value={restricted.visaNumber} copyable={Boolean(restricted.visaNumber)} />
                            </div>
                        </dl>
                    </Section>
                ) : (
                    <Section
                        title="Restricted records"
                        icon={Wallet}
                        badge={<Badge variant="outline">Restricted</Badge>}
                    >
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-6 text-center">
                            <ShieldAlert className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                Detailed compensation, banking data, and restricted identity documents require HR/Admin elevated permissions.
                            </p>
                        </div>
                    </Section>
                )}
            </div>

            {/* ── Career & Employment (Promotions) ────────────────────── */}
            <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-xs">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                                Career Progression &amp; Promotion History
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Track official title advancements, compensation updates, and promotion letters.
                            </p>
                        </div>
                    </div>

                    {canRequestPromotion && (
                        <PromotionDialog
                            employee={{
                                id: employee.id,
                                firstName: employee.firstName,
                                lastName: employee.lastName,
                                designation: employee.designation,
                                department: employee.department,
                                basicSalary: restricted ? restricted.basicSalary : null,
                                housingAllowance: restricted ? restricted.housingAllowance : null,
                                transportAllowance: restricted ? restricted.transportAllowance : null,
                                otherAllowance: restricted ? restricted.otherAllowance : null,
                            }}
                        />
                    )}
                </div>

                <PromotionHistoryTable
                    promotions={promotions as any}
                    employee={{
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        designation: employee.designation,
                        employeeCode: employee.employeeCode,
                    }}
                />
            </section>

            {/* ── Leave Requests Audit & History ───────────────────────── */}
            <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-xs">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                                Leave Requests &amp; Approval History
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Audit history of submitted leaves, approved periods, and decision status.
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">
                        {leaveRequests.length} Record{leaveRequests.length !== 1 ? "s" : ""}
                    </Badge>
                </div>

                {leaveRequests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
                        No leave requests on record for this employee.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                                <tr>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Dates</th>
                                    <th className="p-3">Deducted</th>
                                    <th className="p-3">Reason</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Decided At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {leaveRequests.map((lr) => (
                                    <tr key={lr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                                            {lr.type}
                                        </td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">
                                            {new Date(lr.startDate).toLocaleDateString()} - {new Date(lr.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                                            {lr.deductedDays ? `${lr.deductedDays}d` : "—"}
                                        </td>
                                        <td className="p-3 text-slate-500 max-w-xs truncate">
                                            {lr.reason || "—"}
                                        </td>
                                        <td className="p-3">
                                            <Badge className={`text-[10px] font-bold uppercase ${
                                                lr.status === "APPROVED"
                                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                    : lr.status === "REJECTED"
                                                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                            }`}>
                                                {lr.status}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-slate-400 text-[11px]">
                                            {lr.decidedAt ? new Date(lr.decidedAt).toLocaleDateString() : "Pending"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ── Profile Audit Trail ─────────────────────────────────── */}
            {auditLogs.length > 0 && (
                <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-xs">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                <FileCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                                    Record Audit Log
                                </h2>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Administrative events, profile updates, and status transitions.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {auditLogs.map((log) => (
                            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider mr-2">
                                        {log.action}
                                    </span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                                        {log.details}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono text-right shrink-0 ml-4">
                                    <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                                    <div>By: {log.changedBy}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
