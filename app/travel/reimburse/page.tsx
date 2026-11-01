import { requirePageUser } from "@/lib/auth/page-guard";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { scopeEmployeeWhere } from "@/lib/auth/scope";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/prisma/generated/client";
import { TravelReimbursementForm } from "@/components/travel/TravelReimbursementForm";

export const dynamic = "force-dynamic";

export default async function TravelReimbursementPage() {
    const { user, subject } = await requirePageUser();

    const canRequestForOthers = hasPermission(user.role, PERMISSIONS.TRAVEL_REQUEST_ANY);

    const employees = canRequestForOthers
        ? await prisma.employee.findMany({
              where: { isActive: true, deletedAt: null },
              select: { id: true, firstName: true, lastName: true, employeeCode: true },
              orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          })
        : [];

    return (
        <main className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
            <h1 className="text-2xl font-bold">Travel Reimbursement</h1>
            <p className="text-slate-600 dark:text-slate-300">
                Submit your completed travel with boarding passes, tickets, and receipts for reimbursement.
            </p>

            <TravelReimbursementForm
                employees={employees}
                ownEmployeeId={user.employeeId}
                canRequestForOthers={canRequestForOthers}
                isReimbursement={true}
            />
        </main>
    );
}