import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

const CompanyDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "Type is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  fileUrl: z.string().url("Invalid file URL"),
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
  version: z.string().default("1.0"),
  effectiveFrom: z.string().datetime().optional().transform((val) => (val ? new Date(val) : null)),
  effectiveTo: z.string().datetime().optional().transform((val) => (val ? new Date(val) : null)),
  isActive: z.boolean().default(true),
});

const CompanyDocumentUpdateSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().min(1).optional(),
  fileType: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  effectiveFrom: z.string().datetime().optional().transform((val) => (val ? new Date(val) : null)),
  effectiveTo: z.string().datetime().optional().transform((val) => (val ? new Date(val) : null)),
  isActive: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_TENANTS_VIEW);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const category = searchParams.get("category") || "";
    const type = searchParams.get("type") || "";
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (type) where.type = type;
    if (isActive !== null && isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.companyDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.companyDocument.count({ where }),
    ]);

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: "platform.documents.list",
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "GET",
      detail: { page, limit, category, type, isActive, search },
    });

    return NextResponse.json({
      documents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch company documents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_TENANTS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = CompanyDocumentSchema.parse(body);

    const document = await prisma.companyDocument.create({
      data: {
        title: data.title,
        type: data.type,
        category: data.category,
        description: data.description ?? null,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        version: data.version,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        isActive: data.isActive,
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.document:${document.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "POST",
      detail: { title: document.title, type: document.type, category: document.category },
    });

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create company document" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_TENANTS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = CompanyDocumentUpdateSchema.parse(body);

    const existing = await prisma.companyDocument.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Company document not found" }, { status: 404 });
    }

    const document = await prisma.companyDocument.update({
      where: { id: data.id },
      data: {
        title: data.title ?? undefined,
        type: data.type ?? undefined,
        category: data.category ?? undefined,
        description: data.description ?? undefined,
        fileUrl: data.fileUrl ?? undefined,
        fileName: data.fileName ?? undefined,
        fileType: data.fileType ?? undefined,
        version: data.version ?? undefined,
        effectiveFrom: data.effectiveFrom ?? undefined,
        effectiveTo: data.effectiveTo ?? undefined,
        isActive: data.isActive ?? undefined,
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.document:${document.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "PUT",
      detail: { title: document.title, type: document.type },
    });

    return NextResponse.json({ success: true, document });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update company document" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_TENANTS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Company document ID is required" }, { status: 400 });
    }

    const existing = await prisma.companyDocument.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Company document not found" }, { status: 404 });
    }

    await prisma.companyDocument.delete({ where: { id } });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.document:${id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "DELETE",
      detail: { deletedTitle: existing.title, deletedType: existing.type },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete company document" }, { status: 500 });
  }
}
