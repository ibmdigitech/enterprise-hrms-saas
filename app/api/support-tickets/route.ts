import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

const SupportTicketSchema = z.object({
  tenantId: z.string().cuid("Tenant ID is required"),
  companyId: z.string().cuid().optional(),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["GENERAL", "BILLING", "TECHNICAL", "FEATURE_REQUEST", "COMPLIANCE", "SECURITY"]).default("GENERAL"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"]).default("NORMAL"),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "WAITING_THIRD_PARTY", "RESOLVED", "CLOSED"]).default("OPEN"),
  slaDeadline: z.string().datetime().optional().transform((val) => (val ? new Date(val) : null)),
});

const SupportTicketUpdateSchema = z.object({
  id: z.string().cuid(),
  subject: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(["GENERAL", "BILLING", "TECHNICAL", "FEATURE_REQUEST", "COMPLIANCE", "SECURITY"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"]).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "WAITING_THIRD_PARTY", "RESOLVED", "CLOSED"]).optional(),
  resolution: z.string().optional(),
  slaDeadline: z.string().datetime().optional().transform((val) => (val ? new Date(val) : null)),
});

export async function GET(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_TICKETS_VIEW);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const tenantId = searchParams.get("tenantId") || "";
    const status = searchParams.get("status") || "";
    const priority = searchParams.get("priority") || "";
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
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

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: "platform.tickets.list",
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "GET",
      detail: { page, limit, tenantId, status, priority, category, search },
    });

    return NextResponse.json({
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch support tickets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_TICKETS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = SupportTicketSchema.parse(body);

    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: data.tenantId,
        companyId: data.companyId ?? null,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: data.status,
        slaDeadline: data.slaDeadline,
        createdById: (authResult.user as { id?: string })?.id ?? "",
      },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.ticket:${ticket.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "POST",
      detail: { subject: ticket.subject, category: ticket.category, priority: ticket.priority, tenantId: ticket.tenantId },
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create support ticket" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_TICKETS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = SupportTicketUpdateSchema.parse(body);

    const existing = await prisma.supportTicket.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.subject) updateData.subject = data.subject;
    if (data.description) updateData.description = data.description;
    if (data.category) updateData.category = data.category;
    if (data.priority) updateData.priority = data.priority;
    if (data.status) updateData.status = data.status;
    if (data.resolution !== undefined) updateData.resolution = data.resolution;
    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      updateData.resolvedAt = new Date();
    }
    if (data.slaDeadline) updateData.slaDeadline = data.slaDeadline;

    const ticket = await prisma.supportTicket.update({
      where: { id: data.id },
      data: updateData,
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.ticket:${ticket.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "PUT",
      detail: { status: ticket.status, resolution: ticket.resolution },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update support ticket" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_TICKETS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Support ticket ID is required" }, { status: 400 });
    }

    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    }

    await prisma.supportTicket.delete({ where: { id } });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.ticket:${id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "DELETE",
      detail: { deletedSubject: existing.subject, deletedTenantId: existing.tenantId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete support ticket" }, { status: 500 });
  }
}
