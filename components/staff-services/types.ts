export interface EmployeeServiceProfile {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string;
  department: string;
  companyName: string;
  companyId: string | null;
  tenantId: string | null;
  managerName: string | null;
  managerId: string | null;
  email: string;
  phone: string;
  workLocation: string;
  joiningDate: Date | string | null;
  employmentType: string;
  visaStatus?: {
    visaNumber: string | null;
    visaExpiry: Date | string | null;
    daysUntilExpiry: number | null;
  };
  completionPercentage: number;
}

export interface ServiceKpis {
  remainingLeaves: number;
  totalLeaves: number;
  usedLeaves: number;
  presencePct: number;
  lateCount: number;
  netSalary: number | null;
  currency: string;
  pendingRequestsCount: number;
  unreadNotificationsCount: number;
}

export interface UnifiedRequestItem {
  id: string;
  reference: string;
  category: "LEAVE" | "LETTER" | "SERVICE" | "LOAN" | "TRAVEL" | "VISA" | "TRAINING" | "TICKET" | "DATA_CHANGE";
  title: string;
  details: string;
  submissionDate: Date | string;
  currentStage: string;
  status: "DRAFT" | "SUBMITTED" | "MANAGER_APPROVAL" | "DEPARTMENT_APPROVAL" | "HR_REVIEW" | "FINANCE_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  assignedApprover?: string;
  actionRequired?: boolean;
  viewUrl: string;
}

export interface QuickServiceCardDef {
  id: string;
  title: string;
  category: string;
  description: string;
  href: string;
  iconName: string;
  badgeCount?: number;
  isAvailable: boolean;
  requiredModule?: string;
  tag?: string;
}

export interface ManagerViewData {
  teamSize: number;
  teamPresentToday: number;
  pendingLeaveApprovals: number;
  pendingServiceRequests: number;
  pendingLetterApprovals: number;
  pendingTravelApprovals: number;
  teamMembers: Array<{
    id: string;
    name: string;
    code: string;
    designation: string;
    department: string;
    status: string;
  }>;
}

export interface HrViewData {
  totalCompanyEmployees: number;
  pendingHrReviews: number;
  lettersQueueCount: number;
  expiringVisas30Days: number;
  openGrievancesCount: number;
  pendingExitCases: number;
}

export interface CompanyAdminViewData {
  companyName: string;
  tenantName: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  activeModulesCount: number;
  totalModulesCount: number;
  enabledModules: Array<{
    id: string;
    name: string;
    key: string;
    status: string;
  }>;
  seatUsage: {
    used: number;
    max: number;
  };
}

export interface PlatformAdminViewData {
  totalTenants: number;
  activeTenants: number;
  totalCompanies: number;
  totalEmployees: number;
  totalUsers: number;
  totalModulesCount: number;
  aiSpendMonthAed: number;
  activeSupportTickets: number;
  recentTenants: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    planTier: string;
    createdAt: Date | string;
  }>;
}

