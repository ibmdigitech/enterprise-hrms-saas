import { runInvoiceNotificationsCron } from "@/lib/billing/invoice-cron";
import { NextResponse } from "next/server";

/**
 * Cron endpoint for invoice payment notifications.
 * 
 * This endpoint can be called by:
 * - Vercel Cron Jobs (configured in vercel.json)
 * - External cron services (cron-job.org, EasyCron, etc.)
 * - GitHub Actions scheduled workflows
 * - Manual trigger for testing
 * 
 * Security: In production, protect this endpoint with a secret token
 * passed via Authorization header or query parameter.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    // Optional: Add cron secret verification
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const result = await runInvoiceNotificationsCron();

        return NextResponse.json({
            success: result.success,
            message: `Processed ${result.processed} invoices, sent ${result.notificationsSent} notifications`,
            processed: result.processed,
            notificationsSent: result.notificationsSent,
            error: result.error,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

// Also support POST for services that only support POST
export async function POST(request: Request) {
    return GET(request);
}