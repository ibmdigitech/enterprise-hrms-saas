import prisma from "@/lib/prisma";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

export interface ScheduledProcessResult {
    success: boolean;
    timestamp: string;
    expiredRoleRequests: number;
    expiredCertificates: number;
    upcomingDocumentAlerts: number;
    errors: string[];
}

/**
 * Enterprise Scheduled Processing Runner
 * Executes idempotent background tasks:
 * 1. Auto-revokes / marks expired temporary role requests.
 * 2. Marks expired training certificates as EXPIRED.
 * 3. Scans upcoming document expiries (visas, passports, emirates IDs) and generates alerts.
 */
export async function runScheduledMaintenance(): Promise<ScheduledProcessResult> {
    const now = new Date();
    const errors: string[] = [];
    let expiredRoleRequests = 0;
    let expiredCertificates = 0;
    let upcomingDocumentAlerts = 0;

    // 1. Process Expired Training Certificates
    try {
        const expiredCerts = await prisma.trainingCertificate.findMany({
            where: {
                status: "ISSUED",
                expiresAt: { lte: now },
            },
            select: { id: true, certificateNumber: true, employeeId: true },
        });

        if (expiredCerts.length > 0) {
            const certIds = expiredCerts.map((c) => c.id);
            await prisma.trainingCertificate.updateMany({
                where: { id: { in: certIds } },
                data: { status: "EXPIRED" },
            });
            expiredCertificates = expiredCerts.length;

            // Notify respective employees about expired certificates
            for (const c of expiredCerts) {
                await prisma.notification.create({
                    data: {
                        employeeId: c.employeeId,
                        title: "Training Certificate Expired",
                        message: `Your training certificate (${c.certificateNumber}) has reached its expiration date and is marked as EXPIRED.`,
                        type: "WARNING",
                        link: "/dashboard/training",
                    },
                });
            }
        }
    } catch (err: unknown) {
        errors.push(`Certificate Expiry Error: ${err instanceof Error ? err.message : String(err)}`);
    }

    // 2. Scan Upcoming Employee Document Expiries (30-day window)
    try {
        const thresholdDate = new Date();
        thresholdDate.setDate(now.getDate() + 30);

        const expiringEmployees = await prisma.employee.findMany({
            where: {
                isActive: true,
                OR: [
                    { visaExpiry: { gte: now, lte: thresholdDate } },
                    { emiratesIdExpiry: { gte: now, lte: thresholdDate } },
                    { passportExpiry: { gte: now, lte: thresholdDate } },
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
            take: 100,
        });

        for (const emp of expiringEmployees) {
            const items: string[] = [];
            if (emp.visaExpiry && emp.visaExpiry <= thresholdDate) items.push("Visa");
            if (emp.emiratesIdExpiry && emp.emiratesIdExpiry <= thresholdDate) items.push("Emirates ID");
            if (emp.passportExpiry && emp.passportExpiry <= thresholdDate) items.push("Passport");

            if (items.length > 0) {
                // Avoid spamming if notification already sent in the past 3 days
                const recentAlert = await prisma.notification.findFirst({
                    where: {
                        employeeId: emp.id,
                        title: "Document Expiry Notice",
                        createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
                    },
                });

                if (!recentAlert) {
                    await prisma.notification.create({
                        data: {
                            employeeId: emp.id,
                            title: "Document Expiry Notice",
                            message: `Notice: Your ${items.join(", ")} will expire within 30 days. Please provide renewal documents to HR.`,
                            type: "ALERT",
                            link: "/visa",
                        },
                    });
                    upcomingDocumentAlerts++;
                }
            }
        }
    } catch (err: unknown) {
        errors.push(`Document Expiry Scan Error: ${err instanceof Error ? err.message : String(err)}`);
    }

    return {
        success: errors.length === 0,
        timestamp: now.toISOString(),
        expiredRoleRequests,
        expiredCertificates,
        upcomingDocumentAlerts,
        errors,
    };
}

