import { WorkflowDesigner } from "./workflow-designer";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const template = await prisma.workflowTemplate.findUnique({
    where: { id },
    include: { steps: { orderBy: { orderIndex: "asc" } } },
  });
  if (!template) notFound();

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
