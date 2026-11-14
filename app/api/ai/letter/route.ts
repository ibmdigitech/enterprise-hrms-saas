import { NextResponse, NextRequest } from "next/server";
import { generateLetterDraft } from "@/lib/ai";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await authorizePermission(PERMISSIONS.LETTER_GENERATE);
    if (!auth.ok) {
        return NextResponse.json({ error: "Authentication required" }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const { type, context } = body;

        if (!type || !context) {
            return NextResponse.json({ error: "type and context are required" }, { status: 400 });
        }

        const result = await generateLetterDraft(type, context);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[AI_LETTER_API]", error);
        return NextResponse.json({ error: "Failed to generate letter draft" }, { status: 500 });
    }
}