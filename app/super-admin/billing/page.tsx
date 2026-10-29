import { requireSuperAdmin } from "@/lib/auth/guards";
import { getBillingOverviewAction } from "./billing-actions";
import { BillingClient } from "./billing-client";

export const dynamic = "force-dynamic";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  await requireSuperAdmin("platform.billing.view");

  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1", 10);
  const search = resolved.search || "";
  const status = resolved.status || "";

  const result = await getBillingOverviewAction({ page, search, status });

  return (
    <BillingClient
      initialData={result}
      initialParams={{ page, search, status }}
    />
  );
}

