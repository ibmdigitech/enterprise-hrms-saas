import { NextResponse, NextRequest } from "next/server";
import { screenCandidate } from "@/lib/ai";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await authorizePermission(PERMISSIONS.RECRUITMENT_VIEW);
    if (!auth.ok) {
        return NextResponse.json({ error: "Authentication required" }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const { candidateData } = body;

        if (!candidateData) {
            return NextResponse.json({ error: "candidateData is required" }, { status: 400 });
        }

        const result = await screenCandidate(candidateData);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[AI_CANDIDATE_SCREENING_API]", error);
        return NextResponse.json({ error: "Failed to screen candidate" }, { status: 500 });
    }
}