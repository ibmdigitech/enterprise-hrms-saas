import { NextResponse, NextRequest } from "next/server";
import { getLeavePolicyAnswer } from "@/lib/ai";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await authorizePermission(PERMISSIONS.LEAVE_VIEW);
    if (!auth.ok) {
        return NextResponse.json({ error: "Authentication required" }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const { question } = body;

        if (!question) {
            return NextResponse.json({ error: "question is required" }, { status: 400 });
        }

        const result = await getLeavePolicyAnswer(question);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[AI_LEAVE_POLICY_API]", error);
        return NextResponse.json({ error: "Failed to get leave policy answer" }, { status: 500 });
    }
}