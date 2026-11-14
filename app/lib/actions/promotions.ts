"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requirePermission, AuthorizationError } from "@/lib/auth/guards";
import { PERMISSIONS, hasPermission, resolvePermissions } from "@/lib/auth/permissions";
import { buildSubject, canActOnEmployeeRecord } from "@/lib/auth/scope";
import { generateLetterPDF } from "@/app/lib/utils/letter-generator";
import { getCompanySettings } from "@/app/lib/actions/company-settings";

export interface PromotionRequestInput {
    employeeId: string;
    promotionType?: string;
    proposedDesignation: string;
    proposedDepartment?: string;
    proposedGrade?: string;
    salaryRevision?: boolean;
    proposedBasicSalary?: number;
    proposedHousing?: number;
    proposedTransport?: number;
    proposedOther?: number;
    effectiveDate: string; // ISO date
    reason: string;
    justificationNotes?: string;
}

/**
 * Creates an employee promotion request.
 * Enforces tenant boundary and RBAC (`EMPLOYEE_PROMOTION_CREATE`).
 */
export async function createPromotionRequest(data: PromotionRequestInput) {
    await requirePermission(PERMISSIONS.EMPLOYEE_PROMOTION_CREATE);

    const session = await auth();
    if (!session?.user?.email) {
        throw new AuthorizationError("Authentication required");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
    });
    if (!user) throw new AuthorizationError("User record not found");

    const subject = await buildSubject(user.id, user.email);
    if (!subject) throw new AuthorizationError("Unable to establish user authorization subject");

    // Load target employee ensuring tenant matches
    const employee = await prisma.employee.findUnique({
        where: { id: data.employeeId },
        select: {
            id: true,
            tenantId: true,
            companyId: true,
            department: true,
            designation: true,
            basicSalary: true,
            housingAllowance: true,
            transportAllowance: true,
            otherAllowance: true,
            firstName: true,
            lastName: true,
            managerId: true,
        },
    });

    if (!employee) {
        return { success: false, error: "Employee record not found" };
    }

    // Verify scope (tenant, company, or department line)
    const canAct = canActOnEmployeeRecord(subject, {
        employeeId: employee.id,
        department: employee.department,
        tenantId: employee.tenantId,
        companyId: employee.companyId,
    });

    if (!canAct) {
        return { success: false, error: "Unauthorized: Out of organizational scope" };
    }

    if (!employee.tenantId) {
        return { success: false, error: "Employee does not belong to a valid tenant" };
    }

    try {
        const promotion = await prisma.employeePromotion.create({
            data: {
                tenantId: employee.tenantId,
                employeeId: employee.id,
                fromTitle: employee.designation || "Staff",
                toTitle: data.proposedDesignation,
                fromGrade: null,
                toGrade: data.proposedGrade,
                fromSalary: employee.basicSalary,
                toSalary: data.proposedBasicSalary,
                proposedBasicSalary: data.proposedBasicSalary,
                proposedHousing: data.proposedHousing,
                proposedTransport: data.proposedTransport,
                proposedOther: data.proposedOther,
                previousBasicSalary: employee.basicSalary,
                previousHousing: employee.housingAllowance,
                previousTransport: employee.transportAllowance,
                previousOther: employee.otherAllowance,
                previousDesignation: employee.designation || "Staff",
                proposedDesignation: data.proposedDesignation,
                effectiveDate: new Date(data.effectiveDate),
                reason: data.reason,
                status: "PENDING",
                approvedById: null,
                createdById: user.id,
            },
        });

        // Notify Approvers
        try {
            const approvers = await prisma.user.findMany({
                where: {
                    role: { in: ["ADMIN", "HR", "SUPER_ADMIN", "HR_MANAGER", "COMPANY_ADMIN"] },
                    employee: { isNot: null },
                },
                select: { employee: { select: { id: true } } },
            });

            if (approvers.length > 0) {
                await prisma.notification.createMany({
                    data: approvers
                        .filter((a): a is typeof a & { employee: { id: string } } => a.employee !== null)
                        .map((a) => ({
                            employeeId: a.employee.id,
                            title: "New Employee Promotion Request",
                            message: `Promotion request submitted for ${employee.firstName} ${employee.lastName} to ${data.proposedDesignation}.`,
                            type: "INFO",
                            link: "/dashboard/approvals",
                        })),
                });
            }
        } catch (notifErr) {
            console.error("[PROMOTION_NOTIFY_ERROR]", notifErr);
        }

        // Audit Log
        try {
            await prisma.auditLog.create({
                data: {
                    employeeId: employee.id,
                    action: "PROMOTION_REQUESTED",
                    details: `Requested promotion to ${data.proposedDesignation} with effective date ${data.effectiveDate}`,
                    changedBy: user.email,
                },
            });
        } catch (auditErr) {
            console.error("[PROMOTION_AUDIT_ERROR]", auditErr);
        }

        revalidatePath(`/employees/${employee.id}`);
        revalidatePath("/dashboard/approvals");

        return { success: true, data: promotion };
    } catch (err: any) {
        console.error("[CREATE_PROMOTION_ERROR]", err);
        return { success: false, error: err.message || "Failed to create promotion request" };
    }
}

/**
 * Approves a promotion request.
 * If effective date has been reached, applies the promotion immediately.
 */
export async function approvePromotionRequest(promotionId: string) {
    await requirePermission(PERMISSIONS.EMPLOYEE_PROMOTION_APPROVE);

    const session = await auth();
    if (!session?.user?.email) {
        throw new AuthorizationError("Authentication required");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
    });
    if (!user) throw new AuthorizationError("User record not found");

    const subject = await buildSubject(user.id, user.email);
    if (!subject) throw new AuthorizationError("Unable to establish subject");

    const promotion = await prisma.employeePromotion.findUnique({
        where: { id: promotionId },
        include: {
            employee: true,
        },
    });

    if (!promotion) {
        return { success: false, error: "Promotion request not found" };
    }

    if (promotion.status !== "PENDING") {
        return { success: false, error: `Cannot approve request in status ${promotion.status}` };
    }

    // Verify Scope
    const canAct = canActOnEmployeeRecord(subject, {
        employeeId: promotion.employee.id,
        department: promotion.employee.department,
        tenantId: promotion.employee.tenantId,
        companyId: promotion.employee.companyId,
    });

    if (!canAct) {
        return { success: false, error: "Unauthorized: Out of organizational scope" };
    }

    const now = new Date();
    const isEffectiveNow = new Date(promotion.effectiveDate) <= now;

    try {
        await prisma.$transaction(async (tx) => {
            // Update promotion status to APPROVED
            await tx.employeePromotion.update({
                where: { id: promotionId },
                data: {
                    status: isEffectiveNow ? "APPROVED" : "APPROVED",
                    approvedById: user.id,
                    approvedAt: now,
                },
            });

            // If effective today, apply immediately
            if (isEffectiveNow) {
                await tx.employee.update({
                    where: { id: promotion.employeeId },
                    data: {
                        designation: promotion.proposedDesignation,
                        department: promotion.employee.department,
                        ...(promotion.proposedBasicSalary !== null
                            ? {
                                  basicSalary: promotion.proposedBasicSalary,
                                  housingAllowance: promotion.proposedHousing ?? promotion.employee.housingAllowance,
                                  transportAllowance: promotion.proposedTransport ?? promotion.employee.transportAllowance,
                                  otherAllowance: promotion.proposedOther ?? promotion.employee.otherAllowance,
                              }
                            : {}),
                    },
                });

                // Update or create SalaryStructure if applicable
                if (promotion.proposedBasicSalary !== null) {
                    await tx.salaryStructure.upsert({
                        where: { employeeId: promotion.employeeId },
                        create: {
                            employeeId: promotion.employeeId,
                            basic: promotion.proposedBasicSalary,
                            housingAllowance: promotion.proposedHousing ?? 0,
                            transportAllowance: promotion.proposedTransport ?? 0,
                            otherAllowances: promotion.proposedOther ?? 0,
                        },
                        update: {
                            basic: promotion.proposedBasicSalary,
                            housingAllowance: promotion.proposedHousing ?? undefined,
                            transportAllowance: promotion.proposedTransport ?? undefined,
                            otherAllowances: promotion.proposedOther ?? undefined,
                        },
                    });
                }
            }

            // Generate official LetterRecord
            const letter = await tx.letterRecord.create({
                data: {
                    employeeId: promotion.employeeId,
                    type: "PROMOTION_LETTER",
                    recipientName: `${promotion.employee.firstName} ${promotion.employee.lastName}`,
                    status: "APPROVED",
                    details: JSON.stringify({
                        designation: promotion.proposedDesignation,
                        department: promotion.employee.department,
                        effectiveDate: promotion.effectiveDate,
                        reason: promotion.reason,
                        salaryRevision: promotion.proposedBasicSalary !== null,
                        newBasicSalary: promotion.proposedBasicSalary,
                    }),
                },
            });

            // Link letter back to promotion (pdfUrl field)
            await tx.employeePromotion.update({
                where: { id: promotionId },
                data: { pdfUrl: letter.id }, // Store letter ID in pdfUrl as reference
            });

            // Log Audit
            await tx.auditLog.create({
                data: {
                    employeeId: promotion.employeeId,
                    action: isEffectiveNow ? "PROMOTION_APPLIED" : "PROMOTION_APPROVED",
                    details: `Promotion ${isEffectiveNow ? "applied" : "approved"} by ${user.email}. New designation: ${promotion.proposedDesignation}`,
                    changedBy: user.email,
                },
            });

            // Notify Employee
            await tx.notification.create({
                data: {
                    employeeId: promotion.employeeId,
                    title: "Congratulations! Promotion Approved",
                    message: `Your promotion to ${promotion.proposedDesignation} has been approved${isEffectiveNow ? " and is now active" : ` effective ${new Date(promotion.effectiveDate).toLocaleDateString()}`}.`,
                    type: "SUCCESS",
                    link: `/employees/${promotion.employeeId}`,
                },
            });
        });

        revalidatePath(`/employees/${promotion.employeeId}`);
        revalidatePath("/dashboard/approvals");

        return { success: true, message: isEffectiveNow ? "Promotion approved and applied successfully!" : "Promotion approved and scheduled for effective date!" };
    } catch (err: any) {
        console.error("[APPROVE_PROMOTION_ERROR]", err);
        return { success: false, error: err.message || "Failed to approve promotion request" };
    }
}

/**
 * Rejects a promotion request with a recorded reason.
 */
export async function rejectPromotionRequest(promotionId: string, rejectionReason: string) {
    await requirePermission(PERMISSIONS.EMPLOYEE_PROMOTION_APPROVE);

    const session = await auth();
    if (!session?.user?.email) throw new AuthorizationError("Authentication required");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
    });
    if (!user) throw new AuthorizationError("User record not found");

    const subject = await buildSubject(user.id, user.email);
    if (!subject) throw new AuthorizationError("Unable to establish subject");

    const promotion = await prisma.employeePromotion.findUnique({
        where: { id: promotionId },
        include: { employee: true },
    });

    if (!promotion) return { success: false, error: "Promotion request not found" };
    if (promotion.status !== "PENDING_APPROVAL") {
        return { success: false, error: `Cannot reject request in status ${promotion.status}` };
    }

    const canAct = canActOnEmployeeRecord(subject, {
        employeeId: promotion.employee.id,
        department: promotion.employee.department,
        tenantId: promotion.employee.tenantId,
        companyId: promotion.employee.companyId,
    });
    if (!canAct) return { success: false, error: "Unauthorized: Out of organizational scope" };

    try {
        await prisma.employeePromotion.update({
            where: { id: promotionId },
            data: {
                status: "REJECTED",
                approvedById: user.id,
                approvedAt: new Date(),
                reason: rejectionReason || "No reason specified",
            },
        });

        // Audit Log
        await prisma.auditLog.create({
            data: {
                employeeId: promotion.employeeId,
                action: "PROMOTION_REJECTED",
                details: `Promotion request rejected by ${user.email}. Reason: ${rejectionReason}`,
                changedBy: user.email,
            },
        });

        revalidatePath(`/employees/${promotion.employeeId}`);
        revalidatePath("/dashboard/approvals");

        return { success: true, message: "Promotion request rejected." };
    } catch (err: any) {
        console.error("[REJECT_PROMOTION_ERROR]", err);
        return { success: false, error: err.message || "Failed to reject promotion" };
    }
}

/**
 * Gets the promotion history for an employee.
 */
export async function getEmployeePromotionHistory(employeeId: string) {
    await requirePermission(PERMISSIONS.EMPLOYEE_PROMOTION_VIEW);

    return prisma.employeePromotion.findMany({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
        include: {
            createdBy: { select: { name: true, email: true } },
            approvedBy: { select: { name: true, email: true } },
        },
    });
}

/**
 * Gets all pending promotion requests within the caller's scope.
 */
export async function getPendingPromotionsQueue() {
    await requirePermission(PERMISSIONS.EMPLOYEE_PROMOTION_APPROVE);

    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
    });
    if (!user) return [];

    const subject = await buildSubject(user.id, user.email);
    if (!subject) return [];

    const whereClause: any = { status: "PENDING_APPROVAL" };
    if (subject.tenantId) {
        whereClause.tenantId = subject.tenantId;
    }

    return prisma.employeePromotion.findMany({
        where: whereClause,
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    employeeCode: true,
                    department: true,
                    designation: true,
                    basicSalary: true,
                },
            },
            createdBy: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}



/**
 * Gets all promotions across the tenant (for the main Promotions page).
 */
export async function getAllPromotions() {
    await requirePermission(PERMISSIONS.EMPLOYEE_PROMOTION_VIEW);

    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true, role: true, employee: { select: { id: true, managerId: true } } },
    });
    if (!user) return [];

    const subject = await buildSubject(user.id, user.email);
    if (!subject) return [];

    const whereClause: any = {};
    if (subject.tenantId) {
        whereClause.tenantId = subject.tenantId;
    }

    // Role-based visibility scoping:
    // - Staff/Employee: sees only their own promotions
    // - Manager: sees their team members' promotions
    // - Admin / HR: sees all promotions in the tenant
    if (user.role === "STAFF" || user.role === "EMPLOYEE") {
        if (!user.employee) return [];
        whereClause.employeeId = user.employee.id;
    } else if (user.role === "MANAGER") {
        if (user.employee) {
            whereClause.employee = { managerId: user.employee.id };
        }
    }

    return prisma.employeePromotion.findMany({
        where: whereClause,
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    employeeCode: true,
                    department: true,
                    designation: true,
                    basicSalary: true,
                    housingAllowance: true,
                    transportAllowance: true,
                    otherAllowance: true,
                },
            },
            createdBy: { select: { name: true, email: true } },
            approvedBy: { select: { name: true, email: true } },
        },
        orderBy: { effectiveDate: "desc" },
    });
}

/**
 * Gets list of active employees for promotion selection.
 */
export async function getEmployeesForPromotion() {
    const session = await auth();
    if (!session?.user?.email) return [];

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true, role: true },
    });
    if (!user) return [];

    // Allow staff/employees to view promotions list, but only users with promotion create permission get the selection list
    const subject = await buildSubject(user.id, user.email);
    if (!subject) return [];

    const { permissions } = resolvePermissions(subject.role as any);
    const hasCreate = permissions.has(PERMISSIONS.EMPLOYEE_PROMOTION_CREATE) ||
        subject.role === "ADMIN" ||
        subject.role === "SUPER_ADMIN" ||
        subject.role === "HR";

    if (!hasCreate) {
        return [];
    }

    const whereClause: any = { isActive: true };
    if (subject.tenantId) {
        whereClause.tenantId = subject.tenantId;
    }

    return prisma.employee.findMany({
        where: whereClause,
        select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: true,
            designation: true,
            basicSalary: true,
            housingAllowance: true,
            transportAllowance: true,
            otherAllowance: true,
        },
        orderBy: { firstName: "asc" },
    });
}
