import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";
import prisma from "@/lib/prisma";
import crypto from "crypto";

/**
 * Stripe Webhook Handler
 *
 * Implements:
 *   - Signed webhook verification (Stripe-Signature header)
 *   - Idempotent event processing (checks existing invoice/payment records)
 *   - Payment reconciliation (matches events to invoices & transactions)
 *   - Subscription lifecycle updates (renewal, cancellation, failure)
 *   - Security audit logging for every webhook event
 */
export async function POST(req: Request) {
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
        await logSecurityEvent({
            action: SECURITY_ACTION.ACCESS_DENIED,
            actorEmail: null,
            actorRole: null,
            target: "billing.webhook.stripe",
            outcome: "DENIED",
            requestPath: "/api/billing/webhooks/stripe",
            requestMethod: "POST",
            detail: { reason: "missing stripe-signature header" },
        });
        return NextResponse.json({ error: "Missing Stripe signature" }, { status: 401 });
    }

    const body = await req.text();

    // Verify Stripe signature
    let event: any;
    try {
        event = verifyStripeSignature(body, signature);
    } catch (err) {
        await logSecurityEvent({
            action: SECURITY_ACTION.ACCESS_DENIED,
            actorEmail: null,
            actorRole: null,
            target: "billing.webhook.stripe",
            outcome: "DENIED",
            requestPath: "/api/billing/webhooks/stripe",
            requestMethod: "POST",
            detail: { reason: "invalid stripe signature", error: err instanceof Error ? err.message : String(err) },
        });
        return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 401 });
    }

    const eventId = event.id;

    // IDEMPOTENCY: Skip already-processed events by checking invoice notes
    if (event.type === "invoice.payment_succeeded" || event.type === "invoice.payment_failed") {
        const stripeInvoiceId = event.data.object.id;
        const existing = await prisma.subscriptionInvoice.findFirst({
            where: { notes: { contains: `Stripe invoice ${stripeInvoiceId}` } },
        });
        if (existing) {
            return NextResponse.json({ received: true, duplicate: true });
        }
    }

    // Record the raw event for audit
    await logSecurityEvent({
        action: SECURITY_ACTION.ACCESS_DENIED,
        actorEmail: null,
        actorRole: null,
        target: `billing.event:${event.id}`,
        outcome: "SUCCESS",
        requestPath: "/api/billing/webhooks/stripe",
        requestMethod: "POST",
        detail: { type: event.type, data: event.data?.object },
    });

    try {
        switch (event.type) {
            case "invoice.payment_succeeded": {
                const invoice = event.data.object;
                await handleInvoicePaid(invoice, eventId);
                break;
            }
            case "invoice.payment_failed": {
                const invoice = event.data.object;
                await handleInvoiceFailed(invoice, eventId);
                break;
            }
            case "customer.subscription.updated": {
                const sub = event.data.object;
                await handleSubscriptionUpdated(sub);
                break;
            }
            case "customer.subscription.deleted": {
                const sub = event.data.object;
                await handleSubscriptionDeleted(sub);
                break;
            }
            case "checkout.session.completed": {
                const session = event.data.object;
                await handleCheckoutCompleted(session);
                break;
            }
            default:
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[STRIPE_WEBHOOK_ERROR]", error);
        await logSecurityEvent({
            action: SECURITY_ACTION.ACCESS_DENIED,
            actorEmail: null,
            actorRole: null,
            target: `billing.event:${event.id}`,
            outcome: "ERROR",
            requestPath: "/api/billing/webhooks/stripe",
            requestMethod: "POST",
            detail: { type: event.type, error: error instanceof Error ? error.message : String(error) },
        });
        return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
}

function verifyStripeSignature(payload: string, signature: string): any {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    const [, timestamp, v1] = signature.split(",").map((part) => part.split("=")[1]);
    if (!timestamp || !v1) {
        throw new Error("Malformed Stripe signature");
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
        throw new Error("Stripe signature timestamp outside tolerance");
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expected = crypto
        .createHmac("sha256", secret)
        .update(signedPayload)
        .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))) {
        throw new Error("Stripe signature mismatch");
    }

    return JSON.parse(payload);
}

async function handleInvoicePaid(invoice: any, eventId: string) {
    const stripeInvoiceId = invoice.id;
    const tenantId = invoice.metadata?.tenant_id;

    if (!tenantId) {
        throw new Error("Invoice missing tenant_id metadata");
    }

    const amount = (invoice.amount_paid || 0) / 100;
    const currency = (invoice.currency || "AED").toUpperCase();

    // Check if invoice already exists (idempotency double-check)
    let dbInvoice = await prisma.subscriptionInvoice.findFirst({
        where: { notes: { contains: `Stripe invoice ${stripeInvoiceId}` } },
    });

    if (!dbInvoice) {
        dbInvoice = await prisma.subscriptionInvoice.create({
            data: {
                tenantId,
                invoiceNumber: `INV-${Date.now()}`,
                amount,
                taxAmount: (invoice.tax || 0) / 100,
                totalAmount: amount,
                currency,
                status: "PAID",
                billingPeriodStart: new Date(invoice.period_start * 1000),
                billingPeriodEnd: new Date(invoice.period_end * 1000),
                dueDate: new Date(invoice.due_date * 1000),
                paidAt: new Date(),
                paymentMethod: "CARD",
                notes: `Stripe invoice ${stripeInvoiceId} | evt_${eventId}`,
            },
        });
    } else if (dbInvoice.status !== "PAID") {
        await prisma.subscriptionInvoice.update({
            where: { id: dbInvoice.id },
            data: { status: "PAID", paidAt: new Date(), paymentMethod: "CARD" },
        });
    }

    // Create payment transaction (idempotent via transactionRef)
    const transactionRef = `stripe_invoice_${stripeInvoiceId}`;
    const existingTx = await prisma.paymentTransaction.findUnique({
        where: { transactionRef },
    });
    if (!existingTx) {
        await prisma.paymentTransaction.create({
            data: {
                tenantId,
                invoiceId: dbInvoice.id,
                amount,
                currency,
                status: "SUCCESS",
                gateway: "STRIPE",
                transactionRef,
                paymentMethodType: invoice.payment_method_types?.[0] || "CARD",
                lastFour: invoice.payment_method_details?.card?.last4,
                rawGatewayResponse: { stripeInvoiceId, eventId },
            },
        });
    }

    // Update tenant subscription status
    await prisma.tenantSubscription.updateMany({
        where: { tenantId, status: "PAST_DUE" },
        data: { status: "ACTIVE" },
    });
}

async function handleInvoiceFailed(invoice: any, eventId: string) {
    const stripeInvoiceId = invoice.id;
    const tenantId = invoice.metadata?.tenant_id;

    if (!tenantId) return;

    let dbInvoice = await prisma.subscriptionInvoice.findFirst({
        where: { notes: { contains: `Stripe invoice ${stripeInvoiceId}` } },
    });

    if (dbInvoice) {
        await prisma.subscriptionInvoice.update({
            where: { id: dbInvoice.id },
            data: { status: "OVERDUE" },
        });
    }

    await prisma.tenantSubscription.updateMany({
        where: { tenantId, status: "ACTIVE" },
        data: { status: "PAST_DUE" },
    });
}

async function handleSubscriptionUpdated(sub: any) {
    const customerId = sub.customer;
    const stripeSubId = sub.id;

    const tenant = await prisma.tenant.findFirst({
        where: { customDomain: { contains: customerId } },
    });
    if (!tenant) return;

    await prisma.tenantSubscription.updateMany({
        where: { tenantId: tenant.id },
        data: {
            status: sub.status === "active" ? "ACTIVE" : sub.status === "past_due" ? "PAST_DUE" : sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
    });
}

async function handleSubscriptionDeleted(sub: any) {
    const customerId = sub.customer;

    const tenant = await prisma.tenant.findFirst({
        where: { customDomain: { contains: customerId } },
    });
    if (!tenant) return;

    await prisma.tenantSubscription.updateMany({
        where: { tenantId: tenant.id },
        data: { status: "CANCELLED", currentPeriodEnd: new Date() },
    });
}

async function handleCheckoutCompleted(session: any) {
    const tenantId = session.metadata?.tenant_id;
    if (!tenantId) return;

    const subscriptionId = session.subscription;
    if (!subscriptionId) return;

    await prisma.tenantSubscription.updateMany({
        where: { tenantId },
        data: { status: "ACTIVE" },
    });
}
