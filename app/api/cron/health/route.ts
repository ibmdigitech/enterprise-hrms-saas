import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/health
 *
 * Lightweight health-check for external monitors (UptimeRobot, Vercel, etc.).
 * Returns:
 *  - ok: true / false
 *  - lastRun: ISO timestamp of the most recent cron execution (from audit log)
 *  - docExpiryWindowDays: active window currently configured via env var
 */
export async function GET() {
    try {
        // Probe DB connectivity with a lightweight query
        await prisma.$queryRaw`SELECT 1`;

        const docExpiryWindowDays = (() => {
            const raw = process.env.DOC_EXPIRY_DAYS;
            if (!raw) return 30;
            const parsed = parseInt(raw, 10);
            return isNaN(parsed) || parsed <= 0 ? 30 : parsed;
        })();

        return NextResponse.json({
            ok: true,
            service: "iBoo HR Cron — Scheduled Maintenance",
            docExpiryWindowDays,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        return NextResponse.json(
            {
                ok: false,
                error: err instanceof Error ? err.message : "DB connectivity check failed",
                timestamp: new Date().toISOString(),
            },
            { status: 503 }
        );
    }
}
