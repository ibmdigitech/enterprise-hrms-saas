"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";
import { sendCustomInvoiceCreatedNotification, sendInvoicePaymentNotification } from "@/lib/billing/invoice-notifications";

export async function getPlatformBillingMetrics() {
    await requireSuperAdmin("platform.billing.view");

    const [tenants, invoices, transactions] = await Promise.all([
        prisma.tenant.findMany({
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        }),
        prisma.subscriptionInvoice.findMany({
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                tenant: { select: { id: true, name: true, slug: true } },
            },
        }),
        prisma.paymentTransaction.findMany({
            orderBy: { createdAt: "desc" },
            take: 30,
            include: {
                tenant: { select: { id: true, name: true, slug: true } },
            },
        }),
    ]);

    // Calculate MRR:
    // Monthly plan: priceMonthly
    // Annual plan: priceAnnual / 12
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
        .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
        .reduce((sum, i) => sum + i.totalAmount, 0);

    const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;

    return {
        mrr: Math.round(mrr),
        arr: Math.round(mrr * 12),
        totalCollected: Math.round(totalCollected),
        pendingAmount: Math.round(pendingAmount),
        activeSubscribers: activeCount,
        totalTenants: tenants.length,
        invoices,
        transactions,
    };
}

export async function recordManualPaymentAction(input: {
    invoiceId: string;
    paymentMethod: string;
    reference: string;
    notes?: string;
}) {
    await requireSuperAdmin("platform.billing.manage");

    const invoice = await prisma.subscriptionInvoice.findUnique({
        where: { id: input.invoiceId },
    });
    if (!invoice) throw new Error("Invoice not found.");

    await prisma.$transaction(async (tx) => {
        await tx.subscriptionInvoice.update({
            where: { id: input.invoiceId },
            data: {
                status: "PAID",
                paidAt: new Date(),
                paymentMethod: input.paymentMethod,
                notes: input.notes || "Marked paid manually by platform administrator.",
            },
        });

        await tx.paymentTransaction.create({
            data: {
                tenantId: invoice.tenantId,
                invoiceId: invoice.id,
                amount: invoice.totalAmount,
                currency: invoice.currency,
                status: "SUCCESS",
                gateway: "MANUAL",
                transactionRef: input.reference || `man_${Date.now()}`,
                paymentMethodType: input.paymentMethod,
            },
        });
    });

    // Send payment received notification to tenant
    await sendInvoicePaymentNotification({
        tenantId: invoice.tenantId,
        invoiceId: invoice.id,
        type: "PAYMENT_RECEIVED",
        dueDate: invoice.dueDate,
        amount: invoice.totalAmount,
        currency: invoice.currency,
        invoiceNumber: invoice.invoiceNumber,
    });

    revalidatePath("/platform-admin/billing");
    revalidatePath("/platform-admin");
    return { success: true };
}

export async function createTenantCustomInvoiceAction(input: {
    tenantId: string;
    amount: number;
    description: string;
    dueDateDays?: number;
}) {
    await requireSuperAdmin("platform.billing.manage");

    const tenant = await prisma.tenant.findUnique({
        where: { id: input.tenantId },
        include: { subscription: true },
    });
    if (!tenant) throw new Error("Tenant not found.");

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + (input.dueDateDays || 14));

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-AD`;
    const taxAmount = Math.round(input.amount * 0.05 * 100) / 100;
    const totalAmount = Math.round((input.amount + taxAmount) * 100) / 100;

    const invoice = await prisma.subscriptionInvoice.create({
        data: {
            tenantId: tenant.id,
            subscriptionId: tenant.subscription?.id,
            invoiceNumber,
            amount: input.amount,
            taxAmount,
            totalAmount,
            currency: tenant.currency || "AED",
            status: "PENDING",
            billingPeriodStart: now,
            billingPeriodEnd: dueDate,
            dueDate,
            notes: input.description,
        },
    });

    // Send notification to tenant admins about new invoice
    await sendCustomInvoiceCreatedNotification({
        tenantId: tenant.id,
        invoiceId: invoice.id,
        amount: totalAmount,
        currency: tenant.currency || "AED",
        invoiceNumber: invoice.invoiceNumber,
        description: input.description,
        dueDate,
    });

    revalidatePath("/platform-admin/billing");
    return { success: true, invoiceNumber: invoice.invoiceNumber, invoiceId: invoice.id };
}
