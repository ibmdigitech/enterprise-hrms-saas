import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StaffServicesClient } from "@/components/staff-services/StaffServicesClient";
import { 
  buildQuickServiceCards, 
  getUnifiedEmployeeRequests,
  getManagerPerspectiveData,
  getHrPerspectiveData,
  getCompanyAdminPerspectiveData,
  getPlatformAdminPerspectiveData
} from "@/components/staff-services/service-data";
import type { EmployeeServiceProfile, ServiceKpis } from "@/components/staff-services/types";

export const metadata = {
  title: "Staff Services & Employee Hub | HRMS",
  description: "Unified Employee Self-Service, Service Requests, and Role-Based Governance.",
};

export const dynamic = "force-dynamic";

export default async function StaffServicesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      employee: {
        include: {
          company: { select: { id: true, name: true, tenantId: true } },
          manager: { select: { id: true, firstName: true, lastName: true } },
          salaryStructure: true,
          leaveBalances: true,
          attendance: {
            orderBy: { date: "desc" },
            take: 20,
          },
          notifications: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      memberships: {
        include: {
          tenant: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const userRole = (user.role || (session.user as { role?: string })?.role || "STAFF").toUpperCase();
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  // Build employee profile if user is linked to an Employee record
  let profile: EmployeeServiceProfile | null = null;
  let kpis: ServiceKpis | null = null;
  let unifiedRequests: any[] = [];
  let userNotifications: any[] = [];

  const emp = user.employee;
  if (emp) {
    const totalLeaves = emp.leaveBalances.reduce((acc, b) => acc + b.totalDays, 0);
    const usedLeaves = emp.leaveBalances.reduce((acc, b) => acc + b.usedDays, 0);
    const presentRecords = emp.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const presencePct = emp.attendance.length > 0
      ? Math.round((presentRecords / emp.attendance.length) * 100)
      : 100;

    profile = {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      firstName: emp.firstName,
      lastName: emp.lastName,
      employeeCode: emp.employeeCode || emp.rollNumber || "EMP-001",
      designation: emp.designation || "Staff",
      department: emp.department || "General",
      companyName: emp.company?.name || "Corporate Enterprise",
      companyId: emp.companyId || null,
      tenantId: emp.tenantId || null,
      managerName: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null,
      managerId: emp.managerId || null,
      email: emp.email,
      phone: emp.phone || "",
      workLocation: emp.workLocation || "Headquarters",
      joiningDate: emp.joiningDate,
      employmentType: emp.employmentType,
      visaStatus: {
        visaNumber: emp.visaNumber || null,
        visaExpiry: emp.visaExpiry || null,
        daysUntilExpiry: emp.visaExpiry
          ? Math.ceil((new Date(emp.visaExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null,
      },
      completionPercentage: 85,
    };

    kpis = {
      remainingLeaves: totalLeaves - usedLeaves,
      totalLeaves,
      usedLeaves,
      presencePct,
      lateCount: emp.attendance.filter((a) => a.status === "LATE").length,
      netSalary: emp.salaryStructure?.ctc || null,
      currency: "AED",
      pendingRequestsCount: 0,
      unreadNotificationsCount: emp.notifications.filter((n) => !n.isRead).length,
    };

    userNotifications = emp.notifications;
    unifiedRequests = await getUnifiedEmployeeRequests(emp.id);
  }

  // 12 Quick Service Cards mapped to real request counts
  const serviceCards = buildQuickServiceCards({
    leaves: unifiedRequests.filter((r) => r.category === "LEAVE" && ["SUBMITTED", "MANAGER_APPROVAL", "HR_REVIEW"].includes(r.status)).length,
    letters: unifiedRequests.filter((r) => r.category === "LETTER" && ["SUBMITTED", "MANAGER_APPROVAL", "HR_REVIEW"].includes(r.status)).length,
    loans: unifiedRequests.filter((r) => r.category === "LOAN" && ["SUBMITTED", "MANAGER_APPROVAL", "HR_REVIEW", "FINANCE_REVIEW"].includes(r.status)).length,
    services: unifiedRequests.filter((r) => r.category === "SERVICE" && ["SUBMITTED", "MANAGER_APPROVAL", "HR_REVIEW"].includes(r.status)).length,
    travel: unifiedRequests.filter((r) => r.category === "TRAVEL").length,
    trainings: unifiedRequests.filter((r) => r.category === "TRAINING").length,
    tickets: 0,
    visas: unifiedRequests.filter((r) => r.category === "VISA").length,
    documents: 0,
  });

  // Role Perspective Telemetry
  let managerData = null;
  let hrData = null;
  let companyAdminData = null;
  let platformAdminData = null;

  if (userRole === "MANAGER" && emp) {
    managerData = await getManagerPerspectiveData(emp.id).catch(() => null);
  }

  if (userRole === "HR" || userRole === "ADMIN") {
    hrData = await getHrPerspectiveData(emp?.tenantId || user.memberships[0]?.tenantId).catch(() => null);
  }

  if (userRole === "COMPANY_ADMIN") {
    const tenantId = emp?.tenantId || user.memberships[0]?.tenantId;
    if (tenantId) {
      companyAdminData = await getCompanyAdminPerspectiveData(tenantId).catch(() => null);
    }
  }

  if (isSuperAdmin) {
    platformAdminData = await getPlatformAdminPerspectiveData().catch(() => null);
  }

  return (
    <div className="py-6">
      <StaffServicesClient
        userRole={userRole}
        isSuperAdmin={isSuperAdmin}
        profile={profile}
        kpis={kpis}
        quickCards={serviceCards}
        requests={unifiedRequests}
        notifications={userNotifications}
        managerData={managerData}
        hrData={hrData}
        companyAdminData={companyAdminData}
        platformAdminData={platformAdminData}
      />
    </div>
  );
}
