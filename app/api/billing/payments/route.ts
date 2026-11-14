import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

const PaymentRecordSchema = z.object({
  tenantId: z.string().cuid("Tenant ID is required"),
  invoiceId: z.string().cuid().optional(),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("AED"),
  gateway: z.enum(["STRIPE", "PAYPAL", "NETWORK_INTL", "TELR", "BANK_TRANSFER", "MANUAL"]).default("MANUAL"),
  transactionRef: z.string().min(1, "Transaction reference is required"),
  paymentMethodType: z.string().optional(),
  lastFour: z.string().optional(),
  status: z.enum(["SUCCESS", "PENDING", "FAILED", "REFUNDED"]).default("SUCCESS"),
  rawGatewayResponse: z.record(z.string(), z.any()).optional(),
  idempotencyKey: z.string().optional(),
});

const PaymentUpdateSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["SUCCESS", "PENDING", "FAILED", "REFUNDED"]).optional(),
  rawGatewayResponse: z.record(z.string(), z.any()).optional(),
});

export async function GET(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.BILLING_PAYMENTS_VIEW);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || "";
    const gateway = searchParams.get("gateway") || "";
    const tenantId = searchParams.get("tenantId") || "";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (gateway) where.gateway = gateway;
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.OR = [
        { transactionRef: { contains: search, mode: "insensitive" } },
        { lastFour: { contains: search, mode: "insensitive" } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
        },
      }),
      prisma.paymentTransaction.count({ where }),
    ]);

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: "billing.payments.list",
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "GET",
      detail: { page, limit, status, gateway, tenantId, search },
    });

    return NextResponse.json({
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.BILLING_PAYMENTS_RECORD);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = PaymentRecordSchema.parse(body);

    // IDEMPOTENCY: Check for existing transaction with same transactionRef
    const existingByRef = await prisma.paymentTransaction.findUnique({
      where: { transactionRef: data.transactionRef },
    });
    if (existingByRef) {
      return NextResponse.json({ success: true, transaction: existingByRef, duplicate: true });
    }

    // Verify invoice exists if provided
    if (data.invoiceId) {
      const invoice = await prisma.subscriptionInvoice.findUnique({ where: { id: data.invoiceId } });
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      if (invoice.tenantId !== data.tenantId) {
        return NextResponse.json({ error: "Invoice does not belong to this tenant" }, { status: 400 });
      }
    }

    const transaction = await prisma.paymentTransaction.create({
      data: {
        tenantId: data.tenantId,
        invoiceId: data.invoiceId ?? null,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        gateway: data.gateway,
        transactionRef: data.transactionRef,
        paymentMethodType: data.paymentMethodType ?? null,
        lastFour: data.lastFour ?? null,
        rawGatewayResponse: {
          ...data.rawGatewayResponse,
          ...(data.idempotencyKey ? { idempotencyKey: data.idempotencyKey } : {}),
        },
      },
      include: {
        tenant: { select: { id: true, name: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
    });

    // If payment succeeded and invoice is linked, mark invoice as PAID
    if (data.status === "SUCCESS" && data.invoiceId) {
      await prisma.subscriptionInvoice.update({
        where: { id: data.invoiceId },
        data: { status: "PAID", paidAt: new Date(), paymentMethod: data.gateway },
      });
    }

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `billing.transaction:${transaction.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "POST",
      detail: { transactionRef: data.transactionRef, amount: data.amount, gateway: data.gateway, tenantId: data.tenantId },
    });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.BILLING_PAYMENTS_RECORD);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = PaymentUpdateSchema.parse(body);

    const existing = await prisma.paymentTransaction.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment transaction not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.rawGatewayResponse) updateData.rawGatewayResponse = data.rawGatewayResponse;

    const transaction = await prisma.paymentTransaction.update({
      where: { id: data.id },
      data: updateData,
      include: {
        tenant: { select: { id: true, name: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
      },
    });

    // Reconcile invoice status if payment succeeded
    if (data.status === "SUCCESS" && transaction.invoiceId) {
      await prisma.subscriptionInvoice.update({
        where: { id: transaction.invoiceId },
        data: { status: "PAID", paidAt: new Date() },
      });
    }

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `billing.transaction:${transaction.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "PUT",
      detail: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.BILLING_PAYMENTS_RECORD);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Payment transaction ID is required" }, { status: 400 });
    }

    const existing = await prisma.paymentTransaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment transaction not found" }, { status: 404 });
    }

    await prisma.paymentTransaction.delete({ where: { id } });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `billing.transaction:${id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "DELETE",
      detail: { deletedTransactionRef: existing.transactionRef },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete payment" }, { status: 500 });
  }
}
