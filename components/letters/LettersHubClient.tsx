"use client";

import { useState } from "react";
import { 
  FileText, Plus, Download as DownloadIcon, Clock, CheckCircle2, 
  AlertCircle, ShieldCheck, UserCheck, Eye, Layers, Stamp, FileCode
} from "lucide-react";
import { LetterWorkflowTracker } from "@/components/letters/LetterWorkflowTracker";
import { LetterRequestModal } from "@/components/letters/LetterRequestModal";
import { LetterApprovalsDashboard } from "@/components/letters/LetterApprovalsDashboard";
import { TemplatesPage } from "@/app/dashboard/settings/templates/page-client";
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm";
import type { CompanySettings } from "@/app/lib/actions/company-settings";
import { format } from "date-fns";

interface LettersHubClientProps {
  userRole: string;
  employeeProfile: any | null;
  initialRequests: any[];
  teamRequests: any[];
  allRequests: any[];
  companySettings?: CompanySettings | null;
}

export function LettersHubClient({
  userRole,
  employeeProfile,
  initialRequests,
  teamRequests,
  allRequests,
  companySettings,
}: LettersHubClientProps) {
  const isHrOrAdmin = userRole === "ADMIN" || userRole === "HR" || userRole === "SUPER_ADMIN" || userRole === "COMPANY_ADMIN";
  const isManager = userRole === "MANAGER" || isHrOrAdmin;

  const [activeTab, setActiveTab] = useState<"my" | "team" | "hr" | "templates" | "branding">("my");
  const [myRequests, setMyRequests] = useState<any[]>(initialRequests);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequestForTracker, setSelectedRequestForTracker] = useState<any | null>(
    initialRequests[0] || null
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em]">
              <ShieldCheck className="h-3.5 w-3.5" /> Corporate Letter Governance
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase italic">
              Official Letter Requests
            </h1>
            <p className="text-slate-400 text-sm max-w-xl font-medium">
              Request employment certificates, salary letters, and embassy verification. 
              Track departmental approvals in real-time, configure templates, and apply authorized digital stamps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {isHrOrAdmin && (
              <>
                <button
                  onClick={() => setActiveTab("templates")}
                  className={`px-4 py-3 rounded-2xl font-bold text-xs tracking-wider border transition-all flex items-center gap-2 ${
                    activeTab === "templates"
                      ? "bg-white text-slate-900 border-white shadow-lg"
                      : "bg-white/10 hover:bg-white/20 text-white border-white/10"
                  }`}
                  title="Create and manage letter templates"
                >
                  <FileCode className="h-4 w-4 text-indigo-300" /> Letter Templates
                </button>
                <button
                  onClick={() => setActiveTab("branding")}
                  className={`px-4 py-3 rounded-2xl font-bold text-xs tracking-wider border transition-all flex items-center gap-2 ${
                    activeTab === "branding"
                      ? "bg-white text-slate-900 border-white shadow-lg"
                      : "bg-white/10 hover:bg-white/20 text-white border-white/10"
                  }`}
                  title="Upload company stamp, HR signature, logo & letterhead"
                >
                  <Stamp className="h-4 w-4 text-amber-300" /> Stamp & Signature
                </button>
              </>
            )}

            {employeeProfile && (
              <button
                onClick={() => setIsRequestModalOpen(true)}
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-wider shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all"
              >
                <Plus className="h-4 w-4" /> Request Letter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Roles */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 text-xs font-black uppercase tracking-wider flex-wrap">
        <button
          onClick={() => setActiveTab("my")}
          className={`pb-3 px-2 transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "my"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <FileText className="h-4 w-4" /> My Letter Requests ({myRequests.length})
        </button>

        {isManager && (
          <button
            onClick={() => setActiveTab("team")}
            className={`pb-3 px-2 transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "team"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <UserCheck className="h-4 w-4" /> Team Approvals ({teamRequests.length})
          </button>
        )}

        {isHrOrAdmin && (
          <>
            <button
              onClick={() => setActiveTab("hr")}
              className={`pb-3 px-2 transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "hr"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <Layers className="h-4 w-4" /> HR Generation Queue ({allRequests.length})
            </button>

            <button
              onClick={() => setActiveTab("templates")}
              className={`pb-3 px-2 transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "templates"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <FileCode className="h-4 w-4" /> Letter Templates Builder
            </button>

            <button
              onClick={() => setActiveTab("branding")}
              className={`pb-3 px-2 transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "branding"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <Stamp className="h-4 w-4" /> Stamp, Signature & Letterhead
            </button>
          </>
        )}
      </div>

      {/* Tab: My Requests */}
      {activeTab === "my" && (
        <div className="space-y-6">
          {/* Active tracker preview card */}
          {selectedRequestForTracker && (
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-indigo-600">Live Request Tracker</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedRequestForTracker.letterType?.replace(/_/g, " ") || "Letter Request"} &bull; Purpose: {selectedRequestForTracker.purpose}
                  </h3>
                </div>
                {selectedRequestForTracker.generatedLetter?.pdfUrl && (
                  <a
                    href={selectedRequestForTracker.generatedLetter.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" /> Download Signed PDF
                  </a>
                )}
              </div>
              <LetterWorkflowTracker
                status={selectedRequestForTracker.status}
                approvals={selectedRequestForTracker.approvals}
              />
            </div>
          )}

          {/* Requests Table */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Request History & Generated Documents
              </h2>
              <span className="text-xs text-slate-400 font-medium">All approved documents include official company stamp & signature</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequestForTracker(req)}
                  className={`p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    selectedRequestForTracker?.id === req.id
                      ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                      : ""
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400">
                        {req.letterType?.replace(/_/g, " ") || "LETTER"}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
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
                      {req.requiredDate && (
                        <span className="text-[11px] text-slate-400">
                          &bull; Needed by: {format(new Date(req.requiredDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {req.purpose || req.reason}
                    </div>
                    {req.remarks && (
                      <p className="text-xs text-slate-500 italic">{req.remarks}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-medium">
                      {format(new Date(req.createdAt), "MMM d, yyyy")}
                    </span>
                    {req.generatedLetter?.pdfUrl ? (
                      <a
                        href={req.generatedLetter.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase flex items-center gap-1.5"
                      >
                        <DownloadIcon className="h-3.5 w-3.5" /> PDF
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">In Approval</span>
                    )}
                  </div>
                </div>
              ))}

              {myRequests.length === 0 && (
                <div className="p-16 text-center space-y-3">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    No letter requests submitted yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Need a salary certificate, employment verification, or embassy letter? Click &apos;Request New Letter&apos; to submit a request.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Team Approvals */}
      {activeTab === "team" && (
        <LetterApprovalsDashboard
          userRole={userRole}
          requests={teamRequests}
          onRefresh={() => window.location.reload()}
        />
      )}

      {/* Tab: HR Generation Queue */}
      {activeTab === "hr" && (
        <LetterApprovalsDashboard
          userRole={userRole}
          requests={allRequests}
          onRefresh={() => window.location.reload()}
        />
      )}

      {/* Tab: Letter Templates Builder */}
      {activeTab === "templates" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
          <TemplatesPage />
        </div>
      )}

      {/* Tab: Stamp, Signature & Letterhead Branding */}
      {activeTab === "branding" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Stamp className="h-5 w-5 text-indigo-600" /> Official Letterhead, Stamp & Authorized Signature
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Upload your company letterhead background, official round stamp, authorized HR signature, and company logo. These assets are automatically stamped and rendered on all approved letter requests, salary certificates, and PDF documents.
            </p>
          </div>

          <CompanySettingsForm
            initialSettings={
              companySettings ?? {
                name: "IBMDigiTech LLC",
                logo: "",
                address: "Dubai, UAE",
                phone: "+971 4 123 4567",
                email: "hr@ibmdigitech.com",
                website: "https://ibmdigitech.com",
                signature: "",
                stamp: "",
                letterhead: "",
              }
            }
          />
        </div>
      )}

      {/* Request Modal */}
      {isRequestModalOpen && employeeProfile && (
        <LetterRequestModal
          profile={employeeProfile}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  );
}

