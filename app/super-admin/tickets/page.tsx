import { requireSuperAdmin } from "@/lib/auth/guards";
import { getTicketsAction } from "./tickets-actions";
import { TicketsClient } from "./tickets-client";

export const dynamic = "force-dynamic";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; priority?: string }>;
}) {
  await requireSuperAdmin("platform.tickets.view");

  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1", 10);
  const status = resolved.status || "";
  const priority = resolved.priority || "";

  const result = await getTicketsAction({ page, status, priority });

  return (
    <TicketsClient
      initialData={result}
      initialParams={{ page, status, priority }}
    />
  );
}

