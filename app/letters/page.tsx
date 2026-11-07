import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { requirePageAnyPermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { 
  getEmployeeProfileForLetter, 
  getLetterRequestsAction 
} from "@/app/lib/actions/letter-requests";
import { getCompanySettings } from "@/app/lib/actions/company-settings";
import { LettersHubClient } from "@/components/letters/LettersHubClient";

export const metadata = {
  title: "Official Letters & Certificates | HR Portal",
  description: "Secure Employee Letter Request & Departmental Approval Workflow.",
};

export const dynamic = "force-dynamic";

export default async function LettersPage() {
  await requirePageAnyPermission([PERMISSIONS.LETTER_VIEW]);

  const session = await auth();
  if (!session) redirect("/login");

  const userRole = (session.user as { role?: string })?.role || "STAFF";

  const [employeeProfile, myRequests, teamRequests, allRequests, companySettings] = await Promise.all([
    getEmployeeProfileForLetter().catch(() => null),
    getLetterRequestsAction("my").catch(() => []),
    getLetterRequestsAction("team").catch(() => []),
    getLetterRequestsAction("hr").catch(() => []),
    getCompanySettings().catch(() => null),
  ]);

  return (
    <div className="container mx-auto py-8">
      <LettersHubClient
        userRole={userRole}
        employeeProfile={employeeProfile}
        initialRequests={myRequests}
        teamRequests={teamRequests}
        allRequests={allRequests}
        companySettings={companySettings}
      />
    </div>
  );
}
