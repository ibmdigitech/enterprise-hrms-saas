import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateCertificateHTML, getCertificateData } from "@/lib/workflow/certificate";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const data = await getCertificateData(id);
    if (!data) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const html = generateCertificateHTML(data);

    return new NextResponse(html, {
        headers: {
            "Content-Type": "text/html",
        },
    });
}