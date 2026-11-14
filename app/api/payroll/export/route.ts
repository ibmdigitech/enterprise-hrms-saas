import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorizePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { requireModuleEntitlement } from "@/lib/entitlements/verify";
import type { SalaryRecord, Employee } from "@/prisma/generated/client";
import { generateBatchPaySlipsBuffer, type PaySlipData } from "@/lib/pdf/generate";

/**
 * The row shape the export query actually returns: a SalaryRecord joined to
 * its Employee. Typed so the CSV, Excel and WPS generators below cannot drift
 * from the query that feeds them.
 */
type SALARY_EXPORT_ROW = SalaryRecord & { employee: Employee };

export async function GET(request: NextRequest) {
    try {
        const authResult = await authorizePermission(PERMISSIONS.PAYROLL_EXPORT);
        if (!authResult.ok) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const subject = authResult.subject;

        // MODULE ENTITLEMENT: enforce payroll_wps module entitlement before
        // allowing payroll export. CompanyModule is the single source of truth.
        if (subject.tenantId) {
            try {
                await requireModuleEntitlement(subject.tenantId, "payroll_wps");
            } catch {
                return NextResponse.json(
                    { error: "Your organization is not entitled to the Payroll module" },
                    { status: 403 }
                );
            }
        }

        const { searchParams } = new URL(request.url);
        const month = parseInt(searchParams.get("month") || "");
        const year = parseInt(searchParams.get("year") || "");
        const format = searchParams.get("format") || "csv";

        if (!month || !year || month < 1 || month > 12) {
            return NextResponse.json(
                { error: "Valid month and year are required" },
                { status: 400 }
            );
        }

        // TENANT-ISOLATION: scope salary records by tenantId through employee relation
        const where: Record<string, unknown> = { month, year };
        if (subject.tenantId) {
            where.employee = { tenantId: subject.tenantId };
        }

        const salaryRecords = await prisma.salaryRecord.findMany({
            where,
            include: {
                employee: true,
            },
            orderBy: { employee: { firstName: "asc" } },
        });

        if (salaryRecords.length === 0) {
            return NextResponse.json(
                { error: "No salary records found for the specified period" },
                { status: 404 }
            );
        }

        const monthName = new Date(year, month - 1).toLocaleString("default", {
            month: "long",
        });

        switch (format) {
            case "csv":
                return generateCSV(salaryRecords, monthName, year);
            case "excel":
                return generateExcel(salaryRecords, monthName, year);
            case "wps":
                return generateWPS(salaryRecords, monthName, year, month);
            case "pdf":
                return await generatePDF(salaryRecords, monthName, year, month);
            default:
                return NextResponse.json(
                    { error: "Invalid format. Use csv, excel, wps, or pdf" },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

function generateCSV(records: SALARY_EXPORT_ROW[], monthName: string, year: number) {
    const headers = [
        "Employee Code",
        "Employee Name",
        "Department",
        "Basic",
        "Housing",
        "Transport",
        "Medical",
        "Food",
        "Travel",
        "Commission",
        "Other Allowances",
        "Overtime",
        "Bonus",
        "Late Penalty",
        "Penalty",
        "Leave Deduction",
        "Loan Deduction",
        "Advance Salary",
        "Other Deductions",
        "Net Salary",
        "Payment Method",
        "Status",
    ];

    const rows = records.map((r) => [
        r.employee.employeeCode || r.employee.rollNumber || "",
        `${r.employee.firstName} ${r.employee.lastName}`,
        r.employee.department || "",
        r.basic.toFixed(2),
        r.housingAllowance.toFixed(2),
        r.transportAllowance.toFixed(2),
        r.medicalAllowance.toFixed(2),
        r.foodAllowance.toFixed(2),
        r.travelAllowance.toFixed(2),
        r.commission.toFixed(2),
        r.otherAllowances.toFixed(2),
        r.overtimePay.toFixed(2),
        r.bonus.toFixed(2),
        r.latePenalty.toFixed(2),
        r.penalty.toFixed(2),
        r.leaveDeduction.toFixed(2),
        r.loanDeduction.toFixed(2),
        r.advanceSalary.toFixed(2),
        r.otherDeductions.toFixed(2),
        r.netSalary.toFixed(2),
        r.paymentMethod || "BANK_TRANSFER",
        r.status || "DRAFT",
    ]);

    // Escape CSV values
    const escapeCSV = (val: string) => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    };

    const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const filename = `Payroll_${monthName}_${year}.csv`;

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}

function generateExcel(records: SALARY_EXPORT_ROW[], monthName: string, year: number) {
    const headers = [
        "Employee Code",
        "Employee Name",
        "Department",
        "Basic",
        "Housing",
        "Transport",
        "Medical",
        "Food",
        "Travel",
        "Commission",
        "Other Allowances",
        "Overtime",
        "Bonus",
        "Late Penalty",
        "Penalty",
        "Leave Deduction",
        "Loan Deduction",
        "Advance Salary",
        "Other Deductions",
        "Net Salary",
        "Payment Method",
        "Status",
    ];

    const rows = records.map((r) => [
        r.employee.employeeCode || r.employee.rollNumber || "",
        `${r.employee.firstName} ${r.employee.lastName}`,
        r.employee.department || "",
        r.basic.toFixed(2),
        r.housingAllowance.toFixed(2),
        r.transportAllowance.toFixed(2),
        r.medicalAllowance.toFixed(2),
        r.foodAllowance.toFixed(2),
        r.travelAllowance.toFixed(2),
        r.commission.toFixed(2),
        r.otherAllowances.toFixed(2),
        r.overtimePay.toFixed(2),
        r.bonus.toFixed(2),
        r.latePenalty.toFixed(2),
        r.penalty.toFixed(2),
        r.leaveDeduction.toFixed(2),
        r.loanDeduction.toFixed(2),
        r.advanceSalary.toFixed(2),
        r.otherDeductions.toFixed(2),
        r.netSalary.toFixed(2),
        r.paymentMethod || "BANK_TRANSFER",
        r.status || "DRAFT",
    ]);

    const tsvContent = [
        headers.join("\t"),
        ...rows.map((row) => row.join("\t")),
    ].join("\r\n");

    const filename = `Payroll_${monthName}_${year}.xlsx`;

    return new NextResponse(tsvContent, {
        headers: {
            "Content-Type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}

function generateWPS(
    records: SALARY_EXPORT_ROW[],
    monthName: string,
    year: number,
    month: number
) {
    // UAE WPS (Wage Protection System) SIF File Format
    // Reference: UAE Ministry of Labour Standard SIF Format

    const EMPLOYER_EID = "7001234567890"; // Employer MOL Establishment ID (placeholder)
    const EMPLOYER_BANK_CODE = "ENBD"; // Employer routing code (placeholder)
    const EMPLOYER_BANK_SHORT = "044"; // Employer bank short code
    const SALARY_MONTH = `${year}${month.toString().padStart(2, "0")}`;
    const TOTAL_SALARY = records
        .reduce((sum, r) => sum + r.netSalary, 0)
        .toFixed(2);

    // EDR - Employer Data Record (Header)
    const edrFields = [
        "EDR", // Record type
        EMPLOYER_EID, // Employer MOL Establishment ID
        EMPLOYER_BANK_CODE, // Employer Bank Routing Code
        SALARY_MONTH, // Salary month (YYYYMM)
        records.length.toString().padStart(6, "0"), // Total salary records count
        TOTAL_SALARY, // Total salaries amount
        "AED", // Currency
        new Date().toISOString().split("T")[0].replace(/-/g, ""), // File creation date
        EMPLOYER_BANK_SHORT, // Employer bank short name
    ];

    const edrLine = edrFields.join(",");

    // SDR - Salary Detail Records (one per employee)
    const sdrLines = records.map((r, index) => {
        const employeeId =
            r.employee.employeeCode || r.employee.rollNumber || `EMP${index + 1}`;
        const employeeName =
            `${r.employee.firstName} ${r.employee.lastName}`.toUpperCase();
        const bankCode = getBankCode(r.employee.bankName || "");
        const accountNumber = r.employee.accountNumber || "";
        const iban = r.employee.iban || "";
        const netSalary = r.netSalary.toFixed(2);

        // Calculate components for WPS breakdown
        const fixedComponent = (
            r.basic +
            r.housingAllowance +
            r.transportAllowance +
            r.medicalAllowance +
            r.foodAllowance +
            r.travelAllowance
        ).toFixed(2);
        const variableComponent = (
            r.commission +
            r.otherAllowances +
            r.overtimePay +
            r.bonus
        ).toFixed(2);
        const totalDeductions = (
            r.latePenalty +
            r.penalty +
            r.leaveDeduction +
            r.loanDeduction +
            r.advanceSalary +
            r.otherDeductions
        ).toFixed(2);
        const leaveDays = "0"; // Placeholder

        const sdrFields = [
            "SDR", // Record type
            employeeId, // Employee Reference / MOL ID
            employeeName, // Employee Name
            bankCode, // Employee Bank Short Code
            accountNumber, // Employee Account Number
            iban, // IBAN
            SALARY_MONTH, // Salary month
            netSalary, // Net Salary
            fixedComponent, // Fixed component
            variableComponent, // Variable component
            totalDeductions, // Total deductions
            leaveDays, // Leave days
            "AED", // Currency
        ];

        return sdrFields.join(",");
    });

    // SCR - Summary/Control Record (Footer)
    const scrFields = [
        "SCR", // Record type
        records.length.toString().padStart(6, "0"), // Total records
        TOTAL_SALARY, // Total net salary
        "AED", // Currency
    ];
    const scrLine = scrFields.join(",");

    const sifContent = [edrLine, ...sdrLines, scrLine].join("\r\n");
    const filename = `WPS_SIF_${monthName}_${year}.sif`;

    return new NextResponse(sifContent, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
        },
    });
}

function getBankCode(bankName: string): string {
    const bankMap: Record<string, string> = {
        "Emirates NBD": "ENBD",
        ENBD: "ENBD",
        "Abu Dhabi Commercial Bank": "ADCB",
        ADCB: "ADCB",
        "First Abu Dhabi Bank": "FAB",
        FAB: "FAB",
        "Dubai Islamic Bank": "DIB",
        DIB: "DIB",
        "Mashreq Bank": "MSHQ",
        Mashreq: "MSHQ",
        "RAKBANK": "RAKB",
        "Commercial Bank of Dubai": "CBD",
        CBD: "CBD",
        "National Bank of Fujairah": "NBF",
        "Sharjah Islamic Bank": "SIB",
        "Al Hilal Bank": "AHB",
    };

    const normalizedName = bankName.trim();
    return bankMap[normalizedName] || normalizedName.substring(0, 4).toUpperCase() || "UNKN";
}


async function generatePDF(
    records: SALARY_EXPORT_ROW[],
    monthName: string,
    year: number,
    month: number
) {
    const period = `${month}/${year}`;
    const payslipItems: PaySlipData[] = records.map((record) => {
        const otherAllowances =
            record.medicalAllowance +
            record.foodAllowance +
            record.travelAllowance +
            record.commission +
            record.otherAllowances;

        const gross =
            record.basic +
            record.housingAllowance +
            record.transportAllowance +
            otherAllowances +
            record.overtimePay +
            record.bonus;

        const latePenaltyTotal = record.latePenalty + record.penalty;
        const otherDeductionsTotal = record.advanceSalary + record.otherDeductions;
        const deductions =
            latePenaltyTotal +
            record.leaveDeduction +
            record.loanDeduction +
            otherDeductionsTotal;

        return {
            employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
            employeeId: record.employeeId,
            employeeCode: record.employee.employeeCode ?? undefined,
            designation: record.employee.designation ?? undefined,
            department: record.employee.department ?? undefined,
            period,
            basic: record.basic,
            housing: record.housingAllowance,
            transport: record.transportAllowance,
            overtime: record.overtimePay,
            bonus: record.bonus,
            otherAllowances,
            gross,
            latePenalty: latePenaltyTotal,
            leaveDeductions: record.leaveDeduction,
            loanDeduction: record.loanDeduction,
            otherDeductions: otherDeductionsTotal,
            deductions,
            net: record.netSalary,
        };
    });

    const pdfBytes = await generateBatchPaySlipsBuffer(payslipItems);
    const filename = `payroll_payslips_${monthName}_${year}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": pdfBytes.length.toString(),
        },
    });
}
