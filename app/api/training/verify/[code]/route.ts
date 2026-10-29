import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params;

    const certificate = await prisma.trainingCertificate.findUnique({
        where: { verificationCode: code },
        include: {
            employee: { select: { firstName: true, lastName: true, photo: true, employeeCode: true } },
            course: { select: { title: true, code: true, category: true } },
            tenant: { select: { name: true, logoUrl: true } },
            issuedBy: { select: { name: true } },
        },
    });

    if (!certificate) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    return NextResponse.json({
        certificateNumber: certificate.certificateNumber,
        title: certificate.title,
        status: certificate.status,
        issuedAt: certificate.issuedAt,
        expiresAt: certificate.expiresAt,
        employeeName: `${certificate.employee.firstName} ${certificate.employee.lastName}`,
        employeeCode: certificate.employee.employeeCode,
        employeePhoto: certificate.employeePhoto || certificate.employee.photo,
        courseTitle: certificate.course.title,
        courseCode: certificate.course.code,
        courseCategory: certificate.course.category,
        companyName: certificate.tenant.name,
        companyLogo: certificate.tenant.logoUrl,
        issuedBy: certificate.issuedBy.name,
        metadata: certificate.metadata,
    });
}