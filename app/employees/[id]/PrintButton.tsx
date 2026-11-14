"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton({ className }: { className?: string }) {
    return (
        <Button
            variant="outline"
            onClick={() => window.print()}
            className={className ?? "h-10 gap-2 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"}
        >
            <Printer className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            Print Profile
        </Button>
    );
}
