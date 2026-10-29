"use client";

import { useState, useTransition } from "react";
import { TicketCheck, Search, MessageSquare, AlertCircle, ChevronLeft, ChevronRight, Building2, User } from "lucide-react";
import { updateTicketStatusAction } from "./tickets-actions";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface TicketsClientProps {
  initialData: any;
  initialParams: {
    page: number;
    status: string;
    priority: string;
  };
}

export function TicketsClient({ initialData, initialParams }: TicketsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(initialParams.status);
  const [priority, setPriority] = useState(initialParams.priority);

  const applyFilters = (newPage = 1) => {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);

    router.push(`/super-admin/tickets?${params.toString()}`);
  };

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    startTransition(async () => {
      await updateTicketStatusAction(ticketId, newStatus);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <TicketCheck className="h-7 w-7 text-indigo-400" /> Support Desk & Tickets
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Customer inquiries, technical issues, service requests, and SLA response tracking across organizations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap gap-3 items-center">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="WAITING">WAITING</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Priorities</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>

        <button
          onClick={() => applyFilters(1)}
          disabled={isPending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Filter
        </button>
      </div>

      {/* Tickets Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {initialData.tickets.map((t: any) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{t.subject}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                      {t.description}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Building2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>{t.tenant?.name || "Global"}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div>{t.createdBy?.name || "User"}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{t.createdBy?.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.priority === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : t.priority === "HIGH"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        t.status === "RESOLVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : t.status === "OPEN"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {format(new Date(t.createdAt), "yyyy-MM-dd")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={t.status}
                      disabled={isPending}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="WAITING">WAITING</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </td>
                </tr>
              ))}
              {initialData.tickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No support tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400">
            <div>
              Page {initialData.page} of {initialData.totalPages} ({initialData.total} tickets)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={initialData.page <= 1 || isPending}
                onClick={() => applyFilters(initialData.page - 1)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={initialData.page >= initialData.totalPages || isPending}
                onClick={() => applyFilters(initialData.page + 1)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
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

