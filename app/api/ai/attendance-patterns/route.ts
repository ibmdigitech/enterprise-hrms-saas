import { NextResponse, NextRequest } from "next/server";
import { analyzeAttendancePatterns } from "@/lib/ai";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await authorizePermission(PERMISSIONS.ATTENDANCE_VIEW);
    if (!auth.ok) {
        return NextResponse.json({ error: "Authentication required" }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const { employeeId } = body;

        const result = await analyzeAttendancePatterns(employeeId);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[AI_ATTENDANCE_PATTERNS_API]", error);
        return NextResponse.json({ error: "Failed to analyze attendance patterns" }, { status: 500 });
    }
}