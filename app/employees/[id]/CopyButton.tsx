"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({
    text,
    label = "Item",
    className = "",
}: {
    text: string;
    label?: string;
    className?: string;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast.success(`${label} copied to clipboard`);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy");
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={`Copy ${label}`}
            className={`inline-flex items-center gap-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
        >
            {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            ) : (
                <Copy className="h-3.5 w-3.5 shrink-0" />
            )}
        </button>
    );
}
