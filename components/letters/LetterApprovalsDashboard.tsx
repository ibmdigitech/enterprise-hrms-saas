"use client";

import { useState } from "react";
import { Check, X, Loader2, User, Building2, Calendar, FileText } from "lucide-react";
import { managerDecisionAction, hrDecisionAction } from "@/app/lib/actions/letter-requests";
import { toast } from "sonner";
import { format } from "date-fns";

interface LetterApprovalsDashboardProps {
  userRole: string; // ADMIN, HR, MANAGER, etc.
  requests: any[];
  onRefresh: () => void;
}

export function LetterApprovalsDashboard({ userRole, requests, onRefresh }: LetterApprovalsDashboardProps) {
  const isHrOrAdmin = userRole === "ADMIN" || userRole === "HR";
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [comments, setComments] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManagerDecision = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    setIsSubmitting(true);
    try {
      await managerDecisionAction({ requestId, action, comments });
      toast.success(action === "APPROVED" ? "Request approved by Manager!" : "Request rejected.");
      setSelectedReq(null);
      setComments("");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHrDecision = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    setIsSubmitting(true);
    try {
      const res = await hrDecisionAction({
        requestId,
        action,
        comments,
        customContent: customContent || undefined,
      });

      if (res.success) {
        toast.success(
          action === "APPROVED"
            ? "Letter officially approved, signed, and generated!"
            : "Request rejected."
        );
        setSelectedReq(null);
        setComments("");
        setCustomContent("");
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {isHrOrAdmin ? "HR Letter Verification & Generation Queue" : "Team Letter Approvals"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review employee letter submissions, verify purpose, and authorize document generation.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            {requests.length} Requests
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {requests.map((req) => {
            const emp = req.employee;
            return (
              <div
                key={req.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400">
                      {req.letterType || req.template?.type || "LETTER"}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {emp ? `${emp.firstName} ${emp.lastName}` : "Employee"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({emp?.employeeCode || "N/A"})
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        req.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : req.status === "MANAGER_APPROVED"
                          ? "bg-blue-100 text-blue-700"
                          : req.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Purpose: <span className="font-normal text-slate-600 dark:text-slate-300">{req.purpose || req.reason}</span>
                  </p>

                  {req.remarks && (
                    <p className="text-xs text-slate-500 italic">Remarks: {req.remarks}</p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>Department: {emp?.department || "General"}</span>
                    <span>Designation: {emp?.designation || "Staff"}</span>
                    <span>Requested: {format(new Date(req.createdAt), "MMM d, yyyy")}</span>
                  </div>
                </div>

                {/* Decision Actions */}
                <div className="flex items-center gap-2">
                  {req.status === "PENDING" && !isHrOrAdmin && (
                    <>
                      <button
                        onClick={() => handleManagerDecision(req.id, "REJECTED")}
                        disabled={isSubmitting}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 dark:border-rose-900/50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleManagerDecision(req.id, "APPROVED")}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
                      >
                        Approve
                      </button>
                    </>
                  )}

                  {isHrOrAdmin && req.status !== "COMPLETED" && req.status !== "REJECTED" && (
                    <button
                      onClick={() => setSelectedReq(req)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Review & Generate PDF
                    </button>
                  )}

                  {req.generatedLetter?.pdfUrl && (
                    <a
                      href={req.generatedLetter.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                    >
                      View Signed PDF
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {requests.length === 0 && (
            <div className="p-12 text-center text-xs text-slate-400 font-medium">
              No pending letter requests in your approval queue.
            </div>
          )}
        </div>
      </div>

      {/* HR Review & Generation Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600">HR Authority Review</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Authorize & Issue Official Letter
                </h3>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 font-bold p-1">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  Target Employee: {selectedReq.employee?.firstName} {selectedReq.employee?.lastName} ({selectedReq.employee?.employeeCode})
                </div>
                <div className="text-slate-500">
                  Letter Type: {selectedReq.letterType} | Purpose: {selectedReq.purpose}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  HR Review Comments / Internal Notes (Optional)
                </label>
                <input
                  type="text"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="e.g. Verified with payroll, standard certificate issued"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleHrDecision(selectedReq.id, "REJECTED")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                Reject Request
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleHrDecision(selectedReq.id, "APPROVED")}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Generate & Issue PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

