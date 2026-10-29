import { requireSuperAdmin } from "@/lib/auth/guards";
import prisma from "@/lib/prisma";
import { CompanyOnboardingWizard } from "@/components/super-admin/CompanyOnboardingWizard";

export const dynamic = "force-dynamic";

export default async function AddCompanyPage() {
  await requireSuperAdmin("platform.tenants.create");

  const [subscriptionPlans, modules] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        priceMonthly: true,
        priceAnnual: true,
        maxEmployees: true,
        maxCompanies: true,
        maxLocations: true,
        hasPayroll: true,
        hasCompliance: true,
        hasRecruitment: true,
        hasCustomTheme: true,
        hasApiAccess: true,
      },
      orderBy: { priceMonthly: "asc" },
    }),
    prisma.module.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <main className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <CompanyOnboardingWizard plans={subscriptionPlans} modules={modules} />
    </main>
  );
}
