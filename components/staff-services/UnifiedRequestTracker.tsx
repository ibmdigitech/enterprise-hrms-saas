"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, ArrowUpRight, 
  Filter, Search, ExternalLink 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UnifiedRequestItem } from "./types";

interface UnifiedRequestTrackerProps {
  requests: UnifiedRequestItem[];
}

export function UnifiedRequestTracker({ requests }: UnifiedRequestTrackerProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = 
      filter === "ALL" ? true :
      filter === "PENDING" ? ["SUBMITTED", "MANAGER_APPROVAL", "HR_REVIEW", "FINANCE_REVIEW"].includes(r.status) :
      filter === "APPROVED" ? ["APPROVED", "COMPLETED"].includes(r.status) :
      filter === "REJECTED" ? ["REJECTED", "CANCELLED"].includes(r.status) : true;

    const matchesSearch = 
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.reference.toLowerCase().includes(search.toLowerCase()) ||
      r.details.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: UnifiedRequestItem["status"]) => {
    switch (status) {
      case "COMPLETED":
      case "APPROVED":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-0 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Approved / Done
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-0 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0 font-bold text-[10px] uppercase tracking-wider">
            Cancelled
          </Badge>
        );
      case "MANAGER_APPROVAL":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-0 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-3 w-3" /> Manager Review
          </Badge>
        );
      case "HR_REVIEW":
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-0 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-3 w-3" /> HR Review
          </Badge>
        );
      case "FINANCE_REVIEW":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-0 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Clock className="h-3 w-3" /> Finance Approval
          </Badge>
        );
      default:
        return (
          <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-0 font-bold text-[10px] uppercase tracking-wider">
            Submitted
          </Badge>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Central Request Tracking Centre
            <Badge variant="outline" className="text-[11px] font-bold text-indigo-600 border-indigo-200 dark:border-indigo-800">
              {requests.length} Total
            </Badge>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Audit history across leaves, HR letters, loans, certificates, and compliance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44 sm:w-56"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filter === tab
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                }`}
              >
                {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-6">Reference</th>
              <th className="py-3 px-6">Service Category</th>
              <th className="py-3 px-6">Submitted Date</th>
              <th className="py-3 px-6">Approval Stage</th>
              <th className="py-3 px-6">Assigned Reviewer</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
            {filteredRequests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {req.reference}
                </td>
                <td className="py-4 px-6">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {req.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-xs">
                    {req.details}
                  </div>
                </td>
                <td className="py-4 px-6 text-slate-500">
                  {format(new Date(req.submissionDate), "dd MMM yyyy")}
                </td>
                <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-300">
                  {req.currentStage}
                </td>
                <td className="py-4 px-6 text-slate-500">
                  {req.assignedApprover || "Department Lead"}
                </td>
                <td className="py-4 px-6">
                  {getStatusBadge(req.status)}
                </td>
                <td className="py-4 px-6 text-right">
                  <Link
                    href={req.viewUrl}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] transition-colors"
                  >
                    View <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}

            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 italic text-xs">
                  No service requests matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

