import { NextResponse, NextRequest } from "next/server";
import { generateSmartSummary } from "@/lib/ai";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await authorizePermission(PERMISSIONS.EMPLOYEES_VIEW);
    if (!auth.ok) {
        return NextResponse.json({ error: "Authentication required" }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const { content, type } = body;

        if (!content || !type) {
            return NextResponse.json({ error: "content and type are required" }, { status: 400 });
        }

        const validTypes = ["leave", "payroll", "employee", "attendance", "recruitment"];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        const result = await generateSmartSummary(content, type);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[AI_SUMMARY_API]", error);
        return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }
}