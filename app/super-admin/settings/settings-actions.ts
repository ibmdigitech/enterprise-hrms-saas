"use server";

import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

const DEFAULT_CONFIGS = [
  { module: "PLATFORM", key: "platform_name", label: "Platform Name", value: "Enterprise HRMS SaaS", type: "STRING" },
  { module: "PLATFORM", key: "support_email", label: "Default Support Email", value: "support@enterprisehrms.com", type: "STRING" },
  { module: "PLATFORM", key: "default_currency", label: "Default Currency", value: "AED", type: "STRING" },
  { module: "PLATFORM", key: "default_timezone", label: "Default Timezone", value: "Asia/Dubai", type: "STRING" },
  { module: "PLATFORM", key: "max_login_attempts", label: "Max Login Attempts", value: "5", type: "NUMBER" },
  { module: "PLATFORM", key: "maintenance_mode", label: "Maintenance Mode", value: "false", type: "BOOLEAN" },
];

export async function getSettingsAction() {
  await requireSuperAdmin("platform.settings.view");

  for (const item of DEFAULT_CONFIGS) {
    await prisma.serviceConfig.upsert({
      where: {
        module_key: {
          module: item.module,
          key: item.key,
        },
      },
      update: {},
      create: {
        module: item.module,
        key: item.key,
        label: item.label,
        value: item.value,
        type: item.type,
      },
    });
  }

  const configs = await prisma.serviceConfig.findMany({
    where: { module: "PLATFORM" },
    orderBy: { key: "asc" },
  });

  return configs;
}

export async function updateSettingAction(key: string, value: string) {
  await requireSuperAdmin("platform.settings.manage");

  await prisma.serviceConfig.update({
    where: {
      module_key: {
        module: "PLATFORM",
        key,
      },
    },
    data: { value },
  });

  revalidatePath("/super-admin/settings");
  return { success: true };
}

