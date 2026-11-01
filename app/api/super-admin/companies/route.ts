import { createCompanyAction } from "@/app/super-admin/companies/companies-actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await createCompanyAction(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Create company error:", error);
    return NextResponse.json({ error: error.message || "Failed to create company" }, { status: 400 });
  }
}