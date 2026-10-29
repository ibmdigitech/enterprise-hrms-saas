import { requireSuperAdmin } from "@/lib/auth/guards";
import { getAuditLogsAction } from "./audit-actions";
import { AuditClient } from "./audit-client";

export const dynamic = "force-dynamic";

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; actorEmail?: string; outcome?: string }>;
}) {
  await requireSuperAdmin("platform.audit.view");

  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1", 10);
  const action = resolved.action || "";
  const actorEmail = resolved.actorEmail || "";
  const outcome = resolved.outcome || "";

  const result = await getAuditLogsAction({ page, action, actorEmail, outcome });

  return (
    <AuditClient
      initialData={result}
      initialParams={{ page, action, actorEmail, outcome }}
    />
  );
}

