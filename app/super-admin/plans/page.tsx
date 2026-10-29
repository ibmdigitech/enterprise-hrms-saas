import { requireSuperAdmin } from "@/lib/auth/guards";
import { getPlansAction } from "./plans-actions";
import { PlansClient } from "./plans-client";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  await requireSuperAdmin("platform.plans.view");

  const plans = await getPlansAction();

  return <PlansClient plans={plans} />;
}

