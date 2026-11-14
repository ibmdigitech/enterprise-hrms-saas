"use server";

import prisma from "@/lib/prisma";

export async function checkPasswordRequired(email: string) {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: {
            id: true,
            email: true,
            securityFlag: {
                select: { mustChangePassword: true },
            },
        },
    });

    if (!user) {
        return { passwordChangeRequired: false, userId: null };
    }

    return {
        passwordChangeRequired: user.securityFlag?.mustChangePassword ?? false,
        userId: user.id,
    };
}
