"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export interface UserFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  tenantId?: string;
}

export async function getUsersAction(params: UserFilterParams = {}) {
  await requireSuperAdmin("platform.users.view");

  const { page = 1, limit = 20, search = "", role = "", tenantId = "" } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (tenantId) {
    where.OR = [
      { employee: { tenantId } },
      { memberships: { some: { tenantId } } },
    ];
  }

  const [users, total, tenants] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            tenantId: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        memberships: {
          select: {
            role: true,
            tenantId: true,
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        securityFlag: {
          select: {
            accountDisabled: true,
            disabledReason: true,
            failedLoginAttempts: true,
            lockedUntil: true,
            lastLoginAt: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.tenant.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    tenants,
  };
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  await requireSuperAdmin("platform.users.manage");

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/super-admin/users");
  return { success: true };
}

export async function toggleUserStatusAction(userId: string, disabled: boolean, reason?: string) {
  await requireSuperAdmin("platform.users.manage");

  await prisma.userSecurityFlag.upsert({
    where: { userId },
    create: {
      userId,
      accountDisabled: disabled,
      disabledReason: reason || (disabled ? "Disabled by Super Admin" : null),
      disabledAt: disabled ? new Date() : null,
    },
    update: {
      accountDisabled: disabled,
      disabledReason: reason || (disabled ? "Disabled by Super Admin" : null),
      disabledAt: disabled ? new Date() : null,
    },
  });

  revalidatePath("/super-admin/users");
  return { success: true };
}

