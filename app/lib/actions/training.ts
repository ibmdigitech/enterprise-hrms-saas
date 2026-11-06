"use server";

import prisma from "@/lib/prisma";
import { assertTransition, TRAINING_ENROLLMENT_STATUS, TRAINING_CERTIFICATE_STATUS, TRAINING_COURSE_STATUS, TRAINING_SESSION_STATUS } from "@/lib/workflow/state-machine";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

import { requireUser } from "@/lib/auth/guards";

async function getCurrentTenantId() {
    const user = await requireUser();
    return user.tenantId;
}

async function getCurrentUserId() {
    const user = await requireUser();
    return user.id;
}

async function getCurrentRole() {
    const user = await requireUser();
    return user.role;
}

export async function createTrainingCourse(data: {
    title: string;
    code: string;
    description?: string;
    category: string;
    level?: string;
    durationHours?: number;
    maxParticipants?: number;
    tags?: string[];
    provider?: string;
    costPerParticipant?: number;
}) {
    const user = await requireUser();
    const tenantId = (await getCurrentTenantId()) as string;
    const userId = await getCurrentUserId();

    const course = await prisma.trainingCourse.create({
        data: {
            tenantId,
            title: data.title,
            code: data.code,
            description: data.description,
            category: data.category,
            level: data.level || "BEGINNER",
            durationHours: data.durationHours || 0,
            maxParticipants: data.maxParticipants,
            tags: data.tags || [],
            provider: data.provider,
            costPerParticipant: data.costPerParticipant || 0,
            createdById: userId,
        },
    });

    revalidatePath("/dashboard/training");
    return course;
}

export async function publishTrainingCourse(courseId: string) {
    const user = await requireUser();
    const userId = await getCurrentUserId();

    const course = await prisma.trainingCourse.findUnique({ where: { id: courseId } });
    if (!course) throw new Error("Course not found");

    assertTransition("TRAINING_COURSE", { DRAFT: { PUBLISHED: { actors: ["HR", "ADMIN", "SUPER_ADMIN"] } } }, course.status, "PUBLISHED", {
        actorRole: user.role,
        actorId: userId,
    });

    await prisma.trainingCourse.update({
        where: { id: courseId },
        data: { status: "PUBLISHED", updatedById: userId },
    });

    revalidatePath("/dashboard/training");
    return { success: true };
}

export async function createTrainingSession(data: {
    courseId: string;
    title: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    instructorId?: string;
    maxParticipants?: number;
    meetingLink?: string;
}) {
    const user = await requireUser();
    const tenantId = (await getCurrentTenantId()) as string;
    const userId = await getCurrentUserId();
    const companyId = user.companyId;

    const trainingSession = await prisma.trainingSession.create({
        data: {
            courseId: data.courseId,
            tenantId,
            companyId,
            title: data.title,
            startDate: data.startDate,
            endDate: data.endDate,
            location: data.location,
            instructorId: data.instructorId,
            maxParticipants: data.maxParticipants,
            meetingLink: data.meetingLink,
            status: "SCHEDULED",
            createdById: userId,
        },
    });

    revalidatePath("/dashboard/training");
    return trainingSession;
}

export async function enrollEmployeeInSession(data: {
    sessionId: string;
    employeeId: string;
}) {
    const user = await requireUser();
    const tenantId = (await getCurrentTenantId()) as string;
    const userId = await getCurrentUserId();

    const trainingSession = await prisma.trainingSession.findUnique({
        where: { id: data.sessionId },
        include: { course: true },
    });
    if (!trainingSession) throw new Error("Session not found");

    const enrollment = await prisma.trainingEnrollment.create({
        data: {
            sessionId: data.sessionId,
            courseId: trainingSession.courseId,
            employeeId: data.employeeId,
            tenantId,
            status: "REQUESTED",
            approvalStatus: "PENDING",
            enrolledById: userId,
        },
    });

    revalidatePath("/dashboard/training");
    return enrollment;
}

export async function approveEnrollment(enrollmentId: string) {
    const user = await requireUser();
    const userId = await getCurrentUserId();
    const role = user.role;

    const enrollment = await prisma.trainingEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new Error("Enrollment not found");

    assertTransition("TRAINING_ENROLLMENT", { REQUESTED: { APPROVED: { actors: ["MANAGER", "HR", "ADMIN", "SUPER_ADMIN"] } } }, enrollment.status, "APPROVED", {
        actorRole: role,
        actorId: userId,
    });

    await prisma.trainingEnrollment.update({
        where: { id: enrollmentId },
        data: {
            status: "APPROVED",
            approvalStatus: "APPROVED",
            approvedById: userId,
            approvedAt: new Date(),
        },
    });

    revalidatePath("/dashboard/training");
    return { success: true };
}

export async function rejectEnrollment(enrollmentId: string, reason?: string) {
    const user = await requireUser();
    const userId = await getCurrentUserId();
    const role = user.role;

    const enrollment = await prisma.trainingEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new Error("Enrollment not found");

    assertTransition("TRAINING_ENROLLMENT", { REQUESTED: { REJECTED: { actors: ["MANAGER", "HR", "ADMIN", "SUPER_ADMIN"] } } }, enrollment.status, "REJECTED", {
        actorRole: role,
        actorId: userId,
    });

    await prisma.trainingEnrollment.update({
        where: { id: enrollmentId },
        data: {
            status: "REJECTED",
            approvalStatus: "REJECTED",
            feedback: reason,
        },
    });

    revalidatePath("/dashboard/training");
    return { success: true };
}

export async function completeEnrollment(enrollmentId: string, score?: number) {
    const user = await requireUser();
    const userId = await getCurrentUserId();
    const role = user.role;

    const enrollment = await prisma.trainingEnrollment.findUnique({
        where: { id: enrollmentId },
        include: { employee: true, course: true, session: true },
    });
    if (!enrollment) throw new Error("Enrollment not found");

    assertTransition("TRAINING_ENROLLMENT", { APPROVED: { COMPLETED: { actors: ["STAFF", "MANAGER", "HR", "ADMIN", "SUPER_ADMIN"] } } }, enrollment.status, "COMPLETED", {
        actorRole: role,
        actorId: userId,
    });

    await prisma.trainingEnrollment.update({
        where: { id: enrollmentId },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
            score: score,
            assessmentStatus: score && score >= 70 ? "PASSED" : "PASSED",
        },
    });

    // Auto-issue certificate if course issues certificates
    if (enrollment.course.issuesCertificate) {
        await issueCertificate(enrollmentId);
    }

    revalidatePath("/dashboard/training");
    return { success: true };
}

export async function issueCertificate(enrollmentId: string) {
    const user = await requireUser();
    const tenantId = (await getCurrentTenantId()) as string;
    const userId = await getCurrentUserId();

    const enrollment = await prisma.trainingEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
            employee: true,
            course: true,
            session: { include: { instructor: true } },
        },
    });
    if (!enrollment) throw new Error("Enrollment not found");
    if (enrollment.status !== "COMPLETED") throw new Error("Enrollment not completed");

    // Check if certificate already issued
    const existing = await prisma.trainingCertificate.findUnique({
        where: { enrollmentId },
    });
    if (existing) return existing;

    const certificateNumber = `CERT-${randomBytes(4).toString("hex").toUpperCase()}`;
    const verificationCode = randomBytes(16).toString("hex");
    const employeePhoto = enrollment.employee.photo || null;

    const certificate = await prisma.trainingCertificate.create({
        data: {
            tenantId,
            companyId: enrollment.session.companyId,
            courseId: enrollment.courseId,
            enrollmentId,
            employeeId: enrollment.employeeId,
            certificateNumber,
            title: `Certificate of Completion - ${enrollment.course.title}`,
            verificationCode,
            issuedById: userId,
            employeePhoto,
            metadata: {
                courseTitle: enrollment.course.title,
                courseCode: enrollment.course.code,
                courseCategory: enrollment.course.category,
                sessionTitle: enrollment.session.title,
                instructorName: enrollment.session.instructor?.name || "N/A",
                sessionLocation: enrollment.session.location || "N/A",
                completionDate: enrollment.completedAt?.toISOString() || new Date().toISOString(),
                score: enrollment.score,
                grade: enrollment.score && enrollment.score >= 90 ? "A" : enrollment.score && enrollment.score >= 80 ? "B" : "C",
            },
        },
    });

    // Update enrollment with certificate reference
    await prisma.trainingEnrollment.update({
        where: { id: enrollmentId },
        data: { certificateId: certificate.id },
    });

    revalidatePath("/dashboard/training");
    return certificate;
}

export async function revokeCertificate(certificateId: string, reason: string) {
    const user = await requireUser();
    const userId = await getCurrentUserId();
    const role = user.role;

    const certificate = await prisma.trainingCertificate.findUnique({ where: { id: certificateId } });
    if (!certificate) throw new Error("Certificate not found");

    assertTransition("TRAINING_CERTIFICATE", { ISSUED: { REVOKED: { actors: ["HR", "ADMIN", "SUPER_ADMIN"] } } }, certificate.status, "REVOKED", {
        actorRole: role,
        actorId: userId,
    });

    await prisma.trainingCertificate.update({
        where: { id: certificateId },
        data: {
            status: "REVOKED",
            revokedAt: new Date(),
            revokedById: userId,
            revocationReason: reason,
        },
    });

    revalidatePath("/dashboard/training");
    return { success: true };
}

export async function markAttendance(data: {
    enrollmentId: string;
    date: Date;
    status: string;
    checkInAt?: Date;
    checkOutAt?: Date;
}) {
    const user = await requireUser();
    const userId = await getCurrentUserId();

    const enrollment = await prisma.trainingEnrollment.findUnique({
        where: { id: data.enrollmentId },
        include: { session: true, employee: true },
    });
    if (!enrollment) throw new Error("Enrollment not found");

    const attendance = await prisma.trainingAttendance.upsert({
        where: {
            enrollmentId_date: {
                enrollmentId: data.enrollmentId,
                date: data.date,
            },
        },
        update: {
            status: data.status,
            checkInAt: data.checkInAt,
            checkOutAt: data.checkOutAt,
            markedById: userId,
        },
        create: {
            enrollmentId: data.enrollmentId,
            sessionId: enrollment.sessionId,
            employeeId: enrollment.employeeId,
            date: data.date,
            status: data.status,
            checkInAt: data.checkInAt,
            checkOutAt: data.checkOutAt,
            markedById: userId,
        },
    });

    revalidatePath("/dashboard/training");
    return attendance;
}

export async function getTrainingCourses(tenantId?: string) {
    const tid = (tenantId || await getCurrentTenantId()) as string;
    return prisma.trainingCourse.findMany({
        where: { tenantId: tid },
        include: {
            _count: { select: { enrollments: true, sessions: true } },
            createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getTrainingSessions(courseId?: string) {
    const tenantId = (await getCurrentTenantId()) as string;
    return prisma.trainingSession.findMany({
        where: {
            tenantId,
            ...(courseId ? { courseId } : {}),
        },
        include: {
            course: { select: { title: true, code: true } },
            instructor: { select: { name: true } },
            _count: { select: { enrollments: true } },
        },
        orderBy: { startDate: "asc" },
    });
}

export async function getEnrollments(sessionId?: string, employeeId?: string) {
    const tenantId = (await getCurrentTenantId()) as string;
    return prisma.trainingEnrollment.findMany({
        where: {
            tenantId,
            ...(sessionId ? { sessionId } : {}),
            ...(employeeId ? { employeeId } : {}),
        },
        include: {
            employee: { select: { firstName: true, lastName: true, photo: true, employeeCode: true } },
            course: { select: { title: true, code: true } },
            session: { select: { title: true, startDate: true, endDate: true } },
            certificate: { select: { certificateNumber: true, status: true, issuedAt: true } },
        },
        orderBy: { enrolledAt: "desc" },
    });
}

export async function getCertificates(employeeId?: string) {
    const tenantId = (await getCurrentTenantId()) as string;
    return prisma.trainingCertificate.findMany({
        where: {
            tenantId,
            ...(employeeId ? { employeeId } : {}),
        },
        include: {
            employee: { select: { firstName: true, lastName: true, photo: true, employeeCode: true } },
            course: { select: { title: true, code: true } },
            issuedBy: { select: { name: true } },
        },
        orderBy: { issuedAt: "desc" },
    });
}

export async function verifyCertificate(verificationCode: string) {
    const certificate = await prisma.trainingCertificate.findUnique({
        where: { verificationCode },
        include: {
            employee: { select: { firstName: true, lastName: true, photo: true, employeeCode: true } },
            course: { select: { title: true, code: true, category: true } },
            tenant: { select: { name: true, logoUrl: true } },
            issuedBy: { select: { name: true } },
        },
    });

    if (!certificate) return null;

    return {
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
    };
}

export async function getEmployeesForTraining() {
    const user = await requireUser();
    const tenantId = user.tenantId as string;
    if (!tenantId) return [];

    return prisma.employee.findMany({
        where: { tenantId, isActive: true },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: true,
            designation: true,
            photo: true,
        },
        orderBy: { firstName: "asc" },
    });
}
