"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export interface TicketSummary {
    openCount: number;
    hasActiveTickets: boolean;
}

export async function getOpenTicketCountAction(): Promise<TicketSummary> {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return { openCount: 0, hasActiveTickets: false };
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true, memberships: { select: { tenantId: true } } },
        });

        if (!user) {
            return { openCount: 0, hasActiveTickets: false };
        }

        const isSuperAdmin = user.role === "SUPER_ADMIN";
        let count = 0;

        if (isSuperAdmin) {
            // Platform admin sees all open/in-progress tickets across all tenants
            count = await prisma.supportTicket.count({
                where: {
                    status: { in: ["OPEN", "IN_PROGRESS", "ESCALATED", "PENDING"] },
                },
            });
        } else {
            // Tenant user sees open tickets in their tenant organization or created by them
            const tenantIds = user.memberships.map((m) => m.tenantId);
            count = await prisma.supportTicket.count({
                where: {
                    OR: [
                        { tenantId: { in: tenantIds }, status: { in: ["OPEN", "IN_PROGRESS", "ESCALATED", "PENDING"] } },
                        { createdById: user.id, status: { in: ["OPEN", "IN_PROGRESS", "ESCALATED", "PENDING"] } },
                    ],
                },
            });
        }

        return {
            openCount: count,
            hasActiveTickets: count > 0,
        };
    } catch {
        return { openCount: 0, hasActiveTickets: false };
    }
}
