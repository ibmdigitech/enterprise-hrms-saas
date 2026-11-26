"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export type WorkflowStepConfig = {
  triggerEvent?: string;
  fields?: Array<{
    id: string;
    type: string;
    label: string;
    required?: boolean;
  }>;
  conditionExpr?: string;
};

export type WorkflowStepInput = {
  id: string;
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
  config?: WorkflowStepConfig | null;
  permissions?: { readOnly: boolean; editable: boolean; hidden: boolean } | null;
};

export type WorkflowEdgeInput = {
  id: string;
  fromStepId: string;
  toStepId: string;
  label?: string | null;
  condition?: string | null;
};

export type CreateWorkflowTemplateData = {
  tenantId: string;
  name: string;
  description?: string | null;
  category?: string;
};

export type UpdateWorkflowTemplateData = {
  name?: string;
  description?: string | null;
  category?: string;
  isActive?: boolean;
  steps?: WorkflowStepInput[];
  edges?: WorkflowEdgeInput[];
};

function assertTenantMatch(actorRole: string, actorTenantId: string | null, targetTenantId: string) {
  if (actorRole === "SUPER_ADMIN") return;
  if (!actorTenantId || actorTenantId !== targetTenantId) {
    throw new Error("Unauthorized access to this organization's workflow.");
  }
}

export async function getWorkflowTemplatesAction(tenantId: string) {
  try {
    const actor = await requirePermission(PERMISSIONS.WORKFLOW_VIEW);
    assertTenantMatch(actor.role, actor.tenantId, tenantId);

    const templates = await prisma.workflowTemplate.findMany({
      where: { tenantId },
      include: {
        _count: { select: { steps: true, runs: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { data: templates };
  } catch (error) {
    console.error("[getWorkflowTemplatesAction]", error);
    return { error: error instanceof Error ? error.message : "Failed to fetch workflow templates" };
  }
}

export async function getWorkflowTemplateAction(id: string) {
  try {
    const actor = await requirePermission(PERMISSIONS.WORKFLOW_VIEW);

    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
      include: {
        steps: {
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

    assertTenantMatch(actor.role, actor.tenantId, template.tenantId);

    const edges = await prisma.workflowEdge.findMany({
      where: { templateId: id },
    });

    return { data: { template, edges } };
  } catch (error) {
    console.error("[getWorkflowTemplateAction]", error);
    return { error: error instanceof Error ? error.message : "Failed to fetch workflow template" };
  }
}

export async function createWorkflowTemplateAction(data: CreateWorkflowTemplateData) {
  try {
    const actor = await requirePermission(PERMISSIONS.WORKFLOW_MANAGE);
    assertTenantMatch(actor.role, actor.tenantId, data.tenantId);

    const template = await prisma.workflowTemplate.create({
      data: {
        tenantId: data.tenantId,
        name: data.name.trim() || "New Workflow",
        description: data.description ?? null,
        category: data.category ?? "ONBOARDING",
        createdBy: actor.id,
      },
    });

    revalidatePath("/workflows");
    return { data: template };
  } catch (error) {
    console.error("[createWorkflowTemplateAction]", error);
    return { error: error instanceof Error ? error.message : "Failed to create workflow template" };
  }
}

export async function updateWorkflowTemplateAction(
  id: string,
  data: UpdateWorkflowTemplateData
) {
  try {
    const actor = await requirePermission(PERMISSIONS.WORKFLOW_MANAGE);

    const existing = await prisma.workflowTemplate.findUnique({
      where: { id },
      select: { id: true, tenantId: true },
    });
    if (!existing) {
      return { error: "Workflow template not found" };
    }
    assertTenantMatch(actor.role, actor.tenantId, existing.tenantId);

    const { steps, edges, ...templateFields } = data;

    // Ensure globally unique step & edge IDs scoped to this template
    const stepIdMap = new Map<string, string>();
    const normalizeStepId = (rawId: string) => {
      if (stepIdMap.has(rawId)) return stepIdMap.get(rawId)!;
      const scoped = rawId.startsWith(`${id}_`) ? rawId : `${id}_${rawId}`;
      stepIdMap.set(rawId, scoped);
      return scoped;
    };

    const updated = await prisma.$transaction(async (tx: any) => {
      const template = await tx.workflowTemplate.update({
        where: { id },
        data: {
          ...(templateFields.name !== undefined && { name: templateFields.name.trim() || "Untitled Workflow" }),
          ...(templateFields.description !== undefined && {
            description: templateFields.description,
          }),
          ...(templateFields.category !== undefined && {
            category: templateFields.category,
          }),
          ...(templateFields.isActive !== undefined && {
            isActive: templateFields.isActive,
          }),
          updatedBy: actor.id,
          version: { increment: 1 },
        },
      });

      if (steps !== undefined) {
        await tx.workflowEdge.deleteMany({
          where: { templateId: id },
        });
        await tx.workflowStep.deleteMany({
          where: { templateId: id },
        });

        if (steps.length > 0) {
          await tx.workflowStep.createMany({
            data: steps.map((s, idx) => ({
              id: normalizeStepId(s.id),
              templateId: id,
              name: s.name || "Untitled Step",
              description: s.description ?? null,
              stepType: s.stepType ?? "USER",
              assigneeType: s.assigneeType ?? "USER",
              assigneeRef: s.assigneeRef ?? null,
              positionX: s.positionX ?? 0,
              positionY: s.positionY ?? 0,
              orderIndex: s.orderIndex ?? idx,
              isStart: s.isStart ?? false,
              isEnd: s.isEnd ?? false,
              config: (s.config as object) ?? undefined,
              permissions: (s.permissions as object) ?? undefined,
            })),
          });
        }

        if (edges && edges.length > 0) {
          const validEdgeRows = edges
            .filter((e) => stepIdMap.has(e.fromStepId) && stepIdMap.has(e.toStepId))
            .map((e, idx) => ({
              id: e.id.startsWith(`${id}_`) ? e.id : `${id}_edge_${idx}_${Date.now()}`,
              templateId: id,
              fromStepId: stepIdMap.get(e.fromStepId)!,
              toStepId: stepIdMap.get(e.toStepId)!,
              label: e.label ?? null,
              condition: e.condition ?? null,
            }));

          if (validEdgeRows.length > 0) {
            await tx.workflowEdge.createMany({
              data: validEdgeRows,
            });
          }
        }
      }

      return template;
    });

    revalidatePath("/workflows");
    revalidatePath(`/workflows/${id}`);
    return { data: updated, success: true };
  } catch (error) {
    console.error("[updateWorkflowTemplateAction]", error);
    return { error: error instanceof Error ? error.message : "Failed to update workflow template" };
  }
}

export async function deleteWorkflowTemplateAction(id: string) {
  try {
    const actor = await requirePermission(PERMISSIONS.WORKFLOW_MANAGE);
    const existing = await prisma.workflowTemplate.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!existing) {
      return { error: "Workflow template not found" };
    }
    assertTenantMatch(actor.role, actor.tenantId, existing.tenantId);

    await prisma.workflowTemplate.delete({ where: { id } });

    revalidatePath("/workflows");
    return { success: true };
  } catch (error) {
    console.error("[deleteWorkflowTemplateAction]", error);
    return { error: error instanceof Error ? error.message : "Failed to delete workflow template" };
  }
}

export async function publishWorkflowTemplateAction(id: string) {
  try {
    const actor = await requirePermission(PERMISSIONS.WORKFLOW_MANAGE);
    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
      select: { isPublished: true, tenantId: true },
    });

    if (!template) {
      return { error: "Workflow template not found" };
    }
    assertTenantMatch(actor.role, actor.tenantId, template.tenantId);

    const updated = await prisma.workflowTemplate.update({
      where: { id },
      data: {
        isPublished: !template.isPublished,
        updatedBy: actor.id,
      },
    });

    revalidatePath("/workflows");
    revalidatePath(`/workflows/${id}`);
    return { data: updated, success: true };
  } catch (error) {
    console.error("[publishWorkflowTemplateAction]", error);
    return { error: error instanceof Error ? error.message : "Failed to toggle publish state" };
  }
}

export async function runWorkflowTemplateAction(id: string, entityType = "MANUAL_TRIGGER") {
  try {
    const actor = await requirePermission(PERMISSIONS.WORKFLOW_RUN);
    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { orderIndex: "asc" } },
      },
    });

    if (!template) {
      return { error: "Workflow template not found" };
    }
    assertTenantMatch(actor.role, actor.tenantId, template.tenantId);

    const run = await prisma.$transaction(async (tx: any) => {
      const createdRun = await tx.workflowRun.create({
        data: {
          templateId: template.id,
          tenantId: template.tenantId,
          triggeredBy: actor.id,
          entityType,
          status: "ACTIVE",
        },
      });

      if (template.steps.length > 0) {
        await tx.workflowRunStep.createMany({
          data: template.steps.map((step, idx) => ({
            runId: createdRun.id,
            stepId: step.id,
            status: idx === 0 ? "COMPLETED" : idx === 1 ? "IN_PROGRESS" : "PENDING",
            startedAt: idx <= 1 ? new Date() : null,
            completedAt: idx === 0 ? new Date() : null,
            completedBy: idx === 0 ? actor.id : null,
          })),
        });
      }

      return createdRun;
    });

    revalidatePath("/workflows");
    revalidatePath(`/workflows/${id}`);
    return { data: run, success: true };
  } catch (error) {
    console.error("[runWorkflowTemplateAction]", error);
    return { error: error instanceof Error ? error.message : "Failed to run workflow" };
  }
}
