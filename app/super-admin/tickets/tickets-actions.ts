"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export interface TicketFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}

export async function getTicketsAction(params: TicketFilterParams = {}) {
  await requireSuperAdmin("platform.tickets.view");

  const { page = 1, limit = 20, status = "", priority = "" } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateTicketStatusAction(ticketId: string, status: string) {
  await requireSuperAdmin("platform.tickets.manage");

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });

  revalidatePath("/super-admin/tickets");
  return { success: true };
}

