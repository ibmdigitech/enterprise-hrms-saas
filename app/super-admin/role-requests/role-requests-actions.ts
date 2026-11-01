"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

export interface RoleRequestFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  role?: string;
  search?: string;
}

export interface RoleRequestListResult {
  requests: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getRoleRequestsAction(params: RoleRequestFilterParams = {}): Promise<RoleRequestListResult> {
  await requireSuperAdmin("platform.roles.manage");

  const { page = 1, limit = 20, status = "", role = "", search = "" } = params;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (role) where.requestedRole = role;
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { tenant: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.roleRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.roleRequest.count({ where }),
  ]);

  return {
    requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRoleRequestAction(requestId: string) {
  await requireSuperAdmin("platform.roles.manage");

  const request = await prisma.roleRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, role: true },
      },
      tenant: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!request) throw new Error("Role request not found");
  return request;
}

export async function approveRoleRequestAction(requestId: string) {
  await requireSuperAdmin("platform.roles.manage");

  const request = await prisma.roleRequest.findUnique({
    where: { id: requestId },
    include: { 
      user: { include: { employee: true } },
      tenant: true 
    },
  });

  if (!request) throw new Error("Role request not found");
  if (request.status !== "PENDING") throw new Error("Request already processed");

  await prisma.$transaction(async (tx) => {
    await tx.roleRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", updatedAt: new Date() },
    });

    await tx.user.update({
      where: { id: request.userId },
      data: { role: request.requestedRole },
    });

    await tx.notification.create({
      data: {
        employeeId: request.user.employee?.id || "",
        title: "Role Access Approved",
        message: `Your request for ${request.requestedRole} access has been approved.${request.tenant ? ` for ${request.tenant.name}` : ""}`,
        type: "SUCCESS",
        link: "/dashboard",
      },
    });
  });

  revalidatePath("/super-admin/role-requests");
  return { success: true };
}

export async function rejectRoleRequestAction(requestId: string, reason?: string) {
  await requireSuperAdmin("platform.roles.manage");

  const request = await prisma.roleRequest.findUnique({
    where: { id: requestId },
    include: { 
      user: { include: { employee: true } },
      tenant: true 
    },
  });

  if (!request) throw new Error("Role request not found");
  if (request.status !== "PENDING") throw new Error("Request already processed");

  await prisma.$transaction(async (tx) => {
    await tx.roleRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", updatedAt: new Date() },
    });

    await tx.notification.create({
      data: {
        employeeId: request.user.employee?.id || "",
        title: "Role Access Request Declined",
        message: `Your request for ${request.requestedRole} access was declined.${reason ? ` Reason: ${reason}` : ""}${request.tenant ? ` for ${request.tenant.name}` : ""}`,
        type: "ALERT",
        link: "/dashboard/request-access",
      },
    });
  });

  revalidatePath("/super-admin/role-requests");
  return { success: true };
}

export async function getRoleRequestStatsAction() {
  await requireSuperAdmin("platform.roles.manage");

  const [byStatus, byRole, totals] = await Promise.all([
    prisma.roleRequest.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.roleRequest.groupBy({
      by: ["requestedRole"],
      _count: true,
    }),
    prisma.roleRequest.aggregate({
      _count: true,
    }),
  ]);

  return { byStatus, byRole, totals };
}

export async function updateRoleRequestStatusAction(requestId: string, status: "APPROVED" | "REJECTED", reason?: string) {
  if (status === "APPROVED") {
    return approveRoleRequestAction(requestId);
  } else {
    return rejectRoleRequestAction(requestId, reason);
  }
}