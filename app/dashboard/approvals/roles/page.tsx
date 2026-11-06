import prisma from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth/page-guard";
import { ROLES } from "@/lib/auth/roles";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { auth } from "@/auth";
import { AccessApprovalClient } from "./access-approval-client";

export const dynamic = "force-dynamic";

export default async function RoleApprovalsPage() {
    await requirePageRole(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER);

    const session = await auth();
    const actorEmail = session?.user?.email ?? "";

    // Fetch all role requests (not just pending) so we can show history
    const allRequests = await prisma.roleRequest.findMany({
        include: {
            user: {
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            employeeCode: true,
                            designation: true,
                            department: true,
                            tenantId: true,
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 300,
    });

    // Fetch all users for the access review tab
    const allUsers = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    designation: true,
                    department: true,
                    isActive: true,
                    tenantId: true,
                }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 500,
    });

    // Compute stats
    const stats = {
        pending:  allRequests.filter(r => r.status === "PENDING").length,
        approved: allRequests.filter(r => r.status === "APPROVED").length,
        rejected: allRequests.filter(r => r.status === "REJECTED").length,
        total:    allRequests.length,
        totalUsers: allUsers.length,
    };

    return (
        <AccessApprovalClient
            allRequests={allRequests as never}
            allUsers={allUsers as never}
            stats={stats}
            actorEmail={actorEmail}
        />
    );
}
