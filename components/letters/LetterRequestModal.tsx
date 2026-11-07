"use client";

import { useState } from "react";
import { Send, FileText, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { submitLetterRequestAction } from "@/app/lib/actions/letter-requests";
import { AVAILABLE_LETTER_TYPES } from "@/lib/letters/types";
import { toast } from "sonner";

interface LetterRequestModalProps {
  profile: {
    id: string;
    employeeCode: string;
    name: string;
    department: string;
    designation: string;
    email: string;
    phone: string;
    managerName: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function LetterRequestModal({ profile, onClose, onSuccess }: LetterRequestModalProps) {
  const [letterType, setLetterType] = useState<string>("SALARY_CERTIFICATE");
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDesc = AVAILABLE_LETTER_TYPES.find((t) => t.type === letterType)?.description;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterType || !purpose.trim()) {
      toast.error("Please provide the letter purpose.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitLetterRequestAction({
        letterType,
        purpose,
        remarks,
        requiredDate: requiredDate || undefined,
      });

      if (res.success) {
        toast.success("Letter request submitted successfully! Your manager has been notified.");
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit letter request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Employee Self-Service
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Request Official Corporate Letter
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your required letter type. Your personal details are securely auto-populated from your employee master record.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold p-1 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Read-only Auto-Populated Profile Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
              Auto-Populated Profile (Locked for Integrity)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Employee Name</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{profile.name}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Employee ID</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{profile.employeeCode}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Designation</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{profile.designation}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Department</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{profile.department}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Official Email</span>
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{profile.email}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Approving Manager</span>
                <div className="font-bold text-slate-800 dark:text-slate-200">{profile.managerName}</div>
              </div>
            </div>
          </div>

          {/* Letter Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Select Letter Type
            </label>
            <select
              value={letterType}
              onChange={(e) => setLetterType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {AVAILABLE_LETTER_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
            {selectedDesc && (
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium px-1">
                &bull; {selectedDesc}
              </p>
            )}
          </div>

          {/* Purpose & Required Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Purpose of Letter <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Bank Loan Application, Schengen Visa, Tenancy"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Date Required By
              </label>
              <input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Additional Remarks / Addressee Details (Optional)
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Please address to 'To the Visa Officer, Consulate General of Germany'..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-40"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Letter Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

