import { requireSuperAdmin } from "@/lib/auth/guards";
import { getAiServicesOverviewAction } from "./ai-services-actions";
import { AiServicesClient } from "./ai-services-client";

export const dynamic = "force-dynamic";

export default async function AiServicesPage() {
  await requireSuperAdmin("platform.settings.view");

  const overview = await getAiServicesOverviewAction();

  return <AiServicesClient data={overview} />;
}

