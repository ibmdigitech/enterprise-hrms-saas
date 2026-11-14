import { NextResponse } from "next/server";
import { getAIUsage } from "@/lib/ai";
import { authorizeAnyPermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
    const auth = await authorizeAnyPermission([
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.SETTINGS_MANAGE,
        PERMISSIONS.SERVICE_CONFIG_MANAGE
    ]);
    if (!auth.ok) {
        return NextResponse.json({ error: "Authentication required" }, { status: auth.status });
    }

    try {
        const usage = await getAIUsage();
        return NextResponse.json(usage);
    } catch (error) {
        console.error("[AI_USAGE_API]", error);
        return NextResponse.json({ error: "Failed to get AI usage" }, { status: 500 });
    }
}