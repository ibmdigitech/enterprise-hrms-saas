import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { generatePaySlip, getPdfRelativeUrl } from "@/lib/pdf/generate";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

export async function POST(request: Request) {
  const authResult = await authorizePermission(PERMISSIONS.PAYROLL_PAYSLIP_VIEW_ALL);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const actor = authResult.user;

  const body = await request.json().catch(() => ({}));
  const { salaryRecordId } = body;
  if (!salaryRecordId) {
    return NextResponse.json({ error: "Missing salaryRecordId" }, { status: 400 });
  }

  // Load salary record with employee & tenant data
  const salaryRecord = await prisma.salaryRecord.findUnique({
    where: { id: salaryRecordId },
    include: {
      employee: {
        include: { user: true, tenant: true },
      },
    },
  });

  if (!salaryRecord) {
    return NextResponse.json({ error: "Salary record not found" }, { status: 404 });
  }

  // TENANT-ISOLATION: verify the actor's tenant owns this salary record
  if (actor.tenantId && salaryRecord.employee.tenantId !== actor.tenantId) {
    await logSecurityEvent({
      action: SECURITY_ACTION.ACCESS_DENIED,
      actorEmail: actor.email,
      actorRole: actor.role,
      target: `salaryRecord:${salaryRecordId}`,
      outcome: 'DENIED',
      requestPath: '/api/pdf/payslip',
      requestMethod: 'POST',
      detail: { reason: 'cross-tenant payslip access', employeeTenantId: salaryRecord.employee.tenantId, actorTenantId: actor.tenantId },
    });
    return NextResponse.json({ error: 'Access denied to this payslip' }, { status: 403 });
  }

  const otherAllowances =
    salaryRecord.medicalAllowance +
    salaryRecord.foodAllowance +
    salaryRecord.travelAllowance +
    salaryRecord.commission +
    salaryRecord.otherAllowances;

  const gross =
    salaryRecord.basic +
    salaryRecord.housingAllowance +
    salaryRecord.transportAllowance +
    otherAllowances +
    salaryRecord.overtimePay +
    salaryRecord.bonus;

  const latePenaltyTotal = salaryRecord.latePenalty + salaryRecord.penalty;
  const otherDeductionsTotal = salaryRecord.advanceSalary + salaryRecord.otherDeductions;

  const deductions =
    latePenaltyTotal +
    salaryRecord.leaveDeduction +
    salaryRecord.loanDeduction +
    otherDeductionsTotal;

  const net = salaryRecord.netSalary;
  const period = `${salaryRecord.month}/${salaryRecord.year}`;

  // Generate the PDF
  const pdfPath = await generatePaySlip({
    employeeName: `${salaryRecord.employee.firstName} ${salaryRecord.employee.lastName}`,
    employeeId: salaryRecord.employeeId,
    employeeCode: salaryRecord.employee.employeeCode ?? undefined,
    designation: salaryRecord.employee.designation ?? undefined,
    department: salaryRecord.employee.department ?? undefined,
    period,
    basic: salaryRecord.basic,
    housing: salaryRecord.housingAllowance,
    transport: salaryRecord.transportAllowance,
    overtime: salaryRecord.overtimePay,
    bonus: salaryRecord.bonus,
    otherAllowances,
    gross,
    latePenalty: latePenaltyTotal,
    leaveDeductions: salaryRecord.leaveDeduction,
    loanDeduction: salaryRecord.loanDeduction,
    otherDeductions: otherDeductionsTotal,
    deductions,
    net,
    tenantName: salaryRecord.employee.tenant?.name ?? undefined,
    tenantLogoUrl: salaryRecord.employee.tenant?.logoUrl ?? undefined,
  });

  const relativeUrl = getPdfRelativeUrl(pdfPath);

  // Persist the URL
  await prisma.salaryRecord.update({
    where: { id: salaryRecordId },
    data: { pdfUrl: relativeUrl },
  });

  // Audit log
  await logSecurityEvent({
    action: SECURITY_ACTION.PDF_GENERATED,
    actorEmail: actor.email,
    target: relativeUrl,
    outcome: "SUCCESS",
    requestPath: "/api/pdf/payslip",
    requestMethod: "POST",
    detail: { salaryRecordId, employeeId: salaryRecord.employeeId, type: "payslip" },
  });

  return NextResponse.json({ pdfUrl: relativeUrl });
}
