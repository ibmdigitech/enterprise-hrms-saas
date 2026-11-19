"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export interface InvoiceFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export async function getBillingOverviewAction(params: InvoiceFilterParams = {}) {
  await requireSuperAdmin("platform.billing.view");

  const { page = 1, limit = 20, search = "", status = "" } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { tenant: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [invoices, total, transactions, stats, tenants] = await Promise.all([
    prisma.subscriptionInvoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.subscriptionInvoice.count({ where }),
    prisma.paymentTransaction.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: { name: true },
        },
      },
    }),
    prisma.subscriptionInvoice.groupBy({
      by: ["status"],
      _sum: { totalAmount: true },
      _count: { _all: true },
    }),
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        currency: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  let totalCollected = 0;
  let pendingAmount = 0;
  let overdueAmount = 0;

  for (const s of stats) {
    const sum = s._sum.totalAmount || 0;
    if (s.status === "PAID") totalCollected += sum;
    if (s.status === "PENDING") pendingAmount += sum;
    if (s.status === "OVERDUE") overdueAmount += sum;
  }

  return {
    invoices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    transactions,
    tenants,
    revenue: {
      totalCollected: Math.round(totalCollected),
      pendingAmount: Math.round(pendingAmount),
      overdueAmount: Math.round(overdueAmount),
    },
  };
}

export async function createBillingInvoiceAction(data: {
  tenantId: string;
  amount: number;
  notes: string;
  status?: string;
  paymentMethod?: string;
}) {
  await requireSuperAdmin("platform.billing.manage");

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(now.getMonth() + 1);

  const price = Number(data.amount) || 0;
  const taxAmount = Math.round(price * 0.05 * 100) / 100;
  const totalAmount = Math.round(price * 1.05 * 100) / 100;
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-GEN`;
  const status = data.status || "PAID";

  const invoice = await prisma.subscriptionInvoice.create({
    data: {
      tenantId: data.tenantId,
      invoiceNumber,
      amount: price,
      taxAmount,
      totalAmount,
      currency: "AED",
      status,
      billingPeriodStart: now,
      billingPeriodEnd: periodEnd,
      dueDate: now,
      paidAt: status === "PAID" ? now : null,
      paymentMethod: data.paymentMethod || "CARD",
      notes: data.notes || "Enterprise Subscription & Modules Billing",
    },
    include: {
      tenant: { select: { name: true, slug: true } },
    },
  });

  if (status === "PAID") {
    await prisma.paymentTransaction.create({
      data: {
        tenantId: data.tenantId,
        invoiceId: invoice.id,
        amount: totalAmount,
        currency: "AED",
        status: "SUCCESS",
        gateway: "MANUAL",
        transactionRef: `tx_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        paymentMethodType: "CARD",
        lastFour: "4242",
      },
    });
  }

  revalidatePath("/super-admin/billing");
  revalidatePath("/settings/billing");
  return { success: true, invoice };
}
