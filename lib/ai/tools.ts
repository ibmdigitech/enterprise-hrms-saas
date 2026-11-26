import prisma from "@/lib/prisma";
import { tool } from "ai";
import { z } from "zod";

export interface AIContext {
    userId: string;
    role: string;
    tenantId: string | null;
    employeeId?: string | null;
}

export function getAuthorizedAITools(ctx: AIContext) {
    const isHR = ["SUPER_ADMIN", "ADMIN", "COMPANY_ADMIN", "HR_MANAGER", "HR"].includes(ctx.role);
    const isManager = isHR || ["MANAGER", "DEPARTMENT_MANAGER"].includes(ctx.role);

    return {
        // Tool 1: Self/Team Leave Balance
        getLeaveSummary: tool({
            description: "Check leave entitlements, remaining balances, and recent leave requests for an employee.",
            inputSchema: z.object({
                employeeQuery: z.string().optional().describe("Optional employee name or code if manager/HR is asking for a team member."),
            }),
            execute: async ({ employeeQuery }) => {
                let targetEmployeeId = ctx.employeeId;

                if (employeeQuery && isManager && ctx.tenantId) {
                    const found = await prisma.employee.findFirst({
                        where: {
                            tenantId: ctx.tenantId,
                            OR: [
                                { firstName: { contains: employeeQuery, mode: "insensitive" } },
                                { lastName: { contains: employeeQuery, mode: "insensitive" } },
                                { employeeCode: { contains: employeeQuery, mode: "insensitive" } },
                            ],
                        },
                        select: { id: true, firstName: true, lastName: true, employeeCode: true },
                    });
                    if (found) targetEmployeeId = found.id;
                }

                if (!targetEmployeeId) {
                    return JSON.stringify({ error: "Employee record not found for this user." });
                }

                const [balances, recentRequests] = await Promise.all([
                    prisma.leaveBalance.findMany({
                        where: { employeeId: targetEmployeeId },
                    }),
                    prisma.leaveRequest.findMany({
                        where: { employeeId: targetEmployeeId },
                        orderBy: { createdAt: "desc" },
                        take: 5,
                        select: {
                            type: true,
                            startDate: true,
                            endDate: true,
                            status: true,
                            reason: true,
                        },
                    }),
                ]);

                return JSON.stringify({
                    balances: balances.map((b) => ({
                        year: b.year,
                        leaveType: b.leaveType,
                        totalDays: b.totalDays,
                        usedDays: b.usedDays,
                        remainingDays: b.totalDays - b.usedDays,
                    })),
                    recentRequests: recentRequests.map((r) => ({
                        type: r.type,
                        from: r.startDate.toISOString().split("T")[0],
                        to: r.endDate.toISOString().split("T")[0],
                        status: r.status,
                    })),
                });
            },
        }),

        // Tool 2: Document & Visa Expiries
        getUpcomingExpiries: tool({
            description: "Retrieve upcoming visa, passport, or Emirates ID expiries within the tenant (HR only).",
            inputSchema: z.object({
                daysAhead: z.number().default(60).describe("Window of days to inspect (e.g. 30, 60, 90)"),
            }),
            execute: async ({ daysAhead }) => {
                if (!isHR) {
                    return JSON.stringify({ error: "Access Denied: Only HR and Administrators can inspect organizational expiries." });
                }

                const now = new Date();
                const limitDate = new Date();
                limitDate.setDate(now.getDate() + (daysAhead || 60));

                const whereClause: Record<string, unknown> = {
                    visaExpiry: { lte: limitDate },
                    isActive: true,
                };
                if (ctx.tenantId) {
                    whereClause.tenantId = ctx.tenantId;
                }

                const employeesWithExpiries = await prisma.employee.findMany({
                    where: whereClause,
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        employeeCode: true,
                        designation: true,
                        department: true,
                        visaExpiry: true,
                        emiratesIdExpiry: true,
                        passportExpiry: true,
                    },
                    take: 20,
                    orderBy: { visaExpiry: "asc" },
                });

                return JSON.stringify({
                    totalFound: employeesWithExpiries.length,
                    expiries: employeesWithExpiries.map((emp) => ({
                        name: `${emp.firstName} ${emp.lastName}`,
                        code: emp.employeeCode,
                        designation: emp.designation,
                        department: emp.department,
                        visaExpiry: emp.visaExpiry ? emp.visaExpiry.toISOString().split("T")[0] : null,
                        emiratesIdExpiry: emp.emiratesIdExpiry ? emp.emiratesIdExpiry.toISOString().split("T")[0] : null,
                        passportExpiry: emp.passportExpiry ? emp.passportExpiry.toISOString().split("T")[0] : null,
                    })),
                });
            },
        }),

        // Tool 3: Attendance Exceptions / Summary
        getAttendanceSummary: tool({
            description: "Summarize attendance patterns or identify missing clock-ins (Manager/HR only).",
            inputSchema: z.object({
                department: z.string().optional().describe("Filter by department name"),
            }),
            execute: async ({ department }) => {
                if (!isManager) {
                    return JSON.stringify({ error: "Access Denied: Only Managers and HR can inspect department attendance." });
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const where: Record<string, unknown> = { date: today };
                if (ctx.tenantId) where.tenantId = ctx.tenantId;

                const records = await prisma.attendance.findMany({
                    where,
                    include: {
                        employee: {
                            select: { firstName: true, lastName: true, department: true },
                        },
                    },
                    take: 50,
                });

                const presentCount = records.filter((r) => r.status === "PRESENT").length;
                const absentCount = records.filter((r) => r.status === "ABSENT").length;
                const lateCount = records.filter((r) => r.status === "LATE").length;

                return JSON.stringify({
                    date: today.toISOString().split("T")[0],
                    stats: { present: presentCount, absent: absentCount, late: lateCount },
                    recentRecords: records.slice(0, 10).map((r) => ({
                        employee: `${r.employee.firstName} ${r.employee.lastName}`,
                        department: r.employee.department,
                        status: r.status,
                        checkIn: r.checkIn ? r.checkIn.toISOString().split("T")[1]?.substring(0, 5) : null,
                        checkOut: r.checkOut ? r.checkOut.toISOString().split("T")[1]?.substring(0, 5) : null,
                    })),
                });
            },
        }),

        // Tool 4: Salary & Payslip Inquiries
        getMySalaryOverview: tool({
            description: "Check the current employee's recent salary records, payslips, and compensation breakdown.",
            inputSchema: z.object({
                year: z.number().optional().describe("Year to query, defaults to current or previous year"),
            }),
            execute: async ({ year }) => {
                if (!ctx.employeeId) {
                    return JSON.stringify({ error: "No employee profile linked to current user." });
                }

                const queryYear = year || new Date().getFullYear();
                const records = await prisma.salaryRecord.findMany({
                    where: {
                        employeeId: ctx.employeeId,
                        year: queryYear,
                    },
                    orderBy: [{ year: "desc" }, { month: "desc" }],
                    take: 6,
                });

                if (records.length === 0) {
                    return JSON.stringify({
                        message: `No salary records found for year ${queryYear}.`,
                        records: [],
                    });
                }

                return JSON.stringify({
                    year: queryYear,
                    recordsCount: records.length,
                    latestRecord: {
                        month: records[0].month,
                        year: records[0].year,
                        basic: records[0].basic,
                        allowances: records[0].housingAllowance + records[0].transportAllowance + records[0].medicalAllowance + records[0].otherAllowances,
                        deductions: records[0].penalty + records[0].leaveDeduction + records[0].loanDeduction + records[0].otherDeductions,
                        netSalary: records[0].netSalary,
                    },
                    history: records.map((r) => ({
                        month: r.month,
                        year: r.year,
                        netSalary: r.netSalary,
                        basic: r.basic,
                    })),
                });
            },
        }),

        // Tool 5: Active Loans & Advance Salary Status
        getMyLoansSummary: tool({
            description: "Check active employee loan applications, remaining installments, and salary advances.",
            inputSchema: z.object({}),
            execute: async () => {
                if (!ctx.employeeId) {
                    return JSON.stringify({ error: "No employee profile linked to current user." });
                }

                const loans = await prisma.loanApplication.findMany({
                    where: { employeeId: ctx.employeeId },
                    include: {
                        loanType: { select: { name: true } },
                        installments: {
                            where: { status: "PENDING" },
                            orderBy: [{ year: "asc" }, { month: "asc" }],
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                });

                return JSON.stringify({
                    totalApplications: loans.length,
                    applications: loans.map((l) => ({
                        id: l.id,
                        type: l.loanType?.name || "General Loan",
                        amount: l.requestedAmount,
                        status: l.status,
                        repaymentMonths: l.repaymentMonths,
                        pendingInstallments: l.installments.length,
                        nextDue: l.installments[0]
                            ? `${l.installments[0].year}-${String(l.installments[0].month).padStart(2, "0")} (${l.installments[0].amount} AED)`
                            : null,
                    })),
                });
            },
        }),

        // Tool 6: Training & Skill Development Catalog
        getTrainingCatalog: tool({
            description: "Explore available training courses, upcoming sessions, or enrolled training programs.",
            inputSchema: z.object({
                category: z.string().optional().describe("Filter by category (e.g., Compliance, Safety, Technical)"),
            }),
            execute: async ({ category }) => {
                const where: Record<string, unknown> = { status: "PUBLISHED" };
                if (ctx.tenantId) where.tenantId = ctx.tenantId;
                if (category) where.category = category.toUpperCase();

                const courses = await prisma.trainingCourse.findMany({
                    where,
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        category: true,
                        level: true,
                        durationHours: true,
                        sessions: {
                            where: { status: "SCHEDULED" },
                            select: { id: true, startDate: true, maxParticipants: true },
                            take: 2,
                        },
                    },
                    take: 10,
                });

                return JSON.stringify({
                    totalCourses: courses.length,
                    courses: courses.map((c) => ({
                        id: c.id,
                        title: c.title,
                        category: c.category,
                        level: c.level,
                        durationHours: c.durationHours,
                        upcomingSessions: c.sessions.map((s) => ({
                            id: s.id,
                            startDate: s.startDate.toISOString().split("T")[0],
                            maxParticipants: s.maxParticipants,
                        })),
                    })),
                });
            },
        }),

        // Tool 7: Support & Helpdesk Tickets
        getMySupportTickets: tool({
            description: "Retrieve open or recent support and HR helpdesk tickets for this employee.",
            inputSchema: z.object({
                status: z.string().optional().describe("Filter by status: OPEN, IN_PROGRESS, RESOLVED, CLOSED"),
            }),
            execute: async ({ status }) => {
                const where: Record<string, unknown> = {};
                if (ctx.tenantId) where.tenantId = ctx.tenantId;
                if (status) where.status = status;

                const tickets = await prisma.supportTicket.findMany({
                    where,
                    orderBy: { createdAt: "desc" },
                    take: 6,
                    select: {
                        id: true,
                        subject: true,
                        status: true,
                        priority: true,
                        category: true,
                        createdAt: true,
                    },
                });

                return JSON.stringify({
                    ticketsCount: tickets.length,
                    tickets: tickets.map((t) => ({
                        id: t.id,
                        subject: t.subject,
                        status: t.status,
                        priority: t.priority,
                        category: t.category,
                        created: t.createdAt.toISOString().split("T")[0],
                    })),
                });
            },
        }),
    };
}
