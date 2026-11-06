"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Copy, KeyRound, Loader2 } from "lucide-react";
import { reissueActivationLink } from "@/app/lib/actions/credentials";
import { toast } from "sonner";

interface ReissueActivationButtonProps {
    employeeId: string;
    employeeName: string;
    userId: string;
    hasPermission: boolean;
}

export default function ReissueActivationButton({
    employeeId,
    employeeName,
    userId,
    hasPermission,
}: ReissueActivationButtonProps) {
    if (!hasPermission || !userId) return null;

    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);

    async function handleReissue() {
        setIsLoading(true);
        const result = await reissueActivationLink(employeeId);
        setIsLoading(false);

        if (result.success && result.activation) {
            setToken(result.activation.token);
            setExpiresAt(result.activation.expiresAt);
            toast.success("Activation link reissued. Copy it now — it won't be shown again.");
        } else {
            toast.error(result.message || "Failed to reissue activation link");
        }
    }

    async function copyLink() {
        if (!token) return;
        const url = `${window.location.origin}/activate/${token}`;
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
    }

    if (token) {
        return (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40 space-y-3">
                <div className="flex items-start gap-2">
                    <KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black uppercase tracking-widest text-amber-900 dark:text-amber-200">
                            New activation link — copy now
                        </h4>
                        <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                            Expires {new Date(expiresAt!).toLocaleString()}. Previous link invalidated.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        readOnly
                        value={`${window.location.origin}/activate/${token}`}
                        aria-label="Activation link"
                        className="flex-1 h-10 px-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 font-mono text-xs text-slate-800 dark:text-slate-200"
                        onFocus={(e) => e.currentTarget.select()}
                    />
                    <Button
                        onClick={copyLink}
                        variant="outline"
                        className="h-10 rounded-lg bg-amber-600 hover:bg-amber-700 font-black uppercase text-xs tracking-widest shrink-0 text-white border-0"
                    >
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                    </Button>
                </div>

                <p className="text-xs text-amber-700 dark:text-amber-400/80">
                    This link cannot be shown again. If lost, click "Reissue link" below.
                </p>

                <Button
                    onClick={() => { setToken(null); setExpiresAt(null); }}
                    variant="ghost"
                    size="sm"
                    className="text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                >
                    <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Hide link
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={handleReissue}
            disabled={isLoading}
            variant="outline"
            className="h-10 rounded-lg border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-sm gap-2"
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Reissuing...
                </>
            ) : (
                <>
                    <KeyRound className="h-3.5 w-3.5" />
                    Reissue activation link
                </>
            )}
        </Button>
    );
}