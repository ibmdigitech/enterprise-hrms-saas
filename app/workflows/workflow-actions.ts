"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkflowStepInput = {
  id?: string;
  name: string;
  description?: string | null;
  stepType?: string;
  assigneeType?: string;
  assigneeRef?: string | null;
  positionX?: number;
  positionY?: number;
  orderIndex?: number;
  isStart?: boolean;
  isEnd?: boolean;
  config?: object | null;
  permissions?: object | null;
};

export type WorkflowEdgeInput = {
  id?: string;
  fromStepId: string;
  toStepId: string;
  label?: string | null;
  condition?: string | null;
  templateId?: string;
};

export type CreateWorkflowTemplateData = {
  tenantId: string;
  name: string;
  description?: string | null;
  category?: string;
  createdBy: string;
};

export type UpdateWorkflowTemplateData = {
  name?: string;
  description?: string | null;
  category?: string;
  isActive?: boolean;
  updatedBy?: string;
  steps?: WorkflowStepInput[];
  edges?: WorkflowEdgeInput[];
};

// ---------------------------------------------------------------------------
// Get all workflow templates for a tenant
// ---------------------------------------------------------------------------
export async function getWorkflowTemplatesAction(tenantId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const templates = await prisma.workflowTemplate.findMany({
      where: { tenantId },
      include: {
        _count: { select: { steps: true, runs: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { data: templates };
  } catch (error) {
    console.error("[getWorkflowTemplatesAction]", error);
    return { error: "Failed to fetch workflow templates" };
  }
}

// ---------------------------------------------------------------------------
// Get a single workflow template with steps and edges
// ---------------------------------------------------------------------------
export async function getWorkflowTemplateAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
      include: {
        steps: {
          include: {
            fromEdges: true,
            toEdges: true,
          },
          orderBy: { orderIndex: "asc" },
        },
        runs: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            steps: { include: { step: true } },
          },
        },
      },
    });

    if (!template) {
      return { error: "Workflow template not found" };
    }

    return { data: template };
  } catch (error) {
    console.error("[getWorkflowTemplateAction]", error);
    return { error: "Failed to fetch workflow template" };
  }
}

// ---------------------------------------------------------------------------
// Create a new workflow template
// ---------------------------------------------------------------------------
export async function createWorkflowTemplateAction(
  data: CreateWorkflowTemplateData
) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const template = await prisma.workflowTemplate.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description ?? null,
        category: data.category ?? "ONBOARDING",
        createdBy: data.createdBy,
      },
    });

    revalidatePath("/workflows");
    return { data: template };
  } catch (error) {
    console.error("[createWorkflowTemplateAction]", error);
    return { error: "Failed to create workflow template" };
  }
}

// ---------------------------------------------------------------------------
// Update workflow template — saves canvas state (steps + edges)
// ---------------------------------------------------------------------------
export async function updateWorkflowTemplateAction(
  id: string,
  data: UpdateWorkflowTemplateData
) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const { steps, edges, ...templateFields } = data;

    const updated = await prisma.$transaction(async (tx: any) => {
      // Update template metadata
      const template = await tx.workflowTemplate.update({
        where: { id },
        data: {
          ...(templateFields.name !== undefined && { name: templateFields.name }),
          ...(templateFields.description !== undefined && {
            description: templateFields.description,
          }),
          ...(templateFields.category !== undefined && {
            category: templateFields.category,
          }),
          ...(templateFields.isActive !== undefined && {
            isActive: templateFields.isActive,
          }),
          ...(templateFields.updatedBy !== undefined && {
            updatedBy: templateFields.updatedBy,
          }),
          version: { increment: 1 },
        },
      });

      // If canvas data provided, replace steps and edges
      if (steps !== undefined) {
        // Delete all existing edges and steps
        await tx.workflowEdge.deleteMany({
          where: { templateId: id },
        });
        await tx.workflowStep.deleteMany({
          where: { templateId: id },
        });

        // Re-create steps
        if (steps.length > 0) {
          await tx.workflowStep.createMany({
            data: steps.map((s, idx) => ({
              id: s.id,
              templateId: id,
              name: s.name,
              description: s.description ?? null,
              stepType: s.stepType ?? "USER",
              assigneeType: s.assigneeType ?? "USER",
              assigneeRef: s.assigneeRef ?? null,
              positionX: s.positionX ?? 0,
              positionY: s.positionY ?? 0,
              orderIndex: s.orderIndex ?? idx,
              isStart: s.isStart ?? false,
              isEnd: s.isEnd ?? false,
              config: (s.config as any) ?? undefined,
              permissions: (s.permissions as any) ?? undefined,
            })),
          });
        }

        // Re-create edges
        if (edges && edges.length > 0) {
          await tx.workflowEdge.createMany({
            data: edges.map((e) => ({
              id: e.id,
              templateId: id,
              fromStepId: e.fromStepId,
              toStepId: e.toStepId,
              label: e.label ?? null,
              condition: e.condition ?? null,
            })),
          });
        }
      }

      return template;
    });

    revalidatePath("/workflows");
    revalidatePath(`/workflows/${id}`);
    return { data: updated };
  } catch (error) {
    console.error("[updateWorkflowTemplateAction]", error);
    return { error: "Failed to update workflow template" };
  }
}

// ---------------------------------------------------------------------------
// Delete a workflow template (cascades to steps, edges, runs)
// ---------------------------------------------------------------------------
export async function deleteWorkflowTemplateAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    await prisma.workflowTemplate.delete({ where: { id } });

    revalidatePath("/workflows");
    return { success: true };
  } catch (error) {
    console.error("[deleteWorkflowTemplateAction]", error);
    return { error: "Failed to delete workflow template" };
  }
}

// ---------------------------------------------------------------------------
// Toggle published state
// ---------------------------------------------------------------------------
export async function publishWorkflowTemplateAction(id: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
      select: { isPublished: true },
    });

    if (!template) {
      return { error: "Workflow template not found" };
    }

    const updated = await prisma.workflowTemplate.update({
      where: { id },
      data: {
        isPublished: !template.isPublished,
        updatedBy: session.user.id ?? session.user.email ?? "system",
      },
    });

    revalidatePath("/workflows");
    revalidatePath(`/workflows/${id}`);
    return { data: updated };
  } catch (error) {
    console.error("[publishWorkflowTemplateAction]", error);
    return { error: "Failed to toggle publish state" };
  }
}
