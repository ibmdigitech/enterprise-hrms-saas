"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, 
  ChevronRight, 
  ChevronDown, 
  Users, 
  Search, 
  User as UserIcon,
  Briefcase
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface CompanyHierarchyEmployee {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  designation: string | null;
  department: string | null;
  managerId: string | null;
}

interface CompanyHierarchyProps {
  employees: CompanyHierarchyEmployee[];
}

export function CompanyHierarchy({ employees }: CompanyHierarchyProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});

  // Group employees by department
  const { deptMap, sortedDepts, totalCount } = useMemo(() => {
    const map = new Map<string, CompanyHierarchyEmployee[]>();

    employees.forEach((emp) => {
      const deptName = emp.department?.trim() || "Unassigned / General";
      if (!map.has(deptName)) {
        map.set(deptName, []);
      }
      map.get(deptName)!.push(emp);
    });

    // Sort departments alphabetically
    const depts = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));

    // Sort employees inside each department
    depts.forEach((d) => {
      map.get(d)!.sort((a, b) => a.firstName.localeCompare(b.firstName));
    });

    return {
      deptMap: map,
      sortedDepts: depts,
      totalCount: employees.length
    };
  }, [employees]);

  // Filter based on search query
  const filteredDepts = useMemo(() => {
    if (!searchQuery.trim()) return sortedDepts;
    const query = searchQuery.toLowerCase().trim();

    return sortedDepts.filter((deptName) => {
      // Matches department name
      if (deptName.toLowerCase().includes(query)) return true;
      // Matches any employee inside this department
      const members = deptMap.get(deptName) || [];
      return members.some(
        (m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(query) ||
          (m.designation && m.designation.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, sortedDepts, deptMap]);

  const toggleDept = (deptName: string) => {
    setExpandedDepts((prev) => ({
      ...prev,
      [deptName]: !prev[deptName]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    sortedDepts.forEach((d) => {
      allExpanded[d] = true;
    });
    setExpandedDepts(allExpanded);
  };

  const collapseAll = () => {
    setExpandedDepts({});
  };

  return (
    <div className="space-y-4">
      {/* Search and control bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search department, employee name, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Department accordion cards */}
      <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
        {filteredDepts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs italic">
            No departments or employees matched your search.
          </div>
        ) : (
          filteredDepts.map((deptName) => {
            const allMembers = deptMap.get(deptName) || [];
            // If searching, also filter the member list to match
            const query = searchQuery.toLowerCase().trim();
            const members = query
              ? allMembers.filter(
                  (m) =>
                    deptName.toLowerCase().includes(query) ||
                    `${m.firstName} ${m.lastName}`.toLowerCase().includes(query) ||
                    (m.designation && m.designation.toLowerCase().includes(query))
                )
              : allMembers;

            // Auto-expand if searching and matching
            const isExpanded = query ? true : !!expandedDepts[deptName];

            return (
              <div
                key={deptName}
                className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 overflow-hidden shadow-xs transition-all"
              >
                {/* Department Header Accordion Button */}
                <button
                  type="button"
                  onClick={() => toggleDept(deptName)}
                  className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/20">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {deptName}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          {allMembers.length}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {allMembers.length === 1 ? "1 team member" : `${allMembers.length} team members`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                    <span className="text-[11px] font-medium hidden sm:inline">
                      {isExpanded ? "Hide" : "View"}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-indigo-600 dark:text-indigo-400 transition-transform" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Expanded Member Grid / List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 p-3 sm:p-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                      {members.map((emp) => {
                        const initials = `${emp.firstName?.[0] ?? ""}${emp.lastName?.[0] ?? ""}`.toUpperCase();

                        return (
                          <Link
                            key={emp.id}
                            href={`/employees/${emp.id}`}
                            className="group flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800/60 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-xs transition-all"
                          >
                            {emp.photo ? (
                              <img
                                src={emp.photo}
                                alt={`${emp.firstName} ${emp.lastName}`}
                                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-indigo-100 dark:ring-indigo-950"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white shadow-xs">
                                {initials || "HR"}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5 flex items-center gap-1">
                                <Briefcase className="h-3 w-3 shrink-0 text-slate-400" />
                                <span className="truncate">{emp.designation || "Team Member"}</span>
                              </div>
                            </div>

                            <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-0.5 shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
