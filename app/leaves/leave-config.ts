import { Plane, HeartPulse, Coffee, Baby, Flame, Flower2, Moon, BookOpen, Scale, Sunrise, Banknote } from "lucide-react";

// ─── Leave type master config ──────────────────────────────────────────────────
export const LEAVE_TYPES: Record<string, {
    label: string; emoji: string;
    badge: string; icon: React.ElementType;
}> = {
    ANNUAL:       { label: "Annual",       emoji: "✈️",  badge: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-violet-100 dark:border-violet-900/50", icon: Plane },
    SICK:         { label: "Sick",         emoji: "🤒", badge: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",         icon: HeartPulse },
    CASUAL:       { label: "Casual",       emoji: "☕", badge: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-100 dark:border-sky-900/50",                icon: Coffee },
    MATERNITY:    { label: "Maternity",    emoji: "🤱", badge: "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border-pink-100 dark:border-pink-900/50",         icon: Baby },
    PATERNITY:    { label: "Paternity",    emoji: "👨‍👶", badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",        icon: Baby },
    EMERGENCY:    { label: "Emergency",    emoji: "🚨", badge: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-100 dark:border-orange-900/50", icon: Flame },
    BEREAVEMENT:  { label: "Bereavement", emoji: "🕊️", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border-slate-200 dark:border-slate-700",     icon: Flower2 },
    HAJJ:         { label: "Hajj",         emoji: "🕌", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50", icon: Moon },
    STUDY:        { label: "Study/Exam",   emoji: "📚", badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",   icon: BookOpen },
    COMPENSATION: { label: "Compensation", emoji: "⚖️", badge: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-100 dark:border-teal-900/50",        icon: Scale },
    HALF_DAY:     { label: "Half Day",     emoji: "🌓", badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50", icon: Sunrise },
    UNPAID:       { label: "Unpaid",       emoji: "💸", badge: "bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 border-gray-200 dark:border-gray-700",           icon: Banknote },
};

// ─── Status badge ───────────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
    PENDING:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0",
    APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
    REJECTED: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0",
};