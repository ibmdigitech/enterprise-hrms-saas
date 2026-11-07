import { requireSuperAdmin } from "@/lib/auth/guards";
import { getMarketplaceModulesAction } from "./modules-actions";
import { ModulesMarketplaceClient } from "./modules-client";

export const dynamic = "force-dynamic";

export default async function ModulesPage() {
  await requireSuperAdmin("platform.modules.view");

  const overview = await getMarketplaceModulesAction();

  return <ModulesMarketplaceClient data={overview} />;
}
