import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

const IntegrationSchema = z.object({
  type: z.enum(["EMAIL", "SMS", "ATTENDANCE_DEVICE", "AI_SERVICE", "PAYMENT_PROVIDER", "CALENDAR", "SSO"]),
  provider: z.string().min(1, "Provider is required"),
  config: z.record(z.string(), z.any()),
  isEnabled: z.boolean().default(true),
  scope: z.enum(["PLATFORM", "TENANT"]).default("TENANT"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tenantId: z.string().cuid().optional(),
});

const IntegrationUpdateSchema = z.object({
  id: z.string().cuid(),
  type: z.enum(["EMAIL", "SMS", "ATTENDANCE_DEVICE", "AI_SERVICE", "PAYMENT_PROVIDER", "CALENDAR", "SSO"]).optional(),
  provider: z.string().min(1).optional(),
  config: z.record(z.string(), z.any()).optional(),
  isEnabled: z.boolean().optional(),
  scope: z.enum(["PLATFORM", "TENANT"]).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  tenantId: z.string().cuid().optional(),
});

export async function GET(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_INTEGRATIONS_VIEW);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const type = searchParams.get("type") || "";
    const provider = searchParams.get("provider") || "";
    const scope = searchParams.get("scope") || "";
    const tenantId = searchParams.get("tenantId") || "";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (provider) where.provider = provider;
    if (scope) where.scope = scope;
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { provider: { contains: search, mode: "insensitive" } },
      ];
    }

    const [integrations, total] = await Promise.all([
      prisma.integration.findMany({
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
        },
      }),
      prisma.integration.count({ where }),
    ]);

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: "platform.integrations.list",
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "GET",
      detail: { page, limit, type, provider, scope, tenantId, search },
    });

    return NextResponse.json({
      integrations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch integrations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_INTEGRATIONS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = IntegrationSchema.parse(body);

    const integration = await prisma.integration.create({
      data: {
        type: data.type,
        provider: data.provider,
        config: data.config,
        isEnabled: data.isEnabled,
        scope: data.scope,
        name: data.name,
        description: data.description ?? null,
        tenantId: data.tenantId ?? null,
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.integration:${integration.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "POST",
      detail: { type: integration.type, provider: integration.provider, scope: integration.scope },
    });

    return NextResponse.json({ success: true, integration }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create integration" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_INTEGRATIONS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = IntegrationUpdateSchema.parse(body);

    const existing = await prisma.integration.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    const integration = await prisma.integration.update({
      where: { id: data.id },
      data: {
        type: data.type ?? undefined,
        provider: data.provider ?? undefined,
        config: data.config ?? undefined,
        isEnabled: data.isEnabled ?? undefined,
        scope: data.scope ?? undefined,
        name: data.name ?? undefined,
        description: data.description ?? undefined,
        tenantId: data.tenantId ?? undefined,
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.integration:${integration.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "PUT",
      detail: { type: integration.type, provider: integration.provider },
    });

    return NextResponse.json({ success: true, integration });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update integration" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_INTEGRATIONS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Integration ID is required" }, { status: 400 });
    }

    const existing = await prisma.integration.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    await prisma.integration.delete({ where: { id } });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.integration:${id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "DELETE",
      detail: { deletedProvider: existing.provider, deletedType: existing.type },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete integration" }, { status: 500 });
  }
}
