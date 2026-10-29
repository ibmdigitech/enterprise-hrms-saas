import { requireSuperAdmin } from "@/lib/auth/guards";
import { getSystemHealthAction } from "./health-actions";
import { HealthClient } from "./health-client";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  await requireSuperAdmin("platform.health.view");

  const data = await getSystemHealthAction();

  return <HealthClient data={data} />;
}

