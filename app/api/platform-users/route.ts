import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

const PlatformUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  passwordHash: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "PLATFORM_SUPPORT", "PLATFORM_OPS", "PLATFORM_FINANCE"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).default("ACTIVE"),
  mfaEnabled: z.boolean().default(false),
});

const PlatformUserUpdateSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  passwordHash: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "PLATFORM_SUPPORT", "PLATFORM_OPS", "PLATFORM_FINANCE"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional(),
  mfaEnabled: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_USERS_VIEW);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.platformUser.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          mfaEnabled: true,
          lastLoginAt: true,
          failedLogins: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.platformUser.count({ where }),
    ]);

    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: "platform.users.list",
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "GET",
      detail: { page, limit, role, status, search },
    });

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch platform users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_USERS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = PlatformUserSchema.parse(body);

    const existing = await prisma.platformUser.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "A platform user with this email already exists" }, { status: 409 });
    }

    const user = await prisma.platformUser.create({
      data: {
        email: data.email,
        name: data.name ?? null,
        passwordHash: data.passwordHash ?? null,
        role: data.role,
        status: data.status,
        mfaEnabled: data.mfaEnabled,
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ROLE_CHANGED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.user:${user.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "POST",
      detail: { email: user.email, role: user.role },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create platform user" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_USERS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const data = PlatformUserUpdateSchema.parse(body);

    const existing = await prisma.platformUser.findUnique({ where: { id: data.id } });
    if (!existing) {
      return NextResponse.json({ error: "Platform user not found" }, { status: 404 });
    }

    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.platformUser.findUnique({ where: { email: data.email } });
      if (emailTaken) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
      }
    }

    const user = await prisma.platformUser.update({
      where: { id: data.id },
      data: {
        email: data.email ?? undefined,
        name: data.name ?? undefined,
        passwordHash: data.passwordHash ?? undefined,
        role: data.role ?? undefined,
        status: data.status ?? undefined,
        mfaEnabled: data.mfaEnabled ?? undefined,
      },
    });

    await logSecurityEvent({
      action: SECURITY_ACTION.ROLE_CHANGED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.user:${user.id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "PUT",
      detail: { updatedFields: Object.keys(data).filter((k) => k !== "id") },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues.map((e) => e.message).join(", ") }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update platform user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await authorizePermission(PERMISSIONS.PLATFORM_USERS_MANAGE);
    if (!authResult.ok) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Platform user ID is required" }, { status: 400 });
    }

    const existing = await prisma.platformUser.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Platform user not found" }, { status: 404 });
    }

    await prisma.platformUser.delete({ where: { id } });

    await logSecurityEvent({
      action: SECURITY_ACTION.ROLE_CHANGED,
      actorEmail: (authResult.user?.email as string | undefined) ?? null,
      actorRole: authResult.user?.role ?? null,
      target: `platform.user:${id}`,
      outcome: "SUCCESS",
      requestPath: req.url,
      requestMethod: "DELETE",
      detail: { deletedEmail: existing.email },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete platform user" }, { status: 500 });
  }
}
