import { requireSuperAdmin } from "@/lib/auth/guards";
import { getRoleRequestsAction } from "./role-requests-actions";
import { RoleRequestsClient } from "./role-requests-client";

export const dynamic = "force-dynamic";

export default async function RoleRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; role?: string; search?: string }>;
}) {
  await requireSuperAdmin("platform.roles.manage");

  const resolved = await searchParams;
  const page = parseInt(resolved.page || "1", 10);
  const status = resolved.status || "";
  const role = resolved.role || "";
  const search = resolved.search || "";

  const result = await getRoleRequestsAction({ page, status, role, search });

  return (
    <RoleRequestsClient
      initialData={result}
      initialParams={{ page, status, role, search }}
    />
  );
}