import { requireSuperAdmin } from "@/lib/auth/guards";
import { getSettingsAction } from "./settings-actions";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireSuperAdmin("platform.settings.view");

  const configs = await getSettingsAction();

  return <SettingsClient configs={configs} />;
}

