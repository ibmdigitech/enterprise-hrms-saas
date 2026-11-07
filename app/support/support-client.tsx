"use client";

import { useState } from "react";
import { 
  Headphones, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, 
  Send, User, Loader2 
} from "lucide-react";
import { submitTenantTicketAction, replyTenantTicketAction, getTenantTicketDetailAction } from "@/app/lib/actions/tenant-tickets";
import { getSlaStatus } from "@/lib/support/sla";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TenantSupportClient({ initialTickets }: { initialTickets: any[] }) {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("TECHNICAL");
  const [priority, setPriority] = useState("NORMAL");
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleOpenDetail = async (ticketId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await getTenantTicketDetailAction(ticketId);
      if (detail) setSelectedTicket(detail);
    } catch (err: any) {
      toast.error(err.message || "Failed to load ticket");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Please fill in subject and description.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitTenantTicketAction({
        subject,
        description,
        category,
        priority,
      });

      if (res.success) {
        toast.success("Support ticket submitted! Our engineering & HR ops team is on it.");
        setIsCreateOpen(false);
        setSubject("");
        setDescription("");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setIsSubmitting(true);
    try {
      const res = await replyTenantTicketAction(selectedTicket.id, replyText);
      if (res.success) {
        toast.success("Reply submitted");
        setReplyText("");
        const fresh = await getTenantTicketDetailAction(selectedTicket.id);
        if (fresh) setSelectedTicket(fresh);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Headphones className="h-3.5 w-3.5" /> 24/7 SLA Support Desk
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Organization Support & Helpdesk</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Submit technical issues, WPS / payroll inquiries, feature requests, or labor law compliance clarifications.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all self-start sm:self-center"
        >
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {/* Tickets List */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Support Tickets ({tickets.length})</h2>
          <span className="text-xs text-slate-400 font-medium">Tracking response SLAs against service tiers</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {tickets.map((t) => {
            const sla = getSlaStatus(t.slaDeadline, t.status);
            return (
              <div
                key={t.id}
                onClick={() => handleOpenDetail(t.id)}
                className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-indigo-500 dark:text-indigo-400 font-bold">
                      #{t.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {t.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.priority === "CRITICAL"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                          : t.priority === "HIGH" || t.priority === "URGENT"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        sla.isBreached
                          ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          : sla.isWarning
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {sla.label}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.subject}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{t.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{t._count?.messages || 0}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {format(new Date(t.createdAt), "MMM d, yyyy")}
                    </div>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === "RESOLVED"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : t.status === "OPEN"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          : "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {tickets.length === 0 && (
            <div className="p-16 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No open support tickets</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All systems and requests are healthy. Click &apos;New Ticket&apos; above if you require technical or operational assistance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-indigo-600 font-bold">
                    #{selectedTicket.id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {selectedTicket.category}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-black uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
                    {selectedTicket.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Original Request</span>
                  <span>{format(new Date(selectedTicket.createdAt), "MMM d, h:mm a")}</span>
                </div>
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.messages?.map((msg: any) => {
                const isSupportAgent = msg.author?.role === "ADMIN" || msg.author?.role === "PLATFORM_SUPPORT";
                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl text-sm space-y-1.5 ${
                      isSupportAgent
                        ? "bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-slate-800 dark:text-slate-200"
                        : "bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 font-bold">
                        <User className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="text-slate-900 dark:text-white">
                          {msg.author?.name || "Support Team"}
                        </span>
                        {isSupportAgent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-600 text-white">
                            Official Support
                          </span>
                        )}
                      </div>
                      <span>{format(new Date(msg.createdAt), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply to the support team..."
                rows={2}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 resize-none text-slate-900 dark:text-white"
              />
              <button
                onClick={handleSendReply}
                disabled={isSubmitting || !replyText.trim()}
                className="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 text-xs"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Reply</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" /> Submit New Support Request
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Inconsistency in Gratuity computation for confirmed employee"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GENERAL">General Request</option>
                    <option value="TECHNICAL">Technical Glitch</option>
                    <option value="BILLING">Billing & License</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="COMPLIANCE">Labor Law Clarification</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low (72h SLA)</option>
                    <option value="NORMAL">Normal (48h SLA)</option>
                    <option value="HIGH">High (24h SLA)</option>
                    <option value="URGENT">Urgent (8h SLA)</option>
                    <option value="CRITICAL">Critical Production (4h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain the situation in detail..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 flex items-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

