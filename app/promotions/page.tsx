import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getAllPromotions, getEmployeesForPromotion } from "@/app/lib/actions/promotions";
import { PromotionsClient } from "./promotions-client";

export const metadata = {
    title: "Employee Promotions | HRMS",
    description: "Manage employee career progressions, title advancements, and promotion letters",
};

export default async function PromotionsPage() {
    await requirePagePermission(PERMISSIONS.EMPLOYEE_PROMOTION_VIEW);

    const [promotions, employees] = await Promise.all([
        getAllPromotions(),
        getEmployeesForPromotion(),
    ]);

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <PromotionsClient initialPromotions={promotions as any} employees={employees} />
        </div>
    );
}

