"use server";

import prisma from "@/lib/prisma";
import { getSessionUser, requireUser } from "@/lib/auth/guards";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { calculateSlaDeadline } from "@/lib/support/sla";
import { revalidatePath } from "next/cache";

export interface TicketFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}

/**
 * Super Admin / Platform: Retrieve list of tickets across tenants with SLA & message counts.
 */
export async function getTicketsAction(params: TicketFilterParams = {}) {
  await requireSuperAdmin("platform.tickets.view");

  const { page = 1, limit = 20, status = "", priority = "", category = "", search = "" } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

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
        company: {
          select: { id: true, name: true },
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

/**
 * Super Admin: Fetch complete ticket details including thread messages.
 */
export async function getTicketDetailAction(ticketId: string) {
  await requireSuperAdmin("platform.tickets.view");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      company: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      resolvedBy: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return ticket;
}

/**
 * Super Admin: Update ticket status (OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED)
 */
export async function updateTicketStatusAction(ticketId: string, status: string, resolution?: string) {
  await requireSuperAdmin("platform.tickets.manage");
  const user = await requireUser();

  const updateData: any = { status };
  if (status === "RESOLVED" || status === "CLOSED") {
    updateData.resolvedAt = new Date();
    updateData.resolvedById = user.id;
    if (resolution) updateData.resolution = resolution;
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
  });

  revalidatePath("/super-admin/tickets");
  revalidatePath("/support");
  return { success: true };
}

/**
 * Super Admin or Platform Agent: Add a reply or internal note to a ticket.
 */
export async function addTicketMessageAction(data: {
  ticketId: string;
  content: string;
  visibility?: "PUBLIC" | "INTERNAL";
}) {
  await requireSuperAdmin("platform.tickets.manage");
  const user = await requireUser();

  const { ticketId, content, visibility = "PUBLIC" } = data;
  if (!content.trim()) throw new Error("Message content cannot be empty.");

  const message = await prisma.supportTicketMessage.create({
    data: {
      ticketId,
      authorId: user.id,
      content: content.trim(),
      visibility,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  // Automatically mark ticket as IN_PROGRESS if currently OPEN
  await prisma.supportTicket.updateMany({
    where: { id: ticketId, status: "OPEN" },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath("/super-admin/tickets");
  revalidatePath("/support");
  return { success: true, message };
}

/**
 * Create a new support ticket (Available for platform or tenant users).
 */
export async function createSupportTicketAction(data: {
  subject: string;
  description: string;
  category?: string;
  priority?: string;
  tenantId?: string;
  companyId?: string;
}) {
  const user = await requireUser();

  const tenantId = data.tenantId || user.tenantId;
  if (!tenantId) {
    throw new Error("Unable to identify tenant context for support ticket.");
  }

  const priority = data.priority || "NORMAL";
  const slaDeadline = calculateSlaDeadline(new Date(), priority);

  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId,
      companyId: data.companyId || user.companyId || null,
      subject: data.subject.trim(),
      description: data.description.trim(),
      category: data.category || "GENERAL",
      priority,
      status: "OPEN",
      createdById: user.id,
      slaDeadline,
    },
  });

  revalidatePath("/super-admin/tickets");
  revalidatePath("/support");
  return { success: true, ticketId: ticket.id };
}
