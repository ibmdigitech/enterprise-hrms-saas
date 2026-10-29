import { requireSuperAdmin } from "@/lib/auth/guards";
import { getModulesOverviewAction } from "./modules-actions";
import { ModulesClient } from "./modules-client";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  await requireSuperAdmin("platform.modules.view");

  const overview = await getModulesOverviewAction();

  return <ModulesClient data={overview} />;
}

