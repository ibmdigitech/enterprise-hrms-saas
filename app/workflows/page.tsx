import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { WorkflowListClient } from "./workflow-list-client";

export default async function WorkflowsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: { where: { status: "ACTIVE" }, take: 1 },
      employee: { select: { tenantId: true } },
    },
  });

  const tenantId =
    user?.memberships?.[0]?.tenantId ?? user?.employee?.tenantId;
  if (!tenantId && user?.role !== "SUPER_ADMIN") redirect("/dashboard");

  const resolvedTenantId =
    tenantId ??
    (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } }))?.id;

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
