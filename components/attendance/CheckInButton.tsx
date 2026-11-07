"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { checkIn, checkOut, getTodayStatus } from "@/app/lib/actions/attendance";
import { toast } from "sonner";
import { Clock, LogOut, LogIn, CheckCircle2 } from "lucide-react";

export function CheckInButton() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [elapsedTime, setElapsedTime] = useState<string>("");

    const fetchStatus = async () => {
        setLoading(true);
        const res = await getTodayStatus();
        if (res.success) setStatus(res.data);
        setLoading(false);
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const res = await getTodayStatus();
            if (cancelled) return;
            if (res.success) setStatus(res.data);
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // Live elapsed timer for active check-in
    useEffect(() => {
        if (!status?.checkIn || status?.checkOut) {
            setElapsedTime("");
            return;
        }

        const updateTimer = () => {
            const checkInTime = new Date(status.checkIn).getTime();
            const now = Date.now();
            const diffMs = Math.max(0, now - checkInTime);

            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

            const pad = (n: number) => n.toString().padStart(2, "0");
            setElapsedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [status]);

    const handleAction = async () => {
        const isCheckingIn = !status || !status.checkIn;
        const tid = toast.loading(isCheckingIn ? "Recording punch in..." : "Recording punch out...");

        const res = isCheckingIn ? await checkIn() : await checkOut();

        if (res.success) {
            toast.success(res.message, { id: tid });
            fetchStatus();
        } else {
            toast.error(res.message, { id: tid });
        }
    };

    if (loading) {
        return (
            <Button disabled className="gap-2 rounded-xl h-11 px-5 font-bold bg-white/10 text-white border-0 backdrop-blur-md">
                <Clock className="h-4 w-4 animate-spin" /> 
                Syncing status...
            </Button>
        );
    }

    // Shift already finalized for today
    if (status && status.checkIn && status.checkOut) {
        return (
            <Button
                disabled
                variant="outline"
                className="gap-2 rounded-xl h-11 px-5 font-bold border-emerald-400/40 text-emerald-300 bg-emerald-950/40 backdrop-blur-md cursor-default"
            >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Shift Completed Today
            </Button>
        );
    }

    // Active Punch In state -> Show live elapsed timer & Punch Out action
    if (status && status.checkIn) {
        return (
            <Button
                onClick={handleAction}
                className="gap-2.5 rounded-xl h-11 px-5 font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-102 active:scale-98 animate-pulse-subtle"
            >
                <LogOut className="h-4 w-4" />
                <span>PUNCH OUT</span>
                {elapsedTime && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-black/20 tracking-wider">
                        {elapsedTime}
                    </span>
                )}
            </Button>
        );
    }

    // Default Punch In state
    return (
        <Button
            onClick={handleAction}
            className="gap-2 rounded-xl h-11 px-6 font-black tracking-wide uppercase bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-102 active:scale-98"
        >
            <LogIn className="h-4 w-4" />
            PUNCH IN NOW
        </Button>
    );
}
