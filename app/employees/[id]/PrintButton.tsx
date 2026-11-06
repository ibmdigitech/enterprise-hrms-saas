"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <Button
            variant="outline"
            onClick={() => window.print()}
            className="h-11 w-full gap-2 rounded-xl border-white/20 bg-white/5 px-6 font-bold text-sm text-white backdrop-blur-md hover:bg-white/10 sm:w-auto"
        >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
        </Button>
    );
}