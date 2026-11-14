import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

const CompanyModuleSchema = z.object({
  tenantId: z.string().cuid("Tenant ID is required"),
  companyId: z.string().cuid().optional(),
  moduleId: z.string().cuid("Module ID is required"),
  status: z.enum(["ENABLED", "DISABLED", "TRIAL", "EXPIRED"]).default("ENABLED"),
  config: z.record(z.string(), z.any()).optional(),
  expiresAt: z.string().datetime().optional().transform((val) => (val ? new Date(val) : null)),
});

const CompanyModuleUpdateSchema = z.object({
  id: z.string().cuid(),
  companyId: z.string().cuid().optional(),
  status: z.enum(["ENABLED", "DISABLED", "TRIAL", "EXPIRED"]).optional(),
  config: z.record(z.string(), z.any()).optional(),
  expiresAt: z.string().datetime().optional().transform((val) => (val ? new Date(val) : null)),
});

export async function GET(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_MODULES_VIEW);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const tenantId = searchParams.get("tenantId") || "";
    const moduleId = searchParams.get("moduleId") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (moduleId) where.moduleId = moduleId;
    if (status) where.status = status;
    if (search) {
      where.module = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    const [modules, total] = await Promise.all([
      prisma.companyModule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          module: {
            select: { id: true, key: true, name: true, category: true, isCore: true, isActive: true },
          },
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.companyModule.count({ where }),
    ]);

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: "platform.modules.list",
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "GET",
      detail: { page, limit, tenantId, moduleId, status, search },
    });

    return NextResponse.json({
      modules,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch company modules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_MODULES_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = CompanyModuleSchema.parse(body);

    const existing = await prisma.companyModule.findFirst({
      where: {
        tenantId: data.tenantId,
        moduleId: data.moduleId,
        companyId: data.companyId ?? null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A company module entitlement already exists for this tenant, company, and module" },
        { status: 409 }
      );
    }

    const companyModule = await prisma.companyModule.create({
      data: {
        tenantId: data.tenantId,
        companyId: data.companyId ?? null,
        moduleId: data.moduleId,
        status: data.status,
        config: data.config ?? undefined,
        expiresAt: data.expiresAt,
      },
      include: {
        module: {
          select: { id: true, key: true, name: true, category: true },
        },
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.company-module:${companyModule.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "POST",
      detail: { tenantId: companyModule.tenantId, moduleId: companyModule.moduleId, status: companyModule.status },
    });

    return NextResponse.json({ success: true, companyModule }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create company module entitlement" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_MODULES_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = CompanyModuleUpdateSchema.parse(body);

    const existing = await prisma.companyModule.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Company module entitlement not found" }, { status: 404 });
    }

    const companyModule = await prisma.companyModule.update({
      where: { id: data.id },
      data: {
        companyId: data.companyId ?? undefined,
        status: data.status ?? undefined,
        config: data.config ?? undefined,
        expiresAt: data.expiresAt ?? undefined,
      },
      include: {
        module: {
          select: { id: true, key: true, name: true, category: true },
        },
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.company-module:${companyModule.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "PUT",
      detail: { status: companyModule.status },
    });

    return NextResponse.json({ success: true, companyModule });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update company module entitlement" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_MODULES_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Company module entitlement ID is required" }, { status: 400 });
    }

    const existing = await prisma.companyModule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Company module entitlement not found" }, { status: 404 });
    }

    await prisma.companyModule.delete({ where: { id } });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.company-module:${id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "DELETE",
      detail: { deletedModuleId: existing.moduleId, deletedTenantId: existing.tenantId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete company module entitlement" }, { status: 500 });
  }
}
