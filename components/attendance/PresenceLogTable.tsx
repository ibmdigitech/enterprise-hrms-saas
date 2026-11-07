"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Filter, Search, UserCheck } from "lucide-react";

interface PresenceLogTableProps {
  records: any[];
}

export function PresenceLogTable({ records }: PresenceLogTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. Status Filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "PRESENT" && rec.status !== "PRESENT") return false;
        if (statusFilter === "LATE" && rec.status !== "LATE" && !(rec.lateMinutes > 0)) return false;
        if (statusFilter === "LEAVE" && rec.status !== "LEAVE") return false;
        if (statusFilter === "ABSENT" && rec.status !== "NO_RECORD" && rec.status !== "ABSENT") return false;
      }

      // 2. Search Filter
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const empName = `${rec.employee?.firstName || ""} ${rec.employee?.lastName || ""}`.toLowerCase();
        const shiftName = (rec.shift?.name || rec.employee?.shift?.name || "").toLowerCase();
        const status = (rec.status || "").toLowerCase();

        return empName.includes(query) || shiftName.includes(query) || status.includes(query);
      }

      return true;
    });
  }, [records, statusFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Quick Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee or shift..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline-block">
            Filter:
          </span>
          {[
            { id: "ALL", label: "All" },
            { id: "PRESENT", label: "Present" },
            { id: "LATE", label: "Late" },
            { id: "LEAVE", label: "On Leave" },
            { id: "ABSENT", label: "Absent" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                statusFilter === item.id
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 dark:border-slate-800/60 bg-transparent hover:bg-transparent">
              <TableHead className="font-bold py-4">Employee</TableHead>
              <TableHead className="font-bold py-4">Shift</TableHead>
              <TableHead className="font-bold py-4">Date</TableHead>
              <TableHead className="font-bold py-4">Check-In</TableHead>
              <TableHead className="font-bold py-4">Check-Out</TableHead>
              <TableHead className="font-bold py-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow
                key={record.id}
                className="border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                      {record.employee.firstName[0]}
                      {record.employee.lastName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {record.employee.firstName} {record.employee.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {record.employee.designation || record.employee.department || "Staff"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {record.shift || record.employee?.shift ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-[10px] font-bold">
                      <Clock className="h-2.5 w-2.5" />
                      {(record.shift || record.employee?.shift)?.name}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">—</span>
                  )}
                </TableCell>
                <TableCell className="font-medium text-slate-600 dark:text-slate-400 text-xs">
                  {new Date(record.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="font-bold text-slate-900 dark:text-white text-xs">
                  {record.checkIn
                    ? new Date(record.checkIn).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--"}
                </TableCell>
                <TableCell className="font-bold text-slate-900 dark:text-white text-xs">
                  {record.checkOut
                    ? new Date(record.checkOut).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`font-bold px-3 py-1 rounded-full border-0 text-[10px] tracking-wider uppercase ${
                      record.status === "PRESENT"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : record.status === "LATE"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : record.status === "LEAVE"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                    }`}
                  >
                    {record.status === "NO_RECORD" ? "ABSENT" : record.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}

            {filteredRecords.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-slate-400 italic font-medium">
                  No attendance records found matching this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredRecords.map((record) => (
          <div key={record.id} className="p-4 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                  {record.employee.firstName[0]}
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">
                    {record.employee.firstName} {record.employee.lastName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(record.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              <Badge className="text-[9px] font-black uppercase">
                {record.status === "NO_RECORD" ? "ABSENT" : record.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>In: {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}</span>
              <span>Out: {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}</span>
            </div>
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-400 italic">
            No matching records found.
          </div>
        )}
      </div>
    </div>
  );
}

