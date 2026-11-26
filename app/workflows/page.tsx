import prisma from "@/lib/prisma";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { WorkflowListClient } from "./workflow-list-client";

export default async function WorkflowsPage() {
  const { user } = await requirePagePermission(PERMISSIONS.WORKFLOW_VIEW);

  let resolvedTenantId = user.tenantId;
  if (!resolvedTenantId && user.role === "SUPER_ADMIN") {
    resolvedTenantId =
      (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } }))?.id ?? null;
  }

  const templates = resolvedTenantId
    ? await prisma.workflowTemplate.findMany({
        where: { tenantId: resolvedTenantId },
        include: { _count: { select: { steps: true, runs: true } } },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <WorkflowListClient
      templates={templates}
      tenantId={resolvedTenantId ?? ""}
    />
  );
}
