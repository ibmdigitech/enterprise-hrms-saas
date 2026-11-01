// Server component for backup status page
// Updated with richer UI, action buttons, and status badges
import { requirePageAnyPermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { BackupClient } from "./BackupClient";

// Server component that guards permission and renders the client UI
export default async function BackupPage() {
  // Guard: ensure the user has the required permission
  await requirePageAnyPermission([PERMISSIONS.SYSTEM_BACKUP_VIEW]);

  // Placeholder backup data – replace with real fetch in production
  const backup = {
    lastBackup: "hr_system-20261004-084218.sql",
    sizeKB: 85.8,
    ageHours: 686.1,
    integrity: true,
    checksumMatch: true,
    schedulerRegistered: false,
    status: "warning" as const, // possible values: "healthy", "warning", "failed"
  };

  // Render the client component, passing the backup data as a JSON prop
  return <BackupClient initialBackup={backup} />;
}


