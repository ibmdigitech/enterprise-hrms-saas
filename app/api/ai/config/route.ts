import { NextResponse } from "next/server";
import { getAIConfig } from "@/lib/ai";
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
        const config = await getAIConfig();
        return NextResponse.json(config);
    } catch (error) {
        console.error("[AI_CONFIG_API]", error);
        return NextResponse.json({ error: "Failed to get AI config" }, { status: 500 });
    }
}