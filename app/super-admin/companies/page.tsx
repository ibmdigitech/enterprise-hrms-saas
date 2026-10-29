import { requireSuperAdmin } from "@/lib/auth/guards";
import { CompaniesClient } from "@/components/super-admin/CompaniesClient";
import { getCompaniesAction } from "./companies-actions";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  await requireSuperAdmin("platform.tenants.view");

  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const search = resolvedSearchParams.search || "";
  const status = resolvedSearchParams.status || "";

  const result = await getCompaniesAction({ page, search, status });

  return (
    <CompaniesClient
      initialData={result}
      initialParams={{ page, search, status }}
    />
  );
}
