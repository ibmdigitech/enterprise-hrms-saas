"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";

export interface PlatformDashboardMetrics {
    // Tenant metrics
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    dedicatedDbTenants: number;
    sharedDbTenants: number;

    // Revenue metrics
    mrr: number;
    arr: number;
    totalCollected: number;
    pendingAmount: number;
    overdueAmount: number;

    // Workforce metrics
    totalEmployees: number;
    activeEmployees: number;
    totalUsers: number;
    totalCompanies: number;
    totalLocations: number;
    totalDepartments: number;

    // Plan distribution
    planDistribution: { planTier: string; count: number }[];

    // System health
    recentAuditEvents: number;
    failedPayments: number;
    overdueInvoices: number;

    // HR metrics across all tenants
    totalLeaveRequests: number;
    pendingLeaveRequests: number;
    totalPayrollRuns: number;
    activePayrollRuns: number;
    totalRecruitmentApplications: number;
    activeJobRequisitions: number;

    // Recent activity
    recentTenants: { id: string; name: string; slug: string; status: string; createdAt: Date; subscription: { planTier: string } | null }[];
    recentAuditLogs: { id: string; action: string; actorEmail: string | null; outcome: string; createdAt: Date }[];
}

export async function getPlatformDashboardMetrics(): Promise<PlatformDashboardMetrics> {
    await requireSuperAdmin("platform.dashboard.view");

    const [
        tenants,
        invoices,
        transactions,
        employees,
        users,
        companies,
        locations,
        departments,
        leaveRequests,
        payrollRuns,
        jobRequisitions,
        applications,
        auditLogs,
    ] = await Promise.all([
        prisma.tenant.findMany({
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        }),
        prisma.subscriptionInvoice.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
        }),
        prisma.paymentTransaction.findMany({
            orderBy: { createdAt: "desc" },
            take: 50,
        }),
        prisma.employee.count(),
        prisma.user.count(),
        prisma.company.count(),
        prisma.location.count(),
        prisma.department.count(),
        prisma.leaveRequest.findMany({
            select: { status: true },
        }),
        prisma.payrollRun.findMany({
            select: { status: true },
        }),
        prisma.jobRequisition.findMany({
            select: { status: true },
        }),
        prisma.application.findMany({
            select: { status: true },
        }),
        prisma.securityAuditLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
            select: { id: true, action: true, actorEmail: true, outcome: true, createdAt: true },
        }),
    ]);

    // Tenant metrics
    const activeTenants = tenants.filter((t) => t.status === "ACTIVE").length;
    const trialTenants = tenants.filter((t) => t.status === "TRIAL").length;
    const suspendedTenants = tenants.filter((t) => t.status === "SUSPENDED").length;
    const dedicatedDbTenants = tenants.filter((t) => Boolean(t.databaseUrl)).length;
    const sharedDbTenants = tenants.length - dedicatedDbTenants;

    // Plan distribution
    const planCounts: Record<string, number> = {};
    for (const t of tenants) {
        const tier = t.subscription?.planTier || "TRIAL";
        planCounts[tier] = (planCounts[tier] || 0) + 1;
    }
    const planDistribution = Object.entries(planCounts).map(([planTier, count]) => ({ planTier, count }));

    // Revenue metrics
    let mrr = 0;
    for (const t of tenants) {
        if (t.status === "ACTIVE" && t.subscription?.plan) {
            if (t.subscription.billingCycle === "ANNUAL") {
                mrr += (t.subscription.plan.priceAnnual || 0) / 12;
            } else {
                mrr += t.subscription.plan.priceMonthly || 0;
            }
        }
    }

    const totalCollected = invoices
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + i.totalAmount, 0);

    const pendingAmount = invoices
        .filter((i) => i.status === "PENDING")
        .reduce((sum, i) => sum + i.totalAmount, 0);

    const overdueAmount = invoices
        .filter((i) => i.status === "OVERDUE")
        .reduce((sum, i) => sum + i.totalAmount, 0);

    const failedPayments = transactions.filter((tx) => tx.status === "FAILED").length;
    const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE").length;

    // HR metrics
    const totalLeaveRequests = leaveRequests.length;
    const pendingLeaveRequests = leaveRequests.filter((lr) => lr.status === "PENDING" || lr.status === "PENDING_MANAGER" || lr.status === "PENDING_HR").length;

    const totalPayrollRuns = payrollRuns.length;
    const activePayrollRuns = payrollRuns.filter((pr) => pr.status === "CALCULATING" || pr.status === "CALCULATED" || pr.status === "UNDER_REVIEW").length;

    const activeJobRequisitions = jobRequisitions.filter((jr) => jr.status === "APPROVED" || jr.status === "SUBMITTED" || jr.status === "MANAGER_REVIEW" || jr.status === "HR_REVIEW" || jr.status === "FINANCE_REVIEW").length;
    const totalRecruitmentApplications = applications.length;

    // Recent tenants (last 5)
    const recentTenants = tenants
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            status: t.status,
            createdAt: t.createdAt,
            subscription: t.subscription ? { planTier: t.subscription.planTier } : null,
        }));

    const recentAuditEvents = auditLogs.length;

    return {
        totalTenants: tenants.length,
        activeTenants,
        trialTenants,
        suspendedTenants,
        dedicatedDbTenants,
        sharedDbTenants,
        mrr: Math.round(mrr),
        arr: Math.round(mrr * 12),
        totalCollected: Math.round(totalCollected),
        pendingAmount: Math.round(pendingAmount),
        overdueAmount: Math.round(overdueAmount),
        totalEmployees: employees,
        activeEmployees: employees, // Could filter by isActive if needed
        totalUsers: users,
        totalCompanies: companies,
        totalLocations: locations,
        totalDepartments: departments,
        planDistribution,
        recentAuditEvents,
        failedPayments,
        overdueInvoices,
        totalLeaveRequests,
        pendingLeaveRequests,
        totalPayrollRuns,
        activePayrollRuns,
        totalRecruitmentApplications,
        activeJobRequisitions,
        recentTenants,
        recentAuditLogs: auditLogs,
    };
}

export async function getTenantHealthMetrics(tenantId: string) {
    await requireSuperAdmin("platform.tenant.health");

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
            subscription: { include: { plan: true } },
            companies: { select: { id: true } },
        },
    });

    const [
        employees,
        leaveRequests,
        payrollRuns,
        auditLogs,
        invoices,
    ] = await Promise.all([
        prisma.employee.count({ where: { tenantId } }),
        prisma.leaveRequest.count({ where: { tenantId } }),
        prisma.payrollRun.count(),
        prisma.securityAuditLog.count({ where: { target: { contains: tenantId } } }),
        prisma.subscriptionInvoice.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            take: 10,
        }),
    ]);

    return {
        tenant,
        employees,
        leaveRequests,
        payrollRuns,
        auditLogs,
        invoices,
    };
}