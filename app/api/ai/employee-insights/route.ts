import { NextResponse, NextRequest } from "next/server";
import { getEmployeeInsights } from "@/lib/ai";
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
        const { employeeId } = body;

        if (!employeeId) {
            return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
        }

        const result = await getEmployeeInsights(employeeId);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[AI_EMPLOYEE_INSIGHTS_API]", error);
        return NextResponse.json({ error: "Failed to generate employee insights" }, { status: 500 });
    }
}