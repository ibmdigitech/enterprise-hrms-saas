"use server";

import { checkAndSendInvoiceNotifications } from "@/lib/billing/invoice-notifications";

/**
 * Scheduled job to check for overdue/pending invoices and send notifications.
 * This should be run daily via a cron job or scheduled task.
 * 
 * Example cron schedule (runs daily at 9 AM):
 * 0 9 * * * curl -X POST http://localhost:3000/api/cron/invoice-notifications
 * 
 * Or using a background worker:
 * node scripts/invoice-notifications-cron.js
 */

export async function runInvoiceNotificationsCron(): Promise<{
    success: boolean;
    processed: number;
    notificationsSent: number;
    error?: string;
}> {
    try {
        console.log("[CRON] Starting invoice notifications check...");

        const result = await checkAndSendInvoiceNotifications();

        console.log(`[CRON] Invoice notifications completed: ${result.processed} invoices processed, ${result.notificationsSent} notifications sent`);

        return {
            success: true,
            processed: result.processed,
            notificationsSent: result.notificationsSent,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[CRON] Invoice notifications failed:", errorMessage);

        return {
            success: false,
            processed: 0,
            notificationsSent: 0,
            error: errorMessage,
        };
    }
}

/**
 * Manual trigger for testing the cron job.
 * Can be called from a Next.js API route or admin panel.
 */
export async function triggerInvoiceNotificationsManually(): Promise<{
    success: boolean;
    processed: number;
    notificationsSent: number;
    error?: string;
}> {
    return runInvoiceNotificationsCron();
}