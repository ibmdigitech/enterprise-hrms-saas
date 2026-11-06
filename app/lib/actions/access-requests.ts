'use server';

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission, AuthenticationError, AuthorizationError, validateRoleValue, assignableRoles } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ROLES } from "@/lib/auth/roles";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";

/* ─── Types ──────────────────────────────────────────────────────────── */

export type AccessRequestType =
    | "NEW_ACCESS"
    | "ROLE_CHANGE"
    | "PERMISSION_CHANGE"
    | "SCOPE_CHANGE"
    | "TEMPORARY_ACCESS"
    | "ACCESS_RENEWAL"
    | "ACCESS_REVOCATION";

export type AccessRequestStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";

/* ─── Submit Access Request (self-service) ───────────────────────────── */

export async function submitAccessRequest(prevState: unknown, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, message: "Not authenticated." };
    }

    const requestType  = formData.get("requestType")  as AccessRequestType | null;
    const requestedRole = formData.get("requestedRole") as string | null;
    const justification = formData.get("justification") as string | null;
    const effectiveDate = formData.get("effectiveDate") as string | null;
    const expiryDate    = formData.get("expiryDate")    as string | null;

    if (!requestedRole || !justification?.trim()) {
        return { success: false, message: "Requested role and justification are required." };
    }

    // Validate requested role is a known value
    const validated = validateRoleValue(requestedRole);
    if (!validated.ok) {
        return { success: false, message: `Invalid role: ${requestedRole}` };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { employee: true },
        });

        if (!user) return { success: false, message: "User not found." };

        // Prevent duplicate pending requests
        const existing = await prisma.roleRequest.findFirst({
            where: { userId: user.id, status: "PENDING" },
        });
        if (existing) {
            return { success: false, message: "You already have a pending access request. Please wait for it to be reviewed." };
        }

        // Build metadata for the request
        const metadata: Record<string, unknown> = {
            requestType: requestType ?? "ROLE_CHANGE",
            justification: justification.trim(),
            currentRole: user.role,
            submittedByEmail: user.email,
        };
        if (effectiveDate) metadata.effectiveDate = effectiveDate;
        if (expiryDate)    metadata.expiryDate    = expiryDate;

        await prisma.roleRequest.create({
            data: {
                userId:        user.id,
                requestedRole: validated.role,
                status:        "PENDING",
                tenantId:      user.employee?.tenantId ?? null,
            },
        });

        await logSecurityEvent({
            action:     SECURITY_ACTION.ROLE_CHANGED, // closest existing event
            actorEmail: user.email,
            actorRole:  user.role,
            target:     `user:${user.id}`,
            outcome:    "SUCCESS",
            detail:     { event: "ACCESS_REQUEST_SUBMITTED", ...metadata },
        });

        revalidatePath("/dashboard/request-access");
        revalidatePath("/dashboard/approvals/roles");
        return { success: true, message: "Your access request has been submitted and is pending review." };
    } catch (error) {
        console.error("[submitAccessRequest]", error);
        return { success: false, message: "An unexpected error occurred. Please try again." };
    }
}

/* ─── Approve / Reject role request (admin action) ───────────────────── */

export async function decideRoleRequest(requestId: string, decision: "APPROVED" | "REJECTED", comment?: string) {
    let actorEmail = "unknown";
    let actorRole  = "unknown";

    try {
        const actor = await requirePermission(PERMISSIONS.ACCESS_APPROVE);
        actorEmail  = actor.email;
        actorRole   = actor.role;

        const request = await prisma.roleRequest.findUnique({
            where:   { id: requestId },
            include: { user: true },
        });
        if (!request) return { success: false, message: "Request not found." };
        if (request.status !== "PENDING") return { success: false, message: "Request is no longer pending." };

        // Self-approval guard
        if (request.userId === actor.id) {
            await logSecurityEvent({
                action: SECURITY_ACTION.ROLE_REQUEST_REJECTED,
                actorEmail, actorRole,
                target:  `user:${request.userId}`,
                outcome: "DENIED",
                detail:  { requestId, reason: "self-approval attempt" },
            });
            return { success: false, message: "You cannot approve your own access request." };
        }

        if (decision === "REJECTED") {
            await prisma.roleRequest.update({
                where: { id: requestId },
                data:  { status: "REJECTED" },
            });
            await logSecurityEvent({
                action:     SECURITY_ACTION.ROLE_REQUEST_REJECTED,
                actorEmail, actorRole,
                target:     `user:${request.userId}`,
                outcome:    "SUCCESS",
                detail:     { requestId, requestedRole: request.requestedRole, comment },
            });
            revalidatePath("/dashboard/approvals/roles");
            return { success: true, message: "Request rejected." };
        }

        // APPROVED path: re-validate role
        const validated = validateRoleValue(request.requestedRole);
        if (!validated.ok) {
            await logSecurityEvent({
                action: SECURITY_ACTION.ROLE_REQUEST_APPROVED,
                actorEmail, actorRole,
                target:  `user:${request.userId}`,
                outcome: "DENIED",
                detail:  { requestId, reason: validated.error },
            });
            return { success: false, message: `Invalid role in request: ${validated.error}` };
        }
        const nextRole = validated.role;

        // Authority check: actor must be able to assign this role
        if (!assignableRoles(actor.role).includes(nextRole) && actor.role !== ROLES.SUPER_ADMIN) {
            await logSecurityEvent({
                action: SECURITY_ACTION.ROLE_REQUEST_APPROVED,
                actorEmail, actorRole,
                target:  `user:${request.userId}`,
                outcome: "DENIED",
                detail:  { requestId, requestedRole: nextRole, reason: "role not assignable by actor" },
            });
            return { success: false, message: "You are not authorized to grant this role." };
        }

        const previousRole = request.user?.role ?? null;

        // Apply in a transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: request.userId },
                data:  { role: nextRole },
            }),
            prisma.roleRequest.update({
                where: { id: requestId },
                data:  { status: "APPROVED" },
            }),
        ]);

        await logSecurityEvent({
            action:     SECURITY_ACTION.ROLE_CHANGED,
            actorEmail, actorRole,
            target:     `user:${request.userId}`,
            outcome:    "SUCCESS",
            detail: {
                requestId,
                targetEmail:  request.user?.email ?? null,
                previousRole,
                newRole:      nextRole,
                comment,
            },
        });

        revalidatePath("/dashboard/approvals/roles");
        return { success: true, message: `Access approved. ${request.user?.email} is now ${nextRole}.` };
    } catch (error) {
        if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
            await logSecurityEvent({
                action:     SECURITY_ACTION.ROLE_CHANGED,
                actorEmail, actorRole,
                outcome:    "DENIED",
                detail:     { requestId, reason: (error instanceof Error ? error.message : "Unknown error") },
            });
            return { success: false, message: "Access denied." };
        }
        console.error("[decideRoleRequest]", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}

/* ─── Cancel own pending request ─────────────────────────────────────── */

export async function cancelOwnAccessRequest(requestId: string) {
    const session = await auth();
    if (!session?.user?.email) return { success: false, message: "Not authenticated." };

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return { success: false, message: "User not found." };

        const request = await prisma.roleRequest.findUnique({ where: { id: requestId } });
        if (!request) return { success: false, message: "Request not found." };
        if (request.userId !== user.id) return { success: false, message: "You can only cancel your own requests." };
        if (request.status !== "PENDING") return { success: false, message: "Only pending requests can be cancelled." };

        await prisma.roleRequest.update({
            where: { id: requestId },
            data:  { status: "CANCELLED" as never },
        });

        revalidatePath("/dashboard/request-access");
        return { success: true, message: "Request cancelled." };
    } catch (error) {
        console.error("[cancelOwnAccessRequest]", error);
        return { success: false, message: "An unexpected error occurred." };
    }
}

/* ─── Load all requests for admin queue ──────────────────────────────── */

export async function getAccessRequestQueue(statusFilter: string = "PENDING") {
    const session = await auth();
    if (!session?.user?.email) return [];

    try {
        const actor = await requirePermission(PERMISSIONS.ACCESS_APPROVE);
        void actor; // permission verified

        const where: Record<string, unknown> = {};
        if (statusFilter !== "ALL") where.status = statusFilter;

        return await prisma.roleRequest.findMany({
            where,
            include: { user: { include: { employee: true } } },
            orderBy: { createdAt: "desc" },
            take: 200,
        });
    } catch {
        return [];
    }
}

/* ─── Load own requests ──────────────────────────────────────────────── */

export async function getMyAccessRequests() {
    const session = await auth();
    if (!session?.user?.email) return [];

    try {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return [];

        return await prisma.roleRequest.findMany({
            where:   { userId: user.id },
            orderBy: { createdAt: "desc" },
            take:    50,
        });
    } catch {
        return [];
    }
}

