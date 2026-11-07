import { requirePageAnyPermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getTenantTicketsAction } from "@/app/lib/actions/tenant-tickets";
import { TenantSupportClient } from "./support-client";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  await requirePageAnyPermission([PERMISSIONS.SUPPORT_TICKETS_VIEW]);

  const tickets = await getTenantTicketsAction();

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <TenantSupportClient initialTickets={tickets} />
    </div>
  );
}

