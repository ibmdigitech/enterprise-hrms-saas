"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { createSupportTicketAction } from "./tickets-actions";
import { toast } from "sonner";

interface CreateTicketModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTicketModal({ onClose, onCreated }: CreateTicketModalProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("TECHNICAL");
  const [priority, setPriority] = useState("NORMAL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in both subject and description.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSupportTicketAction({
        subject,
        description,
        category,
        priority,
      });

      if (res.success) {
        toast.success("Support ticket created successfully!");
        onCreated();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Plus className="h-5 w-5 text-indigo-400" /> Create Platform Support Ticket
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground font-bold p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
              Subject / Inquiry Title
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Payroll WPS Export validation error"
              className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
              >
                <option value="GENERAL">General Inquiry</option>
                <option value="TECHNICAL">Technical Issue</option>
                <option value="BILLING">Billing & Subscription</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="COMPLIANCE">Compliance / Labor Law</option>
                <option value="SECURITY">Security & Access</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
                Priority (SLA)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">LOW (72h SLA)</option>
                <option value="NORMAL">NORMAL (48h SLA)</option>
                <option value="HIGH">HIGH (24h SLA)</option>
                <option value="URGENT">URGENT (8h SLA)</option>
                <option value="CRITICAL">CRITICAL (4h SLA)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">
              Description & Steps to Reproduce
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of the request or problem..."
              className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-foreground bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

