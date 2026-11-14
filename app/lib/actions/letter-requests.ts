"use server";

import prisma from "@/lib/prisma";
import { requireUser, requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { buildLetterVariables, renderTemplate } from "@/lib/letters/variables";
import { generateOfficialLetterPDF, getPdfRelativeUrl } from "@/lib/letters/pdf-generator";
import { getCompanySettings } from "@/app/lib/actions/company-settings";
import { revalidatePath } from "next/cache";
import { AVAILABLE_LETTER_TYPES } from "@/lib/letters/types";

/**
 * Get current employee profile auto-populated for letter request.
 */
export async function getEmployeeProfileForLetter() {
  const user = await requireUser();

  const employee = await prisma.employee.findFirst({
    where: {
      OR: [
        { id: user.employeeId || "" },
        { userId: user.id },
      ],
    },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, designation: true },
      },
      salaryStructure: true,
      departmentRel: { select: { id: true, name: true } },
    },
  });

  if (!employee) {
    throw new Error("No employee master profile found for the active user account.");
  }

  return {
    id: employee.id,
    employeeCode: employee.employeeCode || employee.rollNumber || "EMP-001",
    name: `${employee.firstName} ${employee.lastName}`,
    firstName: employee.firstName,
    lastName: employee.lastName,
    department: employee.departmentRel?.name || employee.department || "General",
    designation: employee.designation || "Staff",
    email: employee.email,
    phone: employee.phone || "",
    workLocation: employee.workLocation || "Head Office",
    joiningDate: employee.joiningDate,
    managerName: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "Direct HR / Department Head",
    managerId: employee.manager?.id || null,
  };
}

/**
 * Submit a Letter Request (Employee).
 * Auto-populates all employee records. Employee never selects or sees raw templates.
 */
export async function submitLetterRequestAction(data: {
  letterType: string;
  purpose: string;
  remarks?: string;
  requiredDate?: string;
}) {
  const user = await requireUser();
  const profile = await getEmployeeProfileForLetter();

  if (!data.letterType || !data.purpose.trim()) {
    throw new Error("Letter type and purpose are required.");
  }

  // Find the matching template or fallback template for this letter type
  let template = await prisma.letterTemplate.findFirst({
    where: {
      isActive: true,
      type: { contains: data.letterType, mode: "insensitive" },
    },
  });

  if (!template) {
    template = await prisma.letterTemplate.findFirst({
      where: { isActive: true },
    });
  }

  if (!template) {
    // Auto-create standard default template if none exist
    template = await prisma.letterTemplate.create({
      data: {
        name: `Standard ${data.letterType.replace(/_/g, " ")}`,
        type: data.letterType,
        content_en: `TO WHOM IT MAY CONCERN\n\nThis is to certify that {{employee_name}} (Employee ID: {{employee_id}}) is currently employed with our organization as {{designation}} in the {{department}} department, having commenced employment on {{joining_date}}.\n\nThis letter is issued upon the employee's request for the purpose of {{purpose}}.\n\nWe confirm that the information provided is accurate and current.`,
        isActive: true,
      },
    });
  }

  const letterRequest = await prisma.letterRequest.create({
    data: {
      employeeId: profile.id,
      templateId: template.id,
      reason: data.purpose.trim(),
      status: "PENDING", // PENDING -> MANAGER_APPROVED -> HR_APPROVED -> COMPLETED
    },
    include: {
      approvals: true,
      generatedLetter: true,
    },
  });

  revalidatePath("/letters");
  revalidatePath("/staff-services");
  return { success: true, requestId: letterRequest.id };
}

/**
 * Get Letter Requests list based on caller role:
 * - EMPLOYEE: Sees own submitted requests with tracker
 * - MANAGER: Sees team requests pending manager approval
 * - HR / ADMIN: Sees all requests pending review or letter generation
 */
export async function getLetterRequestsAction(filter: "my" | "team" | "hr" = "my") {
  const user = await requireUser();
  const isHrOrAdmin = user.role === "ADMIN" || user.role === "HR";

  if (filter === "my") {
    const profile = await getEmployeeProfileForLetter().catch(() => null);
    if (!profile) return [];

    return await prisma.letterRequest.findMany({
      where: { employeeId: profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        template: { select: { name: true, type: true } },
        approvals: { orderBy: { createdAt: "asc" } },
        generatedLetter: {
          select: { id: true, referenceNumber: true, pdfUrl: true, status: true },
        },
      },
    });
  }

  if (filter === "team") {
    // Direct reportees of this manager
    return await prisma.letterRequest.findMany({
      where: {
        employee: {
          manager: {
            OR: [
              { id: user.employeeId || "" },
              { userId: user.id },
            ],
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, department: true, designation: true },
        },
        template: { select: { name: true, type: true } },
        approvals: { orderBy: { createdAt: "asc" } },
        generatedLetter: true,
      },
    });
  }

  if (filter === "hr" && isHrOrAdmin) {
    return await prisma.letterRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true, department: true, designation: true },
        },
        template: { select: { name: true, type: true } },
        approvals: { orderBy: { createdAt: "asc" } },
        generatedLetter: true,
      },
    });
  }

  return [];
}

/**
 * Manager Decision: Approve or Reject
 */
export async function managerDecisionAction(data: {
  requestId: string;
  action: "APPROVED" | "REJECTED";
  comments?: string;
}) {
  const user = await requireUser();

  const request = await prisma.letterRequest.findUnique({
    where: { id: data.requestId },
    include: { employee: true },
  });
  if (!request) throw new Error("Letter request not found.");

  // Record approval step
  await prisma.letterApproval.create({
    data: {
      letterRequestId: request.id,
      approverId: user.id,
      level: "MANAGER",
      action: data.action,
      comments: data.comments?.trim() || null,
    },
  });

  // Transition request status
  const nextStatus = data.action === "APPROVED" ? "MANAGER_APPROVED" : "REJECTED";
  await prisma.letterRequest.update({
    where: { id: request.id },
    data: { status: nextStatus },
  });

  revalidatePath("/letters");
  revalidatePath("/staff-services");
  return { success: true };
}

/**
 * HR Decision: Review & Generate Signed Document
 */
export async function hrDecisionAction(data: {
  requestId: string;
  action: "APPROVED" | "REJECTED";
  comments?: string;
  customContent?: string;
}) {
  await requirePermission(PERMISSIONS.LETTER_GENERATE);
  const user = await requireUser();

  const request = await prisma.letterRequest.findUnique({
    where: { id: data.requestId },
    include: {
      employee: { include: { salaryStructure: true } },
      template: true,
    },
  });
  if (!request) throw new Error("Letter request not found.");

  // Record HR approval step
  await prisma.letterApproval.create({
    data: {
      letterRequestId: request.id,
      approverId: user.id,
      level: "HR",
      action: data.action,
      comments: data.comments?.trim() || null,
    },
  });

  if (data.action === "REJECTED") {
    await prisma.letterRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED" },
    });
    revalidatePath("/letters");
    revalidatePath("/staff-services");
    return { success: true, message: "Request rejected." };
  }

  // Generate Reference Number
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const referenceNumber = `REF/${request.template?.type || "DOC"}/${dateStr}/${randomSuffix}`;

  // 1. Resolve variables
  const branding = await getCompanySettings();
  const variables = buildLetterVariables(request.employee, {
    referenceNumber,
    companyName: branding.name,
    customFields: {
      'request.purpose': request.reason || "Official Records",
      'purpose': request.reason || "Official Records",
    },
  });

  const finalContentEn = data.customContent || renderTemplate(request.template.content_en, variables);
  const finalContentAr = request.template.content_ar ? renderTemplate(request.template.content_ar, variables) : null;

  // 2. Generate PDF with tenant letterhead, stamp, signature
  const pdfDiskPath = await generateOfficialLetterPDF({
    referenceNumber,
    letterType: request.template.type,
    content_en: finalContentEn,
    content_ar: finalContentAr,
    branding,
    employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
    employeeId: request.employee.employeeCode || request.employee.rollNumber || undefined,
    designation: request.employee.designation || undefined,
    department: request.employee.department || undefined,
  });

  const pdfUrl = getPdfRelativeUrl(pdfDiskPath);

  // 3. Persist Letter record
  const letter = await prisma.letter.create({
    data: {
      employeeId: request.employeeId,
      templateId: request.templateId,
      letterRequestId: request.id,
      referenceNumber,
      status: "GENERATED",
      content_en: finalContentEn,
      content_ar: finalContentAr,
      pdfUrl,
      approvedBy: user.email,
      approvedAt: new Date(),
    },
  });

  // 4. Mark LetterRequest as COMPLETED
  await prisma.letterRequest.update({
    where: { id: request.id },
    data: { status: "COMPLETED" },
  });

  revalidatePath("/letters");
  revalidatePath("/staff-services");
  return { success: true, letterId: letter.id, pdfUrl };
}
