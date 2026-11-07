"use server";

import prisma from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { calculateSlaDeadline } from "@/lib/support/sla";
import { revalidatePath } from "next/cache";

/**
 * Tenant User / Company Admin: Get list of tickets submitted by the organization.
 */
export async function getTenantTicketsAction() {
  await requirePermission(PERMISSIONS.SUPPORT_TICKETS_VIEW);
  const user = await requireUser();

  if (!user.tenantId) throw new Error("Tenant context not found");

  const isTenantAdmin = user.role === "ADMIN" || user.role === "HR";

  // Admins see all company tickets; regular staff see their own created tickets
  const where: any = { tenantId: user.tenantId };
  if (!isTenantAdmin) {
    where.createdById = user.id;
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });

  return tickets;
}

/**
 * Tenant User: Submit a new inquiry, technical issue, or service request.
 */
export async function submitTenantTicketAction(data: {
  subject: string;
  description: string;
  category: string;
  priority: string;
}) {
  await requirePermission(PERMISSIONS.SUPPORT_TICKETS_CREATE);
  const user = await requireUser();

  if (!user.tenantId) throw new Error("Tenant context not found");

  const priority = data.priority || "NORMAL";
  const slaDeadline = calculateSlaDeadline(new Date(), priority);

  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId: user.tenantId,
      companyId: user.companyId || null,
      subject: data.subject.trim(),
      description: data.description.trim(),
      category: data.category || "GENERAL",
      priority,
      status: "OPEN",
      createdById: user.id,
      slaDeadline,
    },
  });

  revalidatePath("/support");
  revalidatePath("/super-admin/tickets");
  return { success: true, ticketId: ticket.id };
}

/**
 * Tenant User: Fetch details of their ticket with PUBLIC messages.
 */
export async function getTenantTicketDetailAction(ticketId: string) {
  await requirePermission(PERMISSIONS.SUPPORT_TICKETS_VIEW);
  const user = await requireUser();

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      tenantId: user.tenantId || undefined,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      messages: {
        where: { visibility: "PUBLIC" },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  });

  return ticket;
}

/**
 * Tenant User: Reply to an existing ticket.
 */
export async function replyTenantTicketAction(ticketId: string, content: string) {
  await requirePermission(PERMISSIONS.SUPPORT_TICKETS_CREATE);
  const user = await requireUser();

  // Verify ownership
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, tenantId: user.tenantId || undefined },
  });
  if (!ticket) throw new Error("Ticket not found or access denied.");

  const message = await prisma.supportTicketMessage.create({
    data: {
      ticketId,
      authorId: user.id,
      content: content.trim(),
      visibility: "PUBLIC",
    },
  });

  // Re-open if closed or waiting
  if (ticket.status === "WAITING_CUSTOMER" || ticket.status === "RESOLVED") {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS" },
    });
  }

  revalidatePath("/support");
  revalidatePath("/super-admin/tickets");
  return { success: true, messageId: message.id };
}
