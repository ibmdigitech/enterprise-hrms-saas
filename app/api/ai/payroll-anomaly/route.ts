import { NextResponse, NextRequest } from "next/server";
import { detectPayrollAnomalies } from "@/lib/ai";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const auth = await authorizePermission(PERMISSIONS.PAYROLL_VIEW);
    if (!auth.ok) {
        return NextResponse.json({ error: "Authentication required" }, { status: auth.status });
    }

    try {
        const body = await request.json();
        const { payrollData } = body;

        if (!payrollData || !Array.isArray(payrollData)) {
            return NextResponse.json({ error: "payrollData array is required" }, { status: 400 });
        }

        const result = await detectPayrollAnomalies(payrollData);

        if ("error" in result) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[AI_PAYROLL_ANOMALY_API]", error);
        return NextResponse.json({ error: "Failed to detect payroll anomalies" }, { status: 500 });
    }
}