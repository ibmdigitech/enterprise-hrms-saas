import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

const PlatformSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  category: z.enum(["GENERAL", "BRANDING", "SECURITY", "NOTIFICATIONS", "INTEGRATIONS", "BILLING"]).default("GENERAL"),
  label: z.string().min(1, "Label is required"),
  description: z.string().optional(),
  type: z.enum(["STRING", "NUMBER", "BOOLEAN", "JSON", "SELECT", "SECRET"]).default("STRING"),
  value: z.string().min(1, "Value is required"),
  options: z.any().optional(),
  isPublic: z.boolean().default(false),
  isEditable: z.boolean().default(true),
});

const PlatformSettingUpdateSchema = z.object({
  id: z.string().cuid(),
  key: z.string().min(1).optional(),
  category: z.enum(["GENERAL", "BRANDING", "SECURITY", "NOTIFICATIONS", "INTEGRATIONS", "BILLING"]).optional(),
  label: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["STRING", "NUMBER", "BOOLEAN", "JSON", "SELECT", "SECRET"]).optional(),
  value: z.string().min(1).optional(),
  options: z.any().optional(),
  isPublic: z.boolean().optional(),
  isEditable: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_SETTINGS_VIEW);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { key: { contains: search, mode: "insensitive" } },
        { label: { contains: search, mode: "insensitive" } },
      ];
    }

    const [settings, total] = await Promise.all([
      prisma.platformSetting.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ category: "asc" }, { key: "asc" }],
      }),
      prisma.platformSetting.count({ where }),
    ]);

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: "platform.settings.list",
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "GET",
      detail: { page, limit, category, search },
    });

    return NextResponse.json({
      settings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch platform settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_SETTINGS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = PlatformSettingSchema.parse(body);

    const existing = await prisma.platformSetting.findUnique({ where: { key: data.key } });
    if (existing) {
      return NextResponse.json({ error: "A setting with this key already exists" }, { status: 409 });
    }

    const setting = await prisma.platformSetting.create({
      data: {
        key: data.key,
        category: data.category,
        label: data.label,
        description: data.description ?? null,
        type: data.type,
        value: data.value,
        options: data.options ?? null,
        isPublic: data.isPublic,
        isEditable: data.isEditable,
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.setting:${setting.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "POST",
      detail: { key: setting.key, category: setting.category },
    });

    return NextResponse.json({ success: true, setting }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create platform setting" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_SETTINGS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = PlatformSettingUpdateSchema.parse(body);

    const existing = await prisma.platformSetting.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Platform setting not found" }, { status: 404 });
    }

    const setting = await prisma.platformSetting.update({
      where: { id: data.id },
      data: {
        key: data.key ?? undefined,
        category: data.category ?? undefined,
        label: data.label ?? undefined,
        description: data.description ?? undefined,
        type: data.type ?? undefined,
        value: data.value ?? undefined,
        options: data.options ?? undefined,
        isPublic: data.isPublic ?? undefined,
        isEditable: data.isEditable ?? undefined,
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.setting:${setting.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "PUT",
      detail: { key: setting.key },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update platform setting" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_SETTINGS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Platform setting ID is required" }, { status: 400 });
    }

    const existing = await prisma.platformSetting.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Platform setting not found" }, { status: 404 });
    }

    await prisma.platformSetting.delete({ where: { id } });

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.setting:${id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "DELETE",
      detail: { deletedKey: existing.key },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete platform setting" }, { status: 500 });
  }
}
