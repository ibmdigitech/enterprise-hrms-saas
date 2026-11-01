"use server";

import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export async function runBackupAction(_formData?: FormData) {
    await requirePermission(PERMISSIONS.SYSTEM_BACKUP_VIEW);
    console.log("Run backup triggered");
}

export async function registerSchedulerAction(_formData?: FormData) {
    await requirePermission(PERMISSIONS.SYSTEM_BACKUP_VIEW);
    console.log("Register scheduler triggered");
}
