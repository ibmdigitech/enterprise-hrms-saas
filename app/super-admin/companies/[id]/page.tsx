import { requireSuperAdmin } from "@/lib/auth/guards";
import { CompanyDetailsClient } from "@/components/super-admin/CompanyDetailsClient";
import { getCompanyAction } from "@/app/super-admin/companies/companies-actions";

export const dynamic = "force-dynamic";

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin("platform.tenants.view");

  const resolvedParams = await params;
  const company = await getCompanyAction(resolvedParams.id);

  if (!company) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white">Company Not Found</h1>
        <p className="text-slate-400 mt-2">The requested company does not exist.</p>
      </div>
    );
  }

  return <CompanyDetailsClient company={company} />;
}
