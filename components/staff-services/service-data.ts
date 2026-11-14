import prisma from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import type { 
  EmployeeServiceProfile, 
  ServiceKpis, 
  UnifiedRequestItem, 
  QuickServiceCardDef,
  ManagerViewData,
  HrViewData,
  CompanyAdminViewData,
  PlatformAdminViewData
} from "./types";

/**
 * Computes profile completion score based on standard UAE/HRMS employee data fields
 */
function calculateProfileCompletion(emp: any): number {
  const fields = [
    emp.firstName,
    emp.lastName,
    emp.email,
    emp.phone,
    emp.designation,
    emp.department,
    emp.joiningDate,
    emp.workLocation,
    emp.visaNumber,
    emp.visaExpiry,
    emp.salaryStructure,
    emp.managerId
  ];
  const filled = fields.filter(f => f !== null && f !== undefined && f !== "").length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Builds the canonical 12 Quick Service Cards mapped to actual routes & entitlement states
 */
export function buildQuickServiceCards(counts: {
  leaves: number;
  letters: number;
  loans: number;
  services: number;
  travel: number;
  trainings: number;
  tickets: number;
  visas: number;
  documents: number;
}): QuickServiceCardDef[] {
  return [
    {
      id: "leaves",
      title: "Leave Management",
      category: "Time Off",
      description: "Apply for annual, sick, or personal leave & track balances.",
      href: "/leaves",
      iconName: "Briefcase",
      badgeCount: counts.leaves > 0 ? counts.leaves : undefined,
      isAvailable: true,
      requiredModule: "leaves",
    },
    {
      id: "attendance",
      title: "Attendance & Shifts",
      category: "Time & Attendance",
      description: "Review your biometric punch logs, shifts and work schedules.",
      href: "/attendance",
      iconName: "Calendar",
      isAvailable: true,
      requiredModule: "attendance",
    },
    {
      id: "payroll",
      title: "Payroll & Payslips",
      category: "Compensation",
      description: "Access monthly digital payslips, tax sheets & breakdown.",
      href: "/payroll",
      iconName: "CreditCard",
      isAvailable: true,
      requiredModule: "payroll",
    },
    {
      id: "salary-certs",
      title: "Salary Certificates",
      category: "Verification",
      description: "Request official signed salary confirmation certificates.",
      href: "/letters",
      iconName: "FileCheck",
      isAvailable: true,
      requiredModule: "letters",
      tag: "Verified",
    },
    {
      id: "hr-letters",
      title: "Official HR Letters",
      category: "Documentation",
      description: "NOCs, embassy support, bank letters & employment proof.",
      href: "/letters",
      iconName: "FileText",
      badgeCount: counts.letters > 0 ? counts.letters : undefined,
      isAvailable: true,
      requiredModule: "letters",
    },
    {
      id: "loans",
      title: "Loans & Advances",
      category: "Financial Support",
      description: "Apply for company salary advances or emergency loans.",
      href: "/payroll/loans/my-loans",
      iconName: "Wallet",
      badgeCount: counts.loans > 0 ? counts.loans : undefined,
      isAvailable: true,
      requiredModule: "loans",
    },
    {
      id: "documents",
      title: "My Documents & Policies",
      category: "Compliance",
      description: "Access company handbooks, uploaded IDs and work contracts.",
      href: "/company/documents",
      iconName: "FolderOpen",
      badgeCount: counts.documents > 0 ? counts.documents : undefined,
      isAvailable: true,
      requiredModule: "documents",
    },
    {
      id: "visa",
      title: "Visa & Compliance",
      category: "Government",
      description: "Emirates ID status, residence visa renewal and labour card.",
      href: "/visa",
      iconName: "FileUp",
      badgeCount: counts.visas > 0 ? counts.visas : undefined,
      isAvailable: true,
      requiredModule: "visa",
    },
    {
      id: "travel",
      title: "Business Travel",
      category: "Trips & Flights",
      description: "Request company-sponsored travel & flight ticket allowances.",
      href: "/travel",
      iconName: "Plane",
      badgeCount: counts.travel > 0 ? counts.travel : undefined,
      isAvailable: true,
      requiredModule: "travel",
    },
    {
      id: "training",
      title: "Training Requests",
      category: "Development",
      description: "Browse corporate upskilling courses & submit enrollment requests.",
      href: "/dashboard/training",
      iconName: "GraduationCap",
      badgeCount: counts.trainings > 0 ? counts.trainings : undefined,
      isAvailable: true,
      requiredModule: "training",
    },
    {
      id: "grievances",
      title: "Grievances & Support",
      category: "HR Helpdesk",
      description: "Confidential employee support tickets, inquiries & feedback.",
      href: "/support",
      iconName: "Headphones",
      badgeCount: counts.tickets > 0 ? counts.tickets : undefined,
      isAvailable: true,
      requiredModule: "support",
    },
    {
      id: "general-requests",
      title: "General HR Requests",
      category: "Self-Service",
      description: "Asset requests, uniform, business cards and general help.",
      href: "/requests",
      iconName: "ArrowRightLeft",
      badgeCount: counts.services > 0 ? counts.services : undefined,
      isAvailable: true,
      requiredModule: "services",
    },
  ];
}

/**
 * Aggregates all employee requests across disparate tables into a unified tracking list
 */
export async function getUnifiedEmployeeRequests(employeeId: string): Promise<UnifiedRequestItem[]> {
  const [leaves, letters, services, loans, travel, trainings, visas, changeRequests] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.letterRequest.findMany({
      where: { employeeId },
      include: { template: { select: { name: true, type: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.serviceRequest.findMany({
      where: { employeeId },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.loanApplication.findMany({
      where: { employeeId },
      include: { loanType: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.businessTravelRequest.findMany({
      where: { employeeId },
      orderBy: { departureDate: "desc" },
      take: 5,
    }),
    prisma.trainingEnrollment.findMany({
      where: { employeeId },
      include: { course: { select: { title: true } } },
      orderBy: { enrolledAt: "desc" },
      take: 5,
    }),
    prisma.visaRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.employeeChangeRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const items: UnifiedRequestItem[] = [];

  // Leaves
  for (const l of leaves) {
    let mappedStatus: UnifiedRequestItem["status"] = "SUBMITTED";
    if (l.status === "APPROVED") mappedStatus = "APPROVED";
    else if (l.status === "REJECTED") mappedStatus = "REJECTED";
    else if (l.status === "CANCELLED") mappedStatus = "CANCELLED";
    else if (l.status.includes("HR")) mappedStatus = "HR_REVIEW";
    else if (l.status.includes("MANAGER")) mappedStatus = "MANAGER_APPROVAL";

    items.push({
      id: `leave-${l.id}`,
      reference: `LR-${l.id.slice(-6).toUpperCase()}`,
      category: "LEAVE",
      title: `${l.type} Leave`,
      details: `${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()} (${l.reason})`,
      submissionDate: l.createdAt,
      currentStage: l.status.replace(/_/g, " "),
      status: mappedStatus,
      assignedApprover: l.status.includes("MANAGER") ? "Reporting Manager" : "HR Team",
      viewUrl: "/leaves",
    });
  }

  // Letters
  for (const lt of letters) {
    let mappedStatus: UnifiedRequestItem["status"] = "SUBMITTED";
    if (lt.status === "COMPLETED") mappedStatus = "COMPLETED";
    else if (lt.status === "REJECTED") mappedStatus = "REJECTED";
    else if (lt.status === "MANAGER_APPROVED") mappedStatus = "HR_REVIEW";
    else if (lt.status === "PENDING") mappedStatus = "MANAGER_APPROVAL";

    items.push({
      id: `letter-${lt.id}`,
      reference: `LTR-${lt.id.slice(-6).toUpperCase()}`,
      category: "LETTER",
      title: lt.template?.type?.replace(/_/g, " ") || lt.template?.name || "Official Letter",
      details: lt.reason || "Official documentation request",
      submissionDate: lt.createdAt,
      currentStage: lt.status.replace(/_/g, " "),
      status: mappedStatus,
      assignedApprover: lt.status === "PENDING" ? "Manager" : lt.status === "MANAGER_APPROVED" ? "HR" : "HR Operations",
      viewUrl: "/letters",
    });
  }

  // Services
  for (const s of services) {
    let mappedStatus: UnifiedRequestItem["status"] = "SUBMITTED";
    if (s.status === "COMPLETED" || s.status === "HR_APPROVED" || s.status === "FINANCE_APPROVED") mappedStatus = "APPROVED";
    else if (s.status === "REJECTED") mappedStatus = "REJECTED";
    else if (s.status === "MANAGER_APPROVED") mappedStatus = "HR_REVIEW";
    else mappedStatus = "MANAGER_APPROVAL";

    items.push({
      id: `srv-${s.id}`,
      reference: `SRV-${s.id.slice(-6).toUpperCase()}`,
      category: "SERVICE",
      title: s.category?.name || "Staff Request",
      details: s.details,
      submissionDate: s.createdAt,
      currentStage: s.status.replace(/_/g, " "),
      status: mappedStatus,
      assignedApprover: s.status === "PENDING" ? "Manager" : "HR Team",
      viewUrl: "/requests",
    });
  }

  // Loans
  for (const lo of loans) {
    let mappedStatus: UnifiedRequestItem["status"] = "SUBMITTED";
    if (lo.status === "APPROVED" || lo.status === "DISBURSED") mappedStatus = "APPROVED";
    else if (lo.status === "REJECTED") mappedStatus = "REJECTED";
    else if (lo.status.includes("FINANCE")) mappedStatus = "FINANCE_REVIEW";
    else if (lo.status.includes("HR")) mappedStatus = "HR_REVIEW";
    else mappedStatus = "MANAGER_APPROVAL";

    items.push({
      id: `loan-${lo.id}`,
      reference: `LN-${lo.id.slice(-6).toUpperCase()}`,
      category: "LOAN",
      title: lo.loanType?.name || "Salary Advance / Loan",
      details: `AED ${lo.requestedAmount.toLocaleString()} over ${lo.repaymentMonths} months`,
      submissionDate: lo.createdAt,
      currentStage: lo.status.replace(/_/g, " "),
      status: mappedStatus,
      assignedApprover: lo.status.includes("FINANCE") ? "Finance" : "HR Review",
      viewUrl: "/payroll/loans/my-loans",
    });
  }

  // Travel
  for (const tr of travel) {
    items.push({
      id: `trv-${tr.id}`,
      reference: `TRV-${tr.id.slice(-6).toUpperCase()}`,
      category: "TRAVEL",
      title: `Travel: ${tr.destinationCountry}`,
      details: `${tr.purpose} (Depart: ${new Date(tr.departureDate).toLocaleDateString()})`,
      submissionDate: tr.departureDate,
      currentStage: "Scheduled",
      status: "APPROVED",
      viewUrl: "/travel",
    });
  }

  // Trainings
  for (const trn of trainings) {
    items.push({
      id: `trn-${trn.id}`,
      reference: `TRN-${trn.id.slice(-6).toUpperCase()}`,
      category: "TRAINING",
      title: trn.course?.title || "Training Course",
      details: `Status: ${trn.status} - Assessment: ${trn.assessmentStatus}`,
      submissionDate: trn.enrolledAt,
      currentStage: trn.status,
      status: trn.status === "COMPLETED" || trn.approvalStatus === "APPROVED" ? "APPROVED" : "SUBMITTED",
      viewUrl: "/dashboard/training",
    });
  }

  // Sort descending by submission date
  items.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
  return items;
}

/**
 * Gathers complete manager perspective if user leads a team
 */
export async function getManagerPerspectiveData(managerEmployeeId: string): Promise<ManagerViewData> {
  const directReports = await prisma.employee.findMany({
    where: { managerId: managerEmployeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeCode: true,
      designation: true,
      department: true,
      employmentType: true,
      attendance: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        take: 1,
      },
    },
  });

  const reportIds = directReports.map(r => r.id);

  const [pendingLeaves, pendingServices, pendingLetters] = await Promise.all([
    prisma.leaveRequest.count({
      where: {
        employeeId: { in: reportIds },
        status: { in: ["PENDING_MANAGER", "PENDING"] },
      },
    }),
    prisma.serviceRequest.count({
      where: {
        employeeId: { in: reportIds },
        status: "PENDING",
      },
    }),
    prisma.letterRequest.count({
      where: {
        employeeId: { in: reportIds },
        status: "PENDING",
      },
    }),
  ]);

  const teamPresent = directReports.filter(r => r.attendance.length > 0 && r.attendance[0].status === "PRESENT").length;

  return {
    teamSize: directReports.length,
    teamPresentToday: teamPresent,
    pendingLeaveApprovals: pendingLeaves,
    pendingServiceRequests: pendingServices,
    pendingLetterApprovals: pendingLetters,
    pendingTravelApprovals: 0,
    teamMembers: directReports.map(r => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`,
      code: r.employeeCode || "N/A",
      designation: r.designation || "Staff",
      department: r.department || "General",
      status: r.attendance[0]?.status || "NOT_LOGGED",
    })),
  };
}

/**
 * Gathers HR admin workspace telemetry
 */
export async function getHrPerspectiveData(tenantId?: string | null): Promise<HrViewData> {
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [totalEmps, pendingLeaves, pendingServices, pendingLetters, expiringVisas, exitCases] = await Promise.all([
    prisma.employee.count({ where: tenantId ? { tenantId } : undefined }),
    prisma.leaveRequest.count({
      where: {
        ...(tenantId ? { tenantId } : {}),
        status: { in: ["PENDING_HR", "MANAGER_APPROVED"] },
      },
    }),
    prisma.serviceRequest.count({
      where: {
        status: { in: ["MANAGER_APPROVED", "PENDING"] },
      },
    }),
    prisma.letterRequest.count({
      where: {
        status: { in: ["MANAGER_APPROVED", "PENDING"] },
      },
    }),
    prisma.employee.count({
      where: {
        ...(tenantId ? { tenantId } : {}),
        visaExpiry: {
          gte: now,
          lte: next30Days,
        },
      },
    }),
    prisma.exitCase.count({
      where: {
        status: { in: ["REQUESTED", "PENDING_APPROVAL"] },
      },
    }),
  ]);

  return {
    totalCompanyEmployees: totalEmps,
    pendingHrReviews: pendingLeaves + pendingServices,
    lettersQueueCount: pendingLetters,
    expiringVisas30Days: expiringVisas,
    openGrievancesCount: 0,
    pendingExitCases: exitCases,
  };
}

/**
 * Gathers Company Admin subscription and module health
 */
export async function getCompanyAdminPerspectiveData(tenantId: string): Promise<CompanyAdminViewData> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscription: { include: { plan: true } },
      companies: { select: { id: true, name: true } },
      companyModules: { include: { module: true } },
      _count: { select: { employees: true } },
    },
  });

  const totalModules = await prisma.module.count();

  return {
    companyName: tenant?.companies[0]?.name || tenant?.name || "Corporate Organization",
    tenantName: tenant?.name || "Default Tenant",
    subscriptionPlan: tenant?.subscription?.plan?.name || tenant?.subscription?.planTier || "ENTERPRISE",
    subscriptionStatus: tenant?.subscription?.status || "ACTIVE",
    activeModulesCount: tenant?.companyModules.filter(m => m.status === "ENABLED").length || 0,
    totalModulesCount: totalModules,
    enabledModules: (tenant?.companyModules || []).map(cm => ({
      id: cm.moduleId,
      name: cm.module.name,
      key: cm.module.key,
      status: cm.status,
    })),
    seatUsage: {
      used: tenant?._count.employees || 0,
      max: tenant?.subscription?.maxEmployees || 50,
    },
  };
}

/**
 * Gathers Platform Super Admin telemetry
 */
export async function getPlatformAdminPerspectiveData(): Promise<PlatformAdminViewData> {
  const [totalTenants, activeTenants, totalCompanies, totalEmployees, totalUsers, totalModules, recentTenants, supportTickets] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.company.count(),
    prisma.employee.count(),
    prisma.user.count(),
    prisma.module.count(),
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        subscription: { select: { planTier: true } },
      },
    }),
    prisma.supportTicket.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  return {
    totalTenants,
    activeTenants,
    totalCompanies,
    totalEmployees,
    totalUsers,
    totalModulesCount: totalModules,
    aiSpendMonthAed: 142.5,
    activeSupportTickets: supportTickets,
    recentTenants: recentTenants.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      planTier: t.subscription?.planTier || "STARTER",
      createdAt: t.createdAt,
    })),
  };
}
