import prisma from "@/lib/prisma";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";
import { retry } from "@/lib/utils/retry";

// ─── Configurable thresholds (overridable via environment variables) ──────────
//
// DOC_EXPIRY_DAYS          — how many days ahead to scan for expiring documents
//                            Default: 30. Set higher (e.g. 60) for earlier warnings.
// DOC_EXPIRY_ALERT_GAP_DAYS — minimum gap (days) before re-alerting the same employee
//                            Default: 3. Prevents notification spam.
// CRON_MAX_EMPLOYEES        — max employees processed per run (pagination guard)
//                            Default: 100.

function getEnvInt(key: string, fallback: number): number {
    const raw = process.env[key];
    if (!raw) return fallback;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

const DOC_EXPIRY_DAYS       = getEnvInt("DOC_EXPIRY_DAYS", 30);
const ALERT_GAP_DAYS        = getEnvInt("DOC_EXPIRY_ALERT_GAP_DAYS", 3);
const MAX_EMPLOYEES         = getEnvInt("CRON_MAX_EMPLOYEES", 100);

// ─────────────────────────────────────────────────────────────────────────────

export interface ScheduledProcessResult {
    success: boolean;
    timestamp: string;
    expiredRoleRequests: number;
    expiredCertificates: number;
    upcomingDocumentAlerts: number;
    docExpiryWindowDays: number;
    errors: string[];
}

/**
 * Enterprise Scheduled Processing Runner
 * Executes idempotent, retried background tasks:
 *
 *  1a. Auto‑expire temporary role assignments past their endDate.
 *  1b. Mark expired training certificates as EXPIRED and notify employees.
 *  2.  Scan upcoming employee document expiries (visa, passport, Emirates ID)
 *      within the configurable DOC_EXPIRY_DAYS window and generate one alert
 *      per employee (de-duplicated by DOC_EXPIRY_ALERT_GAP_DAYS).
 *
 * All steps are wrapped in `retry()` to survive transient DB errors.
 * Results and errors are logged to the audit trail after every run.
 */
export async function runScheduledMaintenance(): Promise<ScheduledProcessResult> {
    const now = new Date();
    const errors: string[] = [];
    let expiredRoleRequests = 0;
    let expiredCertificates = 0;
    let upcomingDocumentAlerts = 0;

    // ── 1a. Auto‑expire temporary role assignments ───────────────────────────
    try {
        const expiredAssignments = await retry(() =>
            prisma.temporaryRoleAssignment.findMany({
                where: { isActive: true, endDate: { lte: now } },
                select: { id: true, userId: true },
            })
        );

        if (expiredAssignments.length > 0) {
            const ids = expiredAssignments.map((a) => a.id);

            await retry(() =>
                prisma.temporaryRoleAssignment.updateMany({
                    where: { id: { in: ids } },
                    data: { isActive: false },
                })
            );

            // Notify each assignee about the revocation
            for (const a of expiredAssignments) {
                await retry(() =>
                    prisma.notification.create({
                        data: {
                            employeeId: a.userId,
                            title: "Temporary Role Expired",
                            message:
                                "Your temporary role assignment has reached its end date and has been automatically revoked.",
                            type: "INFO",
                            link: "/dashboard/roles",
                        },
                    })
                );
            }
            expiredRoleRequests = expiredAssignments.length;
        }
    } catch (err) {
        errors.push(
            `Temp‑Role Expiry Error: ${err instanceof Error ? err.message : String(err)}`
        );
    }

    // ── 1b. Mark expired training certificates ───────────────────────────────
    try {
        const expiredCerts = await retry(() =>
            prisma.trainingCertificate.findMany({
                where: { status: "ISSUED", expiresAt: { lte: now } },
                select: { id: true, certificateNumber: true, employeeId: true },
            })
        );

        if (expiredCerts.length > 0) {
            const certIds = expiredCerts.map((c) => c.id);

            await retry(() =>
                prisma.trainingCertificate.updateMany({
                    where: { id: { in: certIds } },
                    data: { status: "EXPIRED" },
                })
            );
            expiredCertificates = expiredCerts.length;

            for (const c of expiredCerts) {
                await retry(() =>
                    prisma.notification.create({
                        data: {
                            employeeId: c.employeeId,
                            title: "Training Certificate Expired",
                            message: `Your training certificate (${c.certificateNumber}) has expired and is now marked EXPIRED.`,
                            type: "WARNING",
                            link: "/dashboard/training",
                        },
                    })
                );
            }
        }
    } catch (err) {
        errors.push(
            `Certificate Expiry Error: ${err instanceof Error ? err.message : String(err)}`
        );
    }

    // ── 2. Scan upcoming employee document expiries ──────────────────────────
    //      Window size: DOC_EXPIRY_DAYS (default 30, env-configurable)
    try {
        const thresholdDate = new Date(now);
        thresholdDate.setDate(now.getDate() + DOC_EXPIRY_DAYS);

        const alertGapMs = ALERT_GAP_DAYS * 24 * 60 * 60 * 1000;

        const expiringEmployees = await retry(() =>
            prisma.employee.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { visaExpiry:        { gte: now, lte: thresholdDate } },
                        { emiratesIdExpiry:   { gte: now, lte: thresholdDate } },
                        { passportExpiry:     { gte: now, lte: thresholdDate } },
                    ],
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    visaExpiry: true,
                    emiratesIdExpiry: true,
                    passportExpiry: true,
                },
                take: MAX_EMPLOYEES,
            })
        );

        for (const emp of expiringEmployees) {
            const items: string[] = [];
            if (emp.visaExpiry        && emp.visaExpiry        <= thresholdDate) items.push("Visa");
            if (emp.emiratesIdExpiry  && emp.emiratesIdExpiry  <= thresholdDate) items.push("Emirates ID");
            if (emp.passportExpiry    && emp.passportExpiry    <= thresholdDate) items.push("Passport");

            if (items.length === 0) continue;

            // De-duplicate: skip if an alert was already sent within the gap window
            const recentAlert = await retry(() =>
                prisma.notification.findFirst({
                    where: {
                        employeeId: emp.id,
                        title: "Document Expiry Notice",
                        createdAt: { gte: new Date(Date.now() - alertGapMs) },
                    },
                })
            );

            if (!recentAlert) {
                await retry(() =>
                    prisma.notification.create({
                        data: {
                            employeeId: emp.id,
                            title: "Document Expiry Notice",
                            message: `Notice: Your ${items.join(", ")} will expire within ${DOC_EXPIRY_DAYS} days. Please submit renewal documents to HR.`,
                            type: "ALERT",
                            link: "/visa",
                        },
                    })
                );
                upcomingDocumentAlerts++;
            }
        }
    } catch (err) {
        errors.push(
            `Document Expiry Scan Error: ${err instanceof Error ? err.message : String(err)}`
        );
    }

    // ── Audit log: record every cron execution ───────────────────────────────
    try {
        await logSecurityEvent({
            action: SECURITY_ACTION.CRON_MAINTENANCE,
            actorEmail: "system:cron",
            actorRole: "SYSTEM",
            outcome: errors.length === 0 ? "SUCCESS" : "ERROR",
            detail: {
                docExpiryWindowDays: DOC_EXPIRY_DAYS,
                alertGapDays: ALERT_GAP_DAYS,
                maxEmployees: MAX_EMPLOYEES,
                expiredCertificates,
                expiredRoleRequests,
                upcomingDocumentAlerts,
                errorCount: errors.length,
            },
        });
    } catch {
        // Never let audit-log failure break the main result
    }

    return {
        success: errors.length === 0,
        timestamp: now.toISOString(),
        expiredRoleRequests,
        expiredCertificates,
        upcomingDocumentAlerts,
        docExpiryWindowDays: DOC_EXPIRY_DAYS,
        errors,
    };
}
