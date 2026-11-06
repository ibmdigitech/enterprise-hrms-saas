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
    };
}
