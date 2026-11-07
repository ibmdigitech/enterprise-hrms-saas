/**
 * Support Ticket SLA Calculation Engine
 *
 * Implements deterministic SLA turnaround deadlines:
 * - CRITICAL: 4 hours (First response: 1 hour)
 * - URGENT:   8 hours (First response: 2 hours)
 * - HIGH:     24 hours (1 business day)
 * - NORMAL:   48 hours (2 business days)
 * - LOW:      72 hours (3 business days)
 */

export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";

export const SLA_HOURS_MAP: Record<TicketPriority, number> = {
  CRITICAL: 4,
  URGENT: 8,
  HIGH: 24,
  NORMAL: 48,
  LOW: 72,
};

/**
 * Calculates the SLA deadline Date based on ticket creation timestamp and priority.
 */
export function calculateSlaDeadline(createdAt: Date = new Date(), priority: string): Date {
  const normPriority = (priority?.toUpperCase() as TicketPriority) || "NORMAL";
  const hours = SLA_HOURS_MAP[normPriority] ?? 48;
  const deadline = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
  return deadline;
}

export interface SlaStatus {
  isBreached: boolean;
  isWarning: boolean; // within 20% of SLA deadline or under 2 hours
  hoursRemaining: number;
  label: string;
}

/**
 * Evaluates the SLA status for a given ticket.
 */
export function getSlaStatus(slaDeadline: Date | null | undefined, status: string): SlaStatus {
  if (!slaDeadline || status === "RESOLVED" || status === "CLOSED") {
    return {
      isBreached: false,
      isWarning: false,
      hoursRemaining: 0,
      label: status === "RESOLVED" || status === "CLOSED" ? "Completed" : "No SLA",
    };
  }

  const now = Date.now();
  const deadlineTime = new Date(slaDeadline).getTime();
  const diffMs = deadlineTime - now;
  const hoursRemaining = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

  if (diffMs <= 0) {
    const overdueHours = Math.abs(hoursRemaining);
    return {
      isBreached: true,
      isWarning: false,
      hoursRemaining: -overdueHours,
      label: `Breached (${overdueHours}h overdue)`,
    };
  }

  if (hoursRemaining <= 4) {
    return {
      isBreached: false,
      isWarning: true,
      hoursRemaining,
      label: `${hoursRemaining}h remaining (Urgent)`,
    };
  }

  return {
    isBreached: false,
    isWarning: false,
    hoursRemaining,
    label: `${hoursRemaining}h remaining`,
  };
}

