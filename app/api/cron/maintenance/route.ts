import { runScheduledMaintenance } from "@/lib/automation/scheduled-maintenance";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Enterprise Background Scheduled Maintenance Cron Endpoint
 * 
 * Invoked by:
 * - Vercel Cron Jobs (configured via vercel.json)
 * - External scheduled runners (cron-job.org, Kubernetes cron, systemd timer)
 * - Administrative testing
 * 
 * Authenticated via Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await runScheduledMaintenance();

        return NextResponse.json({
            success: result.success,
            message: `Scheduled maintenance executed successfully.`,
            expiredCertificates: result.expiredCertificates,
            upcomingDocumentAlerts: result.upcomingDocumentAlerts,
            errors: result.errors,
            timestamp: result.timestamp,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error during maintenance cron",
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    return GET(request);
}
