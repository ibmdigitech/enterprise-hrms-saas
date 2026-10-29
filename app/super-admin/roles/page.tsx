import { requireSuperAdmin } from "@/lib/auth/guards";
import { getRolesOverviewAction } from "./roles-actions";
import { RolesClient } from "./roles-client";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requireSuperAdmin("platform.roles.view");

  const overview = await getRolesOverviewAction();

  return <RolesClient data={overview} />;
}

