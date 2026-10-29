"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";

export interface AuditFilterParams {
  page?: number;
  limit?: number;
  action?: string;
  actorEmail?: string;
  outcome?: string;
}

export async function getAuditLogsAction(params: AuditFilterParams = {}) {
  await requireSuperAdmin("platform.audit.view");

  const { page = 1, limit = 25, action = "", actorEmail = "", outcome = "" } = params;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (action) {
    where.action = { contains: action, mode: "insensitive" };
  }

  if (actorEmail) {
    where.actorEmail = { contains: actorEmail, mode: "insensitive" };
  }

  if (outcome) {
    where.outcome = outcome;
  }

  const [logs, total] = await Promise.all([
    prisma.securityAuditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.securityAuditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

