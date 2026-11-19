import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export default async function NewWorkflowPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: { where: { status: "ACTIVE" }, take: 1 },
      employee: { select: { tenantId: true } },
    },
  });

  const tenantId: string =
    user?.memberships?.[0]?.tenantId ??
    user?.employee?.tenantId ??
    (await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } }))?.id ??
    "";

  const template = await prisma.workflowTemplate.create({
    data: {
      tenantId,
      name: "New Workflow",
      description: "",
      category: "ONBOARDING",
      createdBy: session.user.id,
    },
  });

  redirect(`/workflows/${template.id}`);
}
