import { requireSuperAdmin } from "@/lib/auth/guards";
import { getSubscriptionsAction } from "./subscriptions-actions";
import { SubscriptionsClient } from "./subscriptions-client";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; planTier?: string }>;
}) {
  await requireSuperAdmin("platform.subscriptions.view");

  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1", 10);
  const search = resolved.search || "";
  const status = resolved.status || "";
  const planTier = resolved.planTier || "";

  const result = await getSubscriptionsAction({ page, search, status, planTier });

  return (
    <SubscriptionsClient
      initialData={result}
      initialParams={{ page, search, status, planTier }}
    />
  );
}

