import SubscriptionPageClient from "./SubscriptionPageClient";
import { requirePageRole } from "@/lib/auth/page-guard";
import { ROLES } from "@/lib/auth/roles";

export const metadata = {
    title: "Subscription Management | HR System",
    description: "Manage subscription plans, billing, and feature access.",
};

export default async function SubscriptionPage() {
    await requirePageRole(ROLES.ADMIN, ROLES.SUPER_ADMIN);

    return (
        <div className="container mx-auto py-8">
            <SubscriptionPageClient />
        </div>
    );
}