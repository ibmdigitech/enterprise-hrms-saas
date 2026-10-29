import { requireSuperAdmin } from "@/lib/auth/guards";
import { getIntegrationsAction } from "./integrations-actions";
import { IntegrationsClient } from "./integrations-client";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  await requireSuperAdmin("platform.integrations.view");

  const integrations = await getIntegrationsAction();

  return <IntegrationsClient integrations={integrations} />;
}

