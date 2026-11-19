"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function changePassword(formData: FormData) {
    const email = formData.get("email") as string;
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!email || !currentPassword || !newPassword) {
        return { error: "All fields are required" };
    }

    if (newPassword.length < 12) {
        return { error: "New password must be at least 12 characters" };
    }

    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: { id: true, email: true, password: true },
    });

    if (!user || !user.password) {
        return { error: "Account not found or has no password set" };
    }

    // Verify current password
    const passwordMatched = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatched) {
        return { error: "Current password is incorrect" };
    }

    const now = new Date();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
        prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        }),
        prisma.userSecurityFlag.upsert({
            where: { userId: user.id },
            update: {
                mustChangePassword: false,
                mustChangeReason: null,
                passwordChangedAt: now,
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
            create: {
                userId: user.id,
                mustChangePassword: false,
                passwordChangedAt: now,
            },
        }),
    ]);

    return { success: true, message: "Password changed successfully" };
}

export type LoginRequirementResult =
    | { status: "CONTINUE" }
    | { status: "MUST_CHANGE_PASSWORD"; email: string; reason?: string };

export async function checkLoginRequirementAction(
    emailRaw: string,
    passwordRaw: string
): Promise<LoginRequirementResult> {
    if (!emailRaw || !passwordRaw) {
        return { status: "CONTINUE" };
    }

    try {
        const normalizedEmail = emailRaw.toLowerCase().trim();
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                email: true,
                password: true,
                securityFlag: {
                    select: {
                        mustChangePassword: true,
                        mustChangeReason: true,
                        lockedUntil: true,
                    },
                },
            },
        });

        if (!user || !user.password) {
            return { status: "CONTINUE" };
        }

        if (user.securityFlag?.lockedUntil && new Date() < user.securityFlag.lockedUntil) {
            return { status: "CONTINUE" };
        }

        const passwordMatched = await bcrypt.compare(passwordRaw, user.password);
        if (!passwordMatched) {
            return { status: "CONTINUE" };
        }

        if (user.securityFlag?.mustChangePassword) {
            return {
                status: "MUST_CHANGE_PASSWORD",
                email: user.email,
                reason: user.securityFlag.mustChangeReason ?? "First login password change required",
            };
        }

        return { status: "CONTINUE" };
    } catch (err) {
        console.error("[CHECK_LOGIN_REQUIREMENT_ERROR]", err);
        return { status: "CONTINUE" };
    }
}
