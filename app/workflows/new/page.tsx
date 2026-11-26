import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";

const ALLOWED_CATEGORIES = new Set(["ONBOARDING", "OFFBOARDING", "LEAVE", "DYNAMIC_FORM", "CUSTOM"]);

export default async function NewWorkflowPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const { user } = await requirePagePermission(PERMISSIONS.WORKFLOW_MANAGE);
  const resolvedParams = searchParams ? await searchParams : {};
  const requestedCategory = resolvedParams.category?.toUpperCase() || "ONBOARDING";
  const category = ALLOWED_CATEGORIES.has(requestedCategory) ? requestedCategory : "ONBOARDING";

  let tenantId = user.tenantId;
  if (!tenantId && user.role === "SUPER_ADMIN") {
    tenantId =
      (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } }))?.id ?? null;
  }
  if (!tenantId) {
    redirect("/workflows");
  }

  const defaultName =
    category === "DYNAMIC_FORM"
      ? "New Dynamic Form"
      : category === "ONBOARDING"
        ? "Employee Onboarding Workflow"
        : "New Custom Workflow";

  const template = await prisma.workflowTemplate.create({
    data: {
      tenantId,
      name: defaultName,
      description: "",
      category,
      createdBy: user.id,
    },
  });

  redirect(`/workflows/${template.id}`);
}
