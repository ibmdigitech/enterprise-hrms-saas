import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { scopeTenantWhere } from "@/lib/auth/scope";
import { requireModuleEntitlement } from "@/lib/entitlements/verify";

export async function GET(request: NextRequest) {
  const authResult = await authorizePermission(PERMISSIONS.ATTENDANCE_EXPORT);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const subject = authResult.subject;

  // MODULE ENTITLEMENT: enforce attendance_shifts module entitlement before
  // allowing attendance export.
  if (subject.tenantId) {
    try {
      await requireModuleEntitlement(subject.tenantId, "attendance_shifts");
    } catch {
      return NextResponse.json(
        { error: "Your organization is not entitled to the Attendance module" },
        { status: 403 }
      );
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  if (!monthParam || !yearParam) {
    return NextResponse.json({ error: "Month and year are required" }, { status: 400 });
  }

  const month = parseInt(monthParam);
  const year = parseInt(yearParam);

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "Invalid month or year" }, { status: 400 });
  }

  try {
    // Date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // TENANT-ISOLATION: scope attendance records by tenantId so a tenant's HR
    // cannot export another tenant's attendance data.
    const where: Record<string, unknown> = {
      date: { gte: startDate, lt: endDate },
      ...scopeTenantWhere(subject, {}),
    };

    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true,
          },
        },
      },
      orderBy: [{ employee: { firstName: "asc" } }, { date: "asc" }],
    });

    // Build CSV content
    const headers = [
      "Employee Code",
      "Employee Name",
      "Department",
      "Designation",
      "Date",
      "Check-In",
      "Check-Out",
      "Status",
      "Late Minutes",
      "Overtime Minutes",
      "Hours Worked",
    ];

    const rows = attendanceRecords.map((record) => {
      const emp = record.employee;
      const checkInTime = record.checkIn
        ? new Date(record.checkIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "";
      const checkOutTime = record.checkOut
        ? new Date(record.checkOut).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "";

      let hoursWorked = "";
      if (record.checkIn && record.checkOut) {
        const ms = new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime();
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        hoursWorked = `${hours}:${minutes.toString().padStart(2, "0")}`;
      }

      return [
        emp.employeeCode || "",
        `${emp.firstName} ${emp.lastName}`,
        emp.department,
        emp.designation,
        new Date(record.date).toISOString().split("T")[0],
        checkInTime,
        checkOutTime,
        record.status,
        record.lateMinutes.toString(),
        record.overtimeMinutes.toString(),
        hoursWorked,
      ];
    });

    // Escape CSV values
    const escapeCell = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    // `department` is nullable for a provisional (PRE_JOINING) employee, and a
    // null in a CSV cell reads as an empty field. The escape helper types the
    // value as string, so the null is normalised to "" before it is passed.
    const csvContent =
      headers.map(escapeCell).join(",") +
      "\n" +
      rows
        .map((row) => row.map((cell) => escapeCell(cell ?? "")).join(","))
        .join("\n");

    const monthName = new Date(year, month - 1).toLocaleString("en", { month: "long" });
    const filename = `Attendance_${monthName}_${year}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error("[ATTENDANCE_DOWNLOAD_ERROR]", error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : "Unknown error") || "Failed to generate attendance report" },
      { status: 500 }
    );
  }
}
