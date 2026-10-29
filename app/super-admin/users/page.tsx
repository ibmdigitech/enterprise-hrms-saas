import { requireSuperAdmin } from "@/lib/auth/guards";
import { getUsersAction } from "./users-actions";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; role?: string; tenantId?: string }>;
}) {
  await requireSuperAdmin("platform.users.view");

  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1", 10);
  const search = resolved.search || "";
  const role = resolved.role || "";
  const tenantId = resolved.tenantId || "";

  const result = await getUsersAction({ page, search, role, tenantId });

  return (
    <UsersClient
      initialData={result}
      initialParams={{ page, search, role, tenantId }}
    />
  );
}

