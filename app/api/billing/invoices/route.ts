import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";
import crypto from "crypto";

const InvoiceCreateSchema = z.object({
  tenantId: z.string().cuid("Tenant ID is required"),
  amount: z.number().positive("Amount must be positive"),
  taxAmount: z.number().nonnegative().default(0),
  currency: z.string().default("AED"),
  billingPeriodStart: z.string().datetime(),
  billingPeriodEnd: z.string().datetime(),
  dueDate: z.string().datetime(),
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "MANUAL"]).default("MANUAL"),
  notes: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

const InvoiceUpdateSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "VOID"]).optional(),
  paidAt: z.string().datetime().optional(),
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "MANUAL"]).optional(),
  notes: z.string().optional(),
});

function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const seq = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `INV-${year}-${seq}`;
}

export async function GET(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.BILLING_INVOICES_VIEW);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = searchParams.get("status") || "";
    const tenantId = searchParams.get("tenantId") || "";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.subscriptionInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tenant: { select: { id: true, name: true, slug: true } },
          transactions: { select: { id: true, status: true, amount: true, gateway: true, transactionRef: true } },
        },
      }),
      prisma.subscriptionInvoice.count({ where }),
    ]);

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: "billing.invoices.list",
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "GET",
      detail: { page, limit, status, tenantId, search },
    });

    return NextResponse.json({
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.BILLING_INVOICES_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = InvoiceCreateSchema.parse(body);

    // IDEMPOTENCY: Check if invoice already exists for this idempotency key
    if (data.idempotencyKey) {
      const existing = await prisma.subscriptionInvoice.findFirst({
        where: { notes: { contains: data.idempotencyKey } },
      });
      if (existing) {
        return NextResponse.json({ success: true, invoice: existing, duplicate: true });
      }
    }

    const invoiceNumber = generateInvoiceNumber();
    const totalAmount = data.amount + data.taxAmount;

    const invoice = await prisma.subscriptionInvoice.create({
      data: {
        tenantId: data.tenantId,
        invoiceNumber,
        amount: data.amount,
        taxAmount: data.taxAmount,
        totalAmount,
        currency: data.currency,
        status: "PENDING",
        billingPeriodStart: new Date(data.billingPeriodStart),
        billingPeriodEnd: new Date(data.billingPeriodEnd),
        dueDate: new Date(data.dueDate),
        paymentMethod: data.paymentMethod,
        notes: data.notes ?? `${data.idempotencyKey ?? "manual"}`,
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `billing.invoice:${invoice.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "POST",
      detail: { invoiceNumber, amount: totalAmount, tenantId: data.tenantId },
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.BILLING_INVOICES_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = InvoiceUpdateSchema.parse(body);

    const existing = await prisma.subscriptionInvoice.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.paidAt) updateData.paidAt = new Date(data.paidAt);
    if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const invoice = await prisma.subscriptionInvoice.update({
      where: { id: data.id },
      data: updateData,
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `billing.invoice:${invoice.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "PUT",
      detail: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.BILLING_INVOICES_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const existing = await prisma.subscriptionInvoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    await prisma.subscriptionInvoice.delete({ where: { id } });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `billing.invoice:${id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "DELETE",
      detail: { deletedInvoiceNumber: existing.invoiceNumber },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete invoice" }, { status: 500 });
  }
}
