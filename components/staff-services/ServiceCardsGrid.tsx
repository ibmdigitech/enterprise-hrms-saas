"use client";

import Link from "next/link";
import { 
  GraduationCap, Headphones, ArrowRightLeft, ArrowUpRight, 
  Briefcase, Calendar, CreditCard, FileCheck, FileText, 
  Wallet, FolderOpen, FileUp, Plane
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { QuickServiceCardDef } from "./types";

const ICON_MAP: Record<string, any> = {
  GraduationCap,
  Headphones,
  ArrowRightLeft,
  Briefcase,
  Calendar,
  CreditCard,
  FileCheck,
  FileText,
  Wallet,
  FolderOpen,
  FileUp,
  Plane,
};

interface ServiceCardsGridProps {
  cards: QuickServiceCardDef[];
}

export function ServiceCardsGrid({ cards }: ServiceCardsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const IconComponent = ICON_MAP[card.iconName] || ArrowRightLeft;

        return (
          <Link
            key={card.id}
            href={card.href}
            className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-400/60 dark:hover:border-indigo-500/50 transition-all duration-200"
          >
            <div>
              {/* Header Icon + Active badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100/60 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                  <IconComponent className="h-5 w-5" />
                </div>
                {card.badgeCount !== undefined && card.badgeCount > 0 && (
                  <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-black border-0 px-2 py-0.5 rounded-full">
                    {card.badgeCount} Active
                  </Badge>
                )}
              </div>

              {/* Tag / Category */}
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                {card.category}
              </div>

              {/* Title */}
              <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 line-clamp-2 leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Footer Action */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
              <span>Access Module</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
