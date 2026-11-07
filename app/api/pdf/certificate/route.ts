import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { generateCertificate, getPdfRelativeUrl } from "@/lib/pdf/generate";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

export async function POST(request: Request) {
  const authResult = await authorizePermission(PERMISSIONS.TRAINING_MANAGE);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const actor = authResult.user;

  const body = await request.json().catch(() => ({}));
  const { employeeId, certificateId } = body;
  if (!employeeId && !certificateId) {
    return NextResponse.json({ error: "Missing employeeId or certificateId" }, { status: 400 });
  }

  // Find certificate if specified
  let certificate = null;
  if (certificateId) {
    certificate = await prisma.trainingCertificate.findUnique({
      where: { id: certificateId },
      include: {
        employee: { include: { tenant: true } },
        course: true,
      },
    });
  } else {
    certificate = await prisma.trainingCertificate.findFirst({
      where: { employeeId },
      include: {
        employee: { include: { tenant: true } },
        course: true,
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  const resolvedEmployeeId = employeeId || certificate?.employeeId;
  const employee = certificate?.employee ?? (await prisma.employee.findUnique({
    where: { id: resolvedEmployeeId },
    include: { user: true, tenant: true },
  }));

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  // Generate the PDF
  const pdfPath = await generateCertificate({
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeId: employee.id,
    courseTitle: certificate?.title ?? certificate?.course?.title ?? "Professional Skills Certification",
    grade: certificate?.grade ?? undefined,
    score: certificate?.score ?? undefined,
    verificationCode: certificate?.verificationCode ?? undefined,
    tenantName: employee.tenant?.name ?? undefined,
    tenantLogoUrl: employee.tenant?.logoUrl ?? undefined,
    issueDate: certificate?.issuedAt ?? new Date(),
  });

  const relativeUrl = getPdfRelativeUrl(pdfPath);

  // Persist URL in database
  if (certificate) {
    await prisma.trainingCertificate.update({
      where: { id: certificate.id },
      data: {
        documentUrl: relativeUrl,
        pdfUrl: relativeUrl,
      },
    });
  } else if (resolvedEmployeeId) {
    await prisma.trainingCertificate.updateMany({
      where: { employeeId: resolvedEmployeeId },
      data: {
        documentUrl: relativeUrl,
        pdfUrl: relativeUrl,
      },
    });
  }

  // Security audit log
  await logSecurityEvent({
    action: SECURITY_ACTION.PDF_GENERATED,
    actorEmail: actor.email,
    target: relativeUrl,
    outcome: "SUCCESS",
    requestPath: "/api/pdf/certificate",
    requestMethod: "POST",
    detail: { employeeId: employee.id, certificateId: certificate?.id, type: "certificate" },
  });

  return NextResponse.json({ pdfUrl: relativeUrl });
}
