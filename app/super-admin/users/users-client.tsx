"use client";

import { useState, useTransition } from "react";
import { Users, Search, Shield, Ban, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { updateUserRoleAction, toggleUserStatusAction } from "./users-actions";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface UsersClientProps {
  initialData: any;
  initialParams: {
    page: number;
    search: string;
    role: string;
    tenantId: string;
  };
}

const ROLES_LIST = [
  "SUPER_ADMIN",
  "COMPANY_ADMIN",
  "HR_MANAGER",
  "DEPARTMENT_MANAGER",
  "EMPLOYEE",
  "ADMIN",
  "HR",
  "FINANCE",
  "MANAGER",
  "STAFF",
];

export function UsersClient({ initialData, initialParams }: UsersClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialParams.search);
  const [role, setRole] = useState(initialParams.role);
  const [tenantId, setTenantId] = useState(initialParams.tenantId);

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (tenantId) params.set("tenantId", tenantId);

    router.push(`/super-admin/users?${params.toString()}`);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;
    startTransition(async () => {
      await updateUserRoleAction(userId, newRole);
      router.refresh();
    });
  };

  const handleStatusToggle = async (userId: string, currentlyDisabled: boolean) => {
    const action = currentlyDisabled ? "enable" : "disable";
    if (!confirm(`Are you sure you want to ${action} this account?`)) return;
    startTransition(async () => {
      await toggleUserStatusAction(userId, !currentlyDisabled);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-400" /> Platform Users
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global identity repository across all tenants, admins, managers, and staff accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border">
            Total Users: <strong className="text-foreground font-mono">{initialData.total}</strong>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-card/90 border border-border flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
          }}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Roles</option>
          {ROLES_LIST.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={tenantId}
          onChange={(e) => {
            setTenantId(e.target.value);
          }}
          className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 max-w-[200px]"
        >
          <option value="">All Organizations</option>
          {initialData.tenants?.map((t: any) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.slug})
            </option>
          ))}
        </select>

        <button
          onClick={() => applyFilters(1)}
          disabled={isPending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-foreground rounded-lg text-sm font-medium transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-card/90 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Organization / Tenant</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {initialData.users.map((user: any) => {
                const isDisabled = Boolean(user.securityFlag?.accountDisabled);
                const tenantName =
                  user.employee?.tenant?.name ||
                  user.memberships?.[0]?.tenant?.name ||
                  "Global Platform";

                return (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{user.name || "Anonymous User"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{user.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        disabled={isPending}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-background border border-border/80 rounded px-2 py-1 text-xs font-semibold text-indigo-300 focus:outline-none"
                      >
                        {ROLES_LIST.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[160px]">{tenantName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isDisabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <Ban className="h-3 w-3" /> Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                      {format(new Date(user.createdAt), "yyyy-MM-dd")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleStatusToggle(user.id, isDisabled)}
                        disabled={isPending}
                        className={`text-xs px-2.5 py-1 rounded transition-colors ${
                          isDisabled
                            ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30"
                            : "bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-500/30"
                        }`}
                      >
                        {isDisabled ? "Enable" : "Disable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {initialData.users.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-card/90 border-t border-border text-xs text-muted-foreground">
            <div>
              Page {initialData.page} of {initialData.totalPages} ({initialData.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={initialData.page <= 1 || isPending}
                onClick={() => applyFilters(initialData.page - 1)}
                className="p-1 rounded bg-muted hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={initialData.page >= initialData.totalPages || isPending}
                onClick={() => applyFilters(initialData.page + 1)}
                className="p-1 rounded bg-muted hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

