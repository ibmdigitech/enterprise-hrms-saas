"use client";

import { useState } from "react";
import { MessageSquare, Send, ShieldAlert, User, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { addTicketMessageAction, updateTicketStatusAction } from "./tickets-actions";
import { getSlaStatus } from "@/lib/support/sla";
import { format } from "date-fns";
import { toast } from "sonner";

interface TicketDetailModalProps {
  ticket: any;
  onClose: () => void;
  onRefresh: () => void;
}

export function TicketDetailModal({ ticket, onClose, onRefresh }: TicketDetailModalProps) {
  const [messages, setMessages] = useState<any[]>(ticket.messages || []);
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [status, setStatus] = useState(ticket.status);
  const [resolutionText, setResolutionText] = useState(ticket.resolution || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sla = getSlaStatus(ticket.slaDeadline, status);

  const handleSendMessage = async () => {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await addTicketMessageAction({
        ticketId: ticket.id,
        content: replyText,
        visibility: isInternal ? "INTERNAL" : "PUBLIC",
      });

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setReplyText("");
        toast.success(isInternal ? "Internal note posted" : "Reply sent to customer");
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setIsSubmitting(true);
    try {
      await updateTicketStatusAction(ticket.id, newStatus, resolutionText);
      setStatus(newStatus);
      toast.success(`Ticket marked as ${newStatus}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between bg-background/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-indigo-400">#{ticket.id.slice(-8).toUpperCase()}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                {ticket.category}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  ticket.priority === "CRITICAL"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : ticket.priority === "HIGH"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {ticket.priority}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  sla.isBreached
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                    : sla.isWarning
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-muted/80 text-muted-foreground"
                }`}
              >
                <Clock className="h-3 w-3" />
                {sla.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground mt-1">{ticket.subject}</h2>
            <p className="text-xs text-muted-foreground">
              Submitted by <span className="text-foreground font-medium">{ticket.createdBy?.name || "Customer"}</span> ({ticket.createdBy?.email}) from{" "}
              <span className="text-indigo-300 font-medium">{ticket.tenant?.name || "Unknown Tenant"}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg bg-muted/50 hover:bg-muted text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat & Ticket Description */}
          <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {/* Original ticket request card */}
              <div className="p-4 rounded-xl bg-background/60 border border-border/80 text-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-muted-foreground">Initial Request Description</span>
                  <span>{format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}</span>
                </div>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
              </div>

              {/* Message thread */}
              {messages.map((msg) => {
                const isInternalNote = msg.visibility === "INTERNAL";
                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-xl text-sm space-y-1.5 ${
                      isInternalNote
                        ? "bg-amber-950/20 border border-amber-800/40 text-amber-200"
                        : "bg-muted/40 border border-border/50 text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-medium">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground">{msg.author?.name || msg.author?.email || "Support Agent"}</span>
                        {isInternalNote && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/30 text-amber-300 uppercase tracking-wider">
                            Internal Note
                          </span>
                        )}
                      </div>
                      <span>{format(new Date(msg.createdAt), "MMM d, h:mm a")}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="text-center py-6 text-xs text-muted-foreground italic">
                  No replies yet. Use the message box below to respond to the requester.
                </div>
              )}
            </div>

            {/* Reply composer */}
            <div className="p-4 bg-background/60 border-t border-border space-y-3">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground">
                  <input
                    type="radio"
                    name="replyType"
                    checked={!isInternal}
                    onChange={() => setIsInternal(false)}
                    className="accent-indigo-500"
                  />
                  <span>Public Reply (Requester can see)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 font-medium">
                  <input
                    type="radio"
                    name="replyType"
                    checked={isInternal}
                    onChange={() => setIsInternal(true)}
                    className="accent-amber-500"
                  />
                  <span>Internal Support Note</span>
                </label>
              </div>

              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    isInternal
                      ? "Write an internal team note (not visible to customer)..."
                      : "Type your response to the customer..."
                  }
                  rows={3}
                  className="flex-1 bg-card border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-indigo-500 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSubmitting || !replyText.trim()}
                  className="px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-foreground rounded-xl font-bold flex flex-col items-center justify-center gap-1 text-xs"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ticket Lifecycle & Status Sidebar */}
          <div className="w-72 bg-background/30 p-6 space-y-6 overflow-y-auto">
            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground block mb-2">
                Ticket Status
              </label>
              <select
                value={status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground font-semibold focus:outline-none focus:border-indigo-500"
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="WAITING_CUSTOMER">WAITING_CUSTOMER</option>
                <option value="WAITING_THIRD_PARTY">WAITING_THIRD_PARTY</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground block mb-2">
                SLA Turnaround Deadline
              </label>
              <div className="p-3 rounded-xl bg-card border border-border text-xs space-y-1">
                <div className="text-muted-foreground">Target Resolution:</div>
                <div className="font-bold text-foreground">
                  {ticket.slaDeadline ? format(new Date(ticket.slaDeadline), "MMM d, yyyy h:mm a") : "Not Set"}
                </div>
                <div
                  className={`mt-2 text-[11px] font-bold ${
                    sla.isBreached ? "text-rose-400" : sla.isWarning ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {sla.label}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground block mb-2">
                Resolution Summary
              </label>
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="Details of the resolution provided..."
                rows={3}
                className="w-full bg-card border border-border rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={() => handleUpdateStatus("RESOLVED")}
                disabled={isSubmitting || status === "RESOLVED"}
                className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resolve Ticket
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

