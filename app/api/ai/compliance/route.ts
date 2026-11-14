import { NextResponse, NextRequest } from "next/server";
import { getComplianceAdvice } from "@/lib/ai";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await authorizePermission(PERMISSIONS.VISA_VIEW);
    if (!auth.ok) {
        return NextResponse.json({ error: "Authentication required" }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const { topic, context } = body;

        if (!topic) {
            return NextResponse.json({ error: "topic is required" }, { status: 400 });
        }

        const result = await getComplianceAdvice(topic, context || {});

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[AI_COMPLIANCE_API]", error);
        return NextResponse.json({ error: "Failed to get compliance advice" }, { status: 500 });
    }
}