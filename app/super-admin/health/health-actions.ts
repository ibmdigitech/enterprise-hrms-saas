"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";

export async function getSystemHealthAction() {
  await requireSuperAdmin("platform.health.view");

  const startDb = Date.now();
  let dbStatus = "HEALTHY";
  let dbLatency = 0;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - startDb;
  } catch (e) {
    dbStatus = "DEGRADED";
  }

  const [tenants, employees, users, auditCount, errorCount, errors] = await Promise.all([
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        databaseUrl: true,
      },
    }),
    prisma.employee.count(),
    prisma.user.count(),
    prisma.securityAuditLog.count(),
    prisma.applicationError.count().catch(() => 0),
    prisma.applicationError.findMany({
      take: 10,
      orderBy: { lastSeenAt: "desc" },
    }).catch(() => []),
  ]);

  const activeTenants = tenants.filter((t) => t.status === "ACTIVE").length;
  const dedicatedDbTenants = tenants.filter((t) => Boolean(t.databaseUrl)).length;

  return {
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
      driver: "PostgreSQL Prisma Client",
    },
    system: {
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version,
    },
    platform: {
      totalTenants: tenants.length,
      activeTenants,
      dedicatedDatabases: dedicatedDbTenants,
      totalEmployees: employees,
      totalUsers: users,
      totalAuditEvents: auditCount,
      unresolvedErrors: errorCount,
    },
    recentErrors: errors,
  };
}

