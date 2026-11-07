import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { generatePromotionLetter, getPdfRelativeUrl } from "@/lib/pdf/generate";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

export async function POST(request: Request) {
  const authResult = await authorizePermission(PERMISSIONS.EMPLOYEE_PROMOTION_CREATE);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const actor = authResult.user;

  const body = await request.json().catch(() => ({}));
  const { promotionId } = body;
  if (!promotionId) {
    return NextResponse.json({ error: "Missing promotionId" }, { status: 400 });
  }

  // Load promotion with employee & tenant data
  const promotion = await prisma.employeePromotion.findUnique({
    where: { id: promotionId },
    include: {
      employee: {
        include: { user: true, tenant: true },
      },
    },
  });

  if (!promotion) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  }

  const proposedSalary =
    (promotion.proposedBasicSalary ?? 0) +
    (promotion.proposedHousing ?? 0) +
    (promotion.proposedTransport ?? 0) +
    (promotion.proposedOther ?? 0);
  const previousSalary = promotion.previousBasicSalary ?? 0;
  const incrementAmount = proposedSalary > previousSalary ? proposedSalary - previousSalary : undefined;

  // Generate the PDF
  const pdfPath = await generatePromotionLetter({
    employeeName: `${promotion.employee.firstName} ${promotion.employee.lastName}`,
    employeeCode: promotion.employee.employeeCode ?? undefined,
    department: promotion.employee.department ?? undefined,
    currentDesignation: promotion.previousDesignation ?? undefined,
    newDesignation: promotion.proposedDesignation,
    effectiveDate: promotion.effectiveDate,
    newSalary: proposedSalary > 0 ? proposedSalary : undefined,
    incrementAmount,
    tenantName: promotion.employee.tenant?.name ?? undefined,
    tenantLetterheadUrl: promotion.employee.tenant?.logoUrl ?? undefined,
  });

  const relativeUrl = getPdfRelativeUrl(pdfPath);

  // Persist the URL
  await prisma.employeePromotion.update({
    where: { id: promotionId },
    data: { pdfUrl: relativeUrl },
  });

  // Audit log
  await logSecurityEvent({
    action: SECURITY_ACTION.PDF_GENERATED,
    actorEmail: actor.email,
    target: relativeUrl,
    outcome: "SUCCESS",
    requestPath: "/api/pdf/promotion",
    requestMethod: "POST",
    detail: { promotionId, employeeId: promotion.employeeId, type: "promotion_letter" },
  });

  return NextResponse.json({ pdfUrl: relativeUrl });
}
