import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { WorkflowDesigner } from "./workflow-designer";

export default async function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requirePagePermission(PERMISSIONS.WORKFLOW_VIEW);

  const template = await prisma.workflowTemplate.findUnique({
    where: { id },
    include: { steps: { orderBy: { orderIndex: "asc" } } },
  });
  if (!template) notFound();

  if (user.role !== "SUPER_ADMIN" && user.tenantId !== template.tenantId) {
    redirect("/workflows");
  }

  const edges = await prisma.workflowEdge.findMany({
    where: { templateId: id },
  });

  return (
    <WorkflowDesigner
      template={template}
      initialSteps={template.steps}
      initialEdges={edges}
    />
  );
}
