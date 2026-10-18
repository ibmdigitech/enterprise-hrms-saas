"use server";

import prisma from "@/lib/prisma";
import { notifyInApp, queueDelivery } from "@/lib/workflow/notifications";

/**
 * Sends a payment pending/overdue notification to tenant admins.
 */
export async function sendInvoicePaymentNotification(params: {
    tenantId: string;
    invoiceId: string;
    type: "PENDING_REMINDER" | "OVERDUE" | "DUE_SOON" | "PAYMENT_RECEIVED";
    dueDate: Date;
    amount: number;
    currency: string;
    invoiceNumber: string;
}): Promise<void> {
    const { tenantId, invoiceId, type, dueDate, amount, currency, invoiceNumber } = params;

    // Get tenant admins (users with ADMIN role in this tenant)
    const admins = await prisma.tenantMembership.findMany({
        where: {
            tenantId,
            role: "ADMIN",
            status: "ACTIVE",
        },
        include: {
            user: {
                include: {
                    employee: true,
                },
            },
        },
    });

    if (admins.length === 0) {
        console.warn(`[BILLING_NOTIFICATION] No admins found for tenant ${tenantId}`);
        return;
    }

    const formatCurrency = (amt: number, curr: string) => {
        return new Intl.NumberFormat("en-AE", {
            style: "currency",
            currency: curr,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amt);
    };

    const dueDateStr = new Date(dueDate).toLocaleDateString("en-AE", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    let title = "";
    let message = "";
    let notificationType = "WARNING";

    switch (type) {
        case "DUE_SOON":
            title = "Invoice Payment Due Soon";
            message = `Invoice ${invoiceNumber} for ${formatCurrency(amount, currency)} is due on ${dueDateStr}. Please ensure timely payment to avoid service interruption.`;
            notificationType = "INFO";
            break;
        case "PENDING_REMINDER":
            title = "Invoice Payment Reminder";
            message = `Invoice ${invoiceNumber} for ${formatCurrency(amount, currency)} was due on ${dueDateStr}. Payment is still pending. Please process payment to avoid overdue status.`;
            notificationType = "WARNING";
            break;
        case "OVERDUE":
            title = "Invoice Overdue - Action Required";
            message = `Invoice ${invoiceNumber} for ${formatCurrency(amount, currency)} is OVERDUE (due ${dueDateStr}). Immediate payment required to prevent service restrictions.`;
            notificationType = "ALERT";
            break;
        case "PAYMENT_RECEIVED":
            title = "Payment Received";
            message = `Payment of ${formatCurrency(amount, currency)} for invoice ${invoiceNumber} has been received and confirmed.`;
            notificationType = "SUCCESS";
            break;
    }

    // Send in-app notification to each admin
    for (const admin of admins) {
        if (admin.user.employee) {
            await notifyInApp({
                employeeId: admin.user.employee.id,
                title,
                message,
                type: notificationType,
                link: `/settings/billing?invoice=${invoiceId}`,
                templateKey: `billing.${type.toLowerCase()}`,
            });
        }
    }

    // Also queue email delivery if email is configured
    for (const admin of admins) {
        if (admin.user.email) {
            await queueDelivery({
                channel: "EMAIL",
                recipient: admin.user.email,
                templateKey: `billing.${type.toLowerCase()}`,
                subject: title,
                body: message,
                metadata: { tenantId, invoiceId, type, amount, currency },
            });
        }
    }
}

/**
 * Checks for overdue/pending invoices and sends notifications.
 * This should be run via a scheduled job (cron).
 */
export async function checkAndSendInvoiceNotifications(): Promise<{
    processed: number;
    notificationsSent: number;
}> {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find invoices that need notifications
    const invoices = await prisma.subscriptionInvoice.findMany({
        where: {
            status: { in: ["PENDING", "OVERDUE"] },
            OR: [
                // Due in 3 days (DUE_SOON)
                { dueDate: { lte: threeDaysFromNow, gte: now }, status: "PENDING" },
                // Overdue by 1+ days (OVERDUE)
                { dueDate: { lt: now }, status: "PENDING" },
                // Overdue by 7+ days (OVERDUE escalation)
                { dueDate: { lt: sevenDaysAgo }, status: "OVERDUE" },
            ],
        },
        include: {
            tenant: { select: { id: true, name: true, currency: true } },
        },
    });

    let notificationsSent = 0;

    for (const invoice of invoices) {
        let type: "DUE_SOON" | "PENDING_REMINDER" | "OVERDUE" = "PENDING_REMINDER";

        if (invoice.dueDate > now && invoice.dueDate <= threeDaysFromNow) {
            type = "DUE_SOON";
        } else if (invoice.dueDate < now && invoice.dueDate >= sevenDaysAgo) {
            type = "PENDING_REMINDER";
        } else if (invoice.dueDate < sevenDaysAgo) {
            type = "OVERDUE";
        }

        // Check if we already sent this type of notification recently (within 24h)
        const recentNotification = await prisma.notification.findFirst({
            where: {
                employee: {
                    user: {
                        memberships: {
                            some: { tenantId: invoice.tenantId, role: "ADMIN", status: "ACTIVE" },
                        },
                    },
                },
                title: { contains: invoice.invoiceNumber },
                type: type === "DUE_SOON" ? "INFO" : type === "OVERDUE" ? "ALERT" : "WARNING",
                createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
            },
        });

        if (!recentNotification) {
            await sendInvoicePaymentNotification({
                tenantId: invoice.tenantId,
                invoiceId: invoice.id,
                type,
                dueDate: invoice.dueDate,
                amount: invoice.totalAmount,
                currency: invoice.currency,
                invoiceNumber: invoice.invoiceNumber,
            });
            notificationsSent++;
        }
    }

    // Also update PENDING invoices past due date to OVERDUE status
    await prisma.subscriptionInvoice.updateMany({
        where: {
            status: "PENDING",
            dueDate: { lt: now },
        },
        data: { status: "OVERDUE" },
    });

    return {
        processed: invoices.length,
        notificationsSent,
    };
}

/**
 * Sends a notification when a custom invoice is created by platform admin.
 */
export async function sendCustomInvoiceCreatedNotification(params: {
    tenantId: string;
    invoiceId: string;
    amount: number;
    currency: string;
    invoiceNumber: string;
    description: string;
    dueDate: Date;
}): Promise<void> {
    return sendInvoicePaymentNotification({
        tenantId: params.tenantId,
        invoiceId: params.invoiceId,
        type: "DUE_SOON", // Treat as due soon notification
        dueDate: params.dueDate,
        amount: params.amount,
        currency: params.currency,
        invoiceNumber: params.invoiceNumber,
    });
}