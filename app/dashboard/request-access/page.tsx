import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RequestAccessPageClient } from "./page-client";

export const dynamic = "force-dynamic";

export default async function Page() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });
    if (!user) redirect("/login");

    // Load this user's own access requests (most recent first)
    const ownRequests = await prisma.roleRequest.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: "desc" },
        take:    20,
        select: {
            id:            true,
            status:        true,
            requestedRole: true,
            createdAt:     true,
        },
    });

    return (
        <RequestAccessPageClient
            currentRole={user.role}
            currentUserEmail={user.email}
            ownRequests={ownRequests}
        />
    );
}
