import { requireSuperAdmin } from "@/lib/auth/guards";
import prisma from "@/lib/prisma";
import { DashboardClient } from "@/components/super-admin/DashboardClient";
import { getSuperAdminDashboardMetrics } from "./dashboard-actions";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  await requireSuperAdmin("platform.dashboard.view");

  const [metrics, tenants] = await Promise.all([
    getSuperAdminDashboardMetrics(),
    prisma.tenant.findMany({
      select: { id: true, status: true },
    }),
  ]);

  const activeTenants = tenants.filter((t: { status: string }) => t.status === "ACTIVE").length;

  return (
    <DashboardClient
      metrics={metrics}
      totalTenants={tenants.length}
      activeTenants={activeTenants}
    />
  );
}
