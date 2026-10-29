"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";

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

  const [invoices, total, transactions, stats] = await Promise.all([
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
    revenue: {
      totalCollected: Math.round(totalCollected),
      pendingAmount: Math.round(pendingAmount),
      overdueAmount: Math.round(overdueAmount),
    },
  };
}

