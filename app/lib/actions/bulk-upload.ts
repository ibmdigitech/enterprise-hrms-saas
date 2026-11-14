"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { issueActivationToken } from "@/lib/workflow/credentials";
import * as XLSX from "xlsx";

/**
 * Bulk Employee Import Action
 *
 * Supports CSV and Excel (.xlsx, .xls) files.
 * Correctly assigns tenantId and companyId to both User membership and Employee record.
 * Generates one-time activation tokens for imported users without setting default passwords.
 */

interface ImportRow {
    email: string;
    firstname: string;
    lastname: string;
    rollnumber: string;
    designation?: string;
    department?: string;
    phone?: string;
    joiningdate?: string;
    role?: string;
    basicsalary?: string;
}

export async function uploadMasterFile(formData: FormData) {
    const session = await auth();
    const userRole = (session?.user as { role?: string })?.role?.toUpperCase();

    if (!session || !["ADMIN", "SUPER_ADMIN", "HR", "COMPANY_ADMIN", "HR_MANAGER"].includes(userRole || "")) {
        return { success: false, message: "Unauthorized. You need Admin or HR rights to import staff." };
    }

    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "No file provided" };

    // Resolve tenantId and companyId of the importing admin
    const currentUser = await prisma.user.findUnique({
        where: { email: session.user?.email || "" },
        include: {
            employee: { select: { tenantId: true, companyId: true } },
            memberships: { select: { tenantId: true } },
        },
    });

    const targetTenantId = currentUser?.employee?.tenantId || currentUser?.memberships?.[0]?.tenantId || null;
    const targetCompanyId = currentUser?.employee?.companyId || null;

    if (!targetTenantId) {
        return { success: false, message: "No active tenant organization found for current user session." };
    }

    const fileName = file.name.toLowerCase();
    let rowsData: ImportRow[] = [];

    try {
        if (fileName.endsWith(".csv")) {
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
            if (lines.length < 2) return { success: false, message: "File is empty or missing headers." };

            const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ""));
            const dataLines = lines.slice(1);

            for (const line of dataLines) {
                const values = line.split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
                const rowObj: Record<string, string> = {};
                headers.forEach((h, idx) => {
                    rowObj[h] = values[idx] ?? "";
                });
                rowsData.push({
                    email: rowObj.email || "",
                    firstname: rowObj.firstname || rowObj.first || "",
                    lastname: rowObj.lastname || rowObj.last || "",
                    rollnumber: rowObj.rollnumber || rowObj.employeecode || rowObj.empcode || rowObj.id || "",
                    designation: rowObj.designation || rowObj.title || rowObj.position || "Staff",
                    department: rowObj.department || rowObj.dept || "General",
                    phone: rowObj.phone || rowObj.mobile || "",
                    joiningdate: rowObj.joiningdate || rowObj.hiredate || "",
                    role: rowObj.role || "STAFF",
                    basicsalary: rowObj.basicsalary || rowObj.salary || "0",
                });
            }
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);

            if (!rawJson || rawJson.length === 0) {
                return { success: false, message: "Excel sheet is empty." };
            }

            rowsData = rawJson.map((row) => {
                const normalized: Record<string, string> = {};
                Object.keys(row).forEach((k) => {
                    const cleanKey = k.trim().toLowerCase().replace(/[\s_-]+/g, "");
                    normalized[cleanKey] = String(row[k] ?? "").trim();
                });

                return {
                    email: normalized.email || "",
                    firstname: normalized.firstname || normalized.first || "",
                    lastname: normalized.lastname || normalized.last || "",
                    rollnumber: normalized.rollnumber || normalized.employeecode || normalized.empcode || normalized.id || "",
                    designation: normalized.designation || normalized.title || normalized.position || "Staff",
                    department: normalized.department || normalized.dept || "General",
                    phone: normalized.phone || normalized.mobile || "",
                    joiningdate: normalized.joiningdate || normalized.hiredate || "",
                    role: normalized.role || "STAFF",
                    basicsalary: normalized.basicsalary || normalized.salary || "0",
                };
            });
        } else {
            return { success: false, message: "Unsupported file format. Please upload a .csv, .xlsx, or .xls file." };
        }
    } catch (parseError) {
        return { success: false, message: `Failed to parse file: ${parseError instanceof Error ? parseError.message : "Invalid data"}` };
    }

    if (rowsData.length === 0) {
        return { success: false, message: "No employee rows found in file." };
    }

    const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
    };

    const activatedUserIds: string[] = [];

    for (let i = 0; i < rowsData.length; i++) {
        const row = rowsData[i];
        const rowNum = i + 2;

        if (!row.email || !row.firstname || !row.lastname) {
            results.failed++;
            results.errors.push(`Row ${rowNum}: Email, First Name, and Last Name are required.`);
            continue;
        }

        const finalRollNumber = row.rollnumber || `EMP-${Date.now().toString().slice(-6)}-${i + 1}`;

        try {
            await prisma.$transaction(async (tx) => {
                // Check email collision
                const existingUser = await tx.user.findUnique({ where: { email: row.email } });
                if (existingUser) {
                    throw new Error(`Email "${row.email}" is already registered in the system.`);
                }

                // Check roll number collision
                const existingEmp = await tx.employee.findUnique({ where: { rollNumber: finalRollNumber } });
                if (existingEmp) {
                    throw new Error(`Employee ID "${finalRollNumber}" already exists.`);
                }

                // Create User account
                const user = await tx.user.create({
                    data: {
                        email: row.email,
                        password: null, // Force activation token on first access
                        name: `${row.firstname} ${row.lastname}`.trim(),
                        role: (row.role?.toUpperCase() === "ADMIN" || row.role?.toUpperCase() === "MANAGER") ? row.role.toUpperCase() : "STAFF",
                    },
                });

                // Link tenant membership
                await tx.tenantMembership.create({
                    data: {
                        userId: user.id,
                        tenantId: targetTenantId,
                        role: user.role,
                        status: "ACTIVE",
                    },
                });

                // Create Employee Profile
                await tx.employee.create({
                    data: {
                        userId: user.id,
                        tenantId: targetTenantId,
                        companyId: targetCompanyId,
                        employeeCode: finalRollNumber,
                        rollNumber: finalRollNumber,
                        firstName: row.firstname,
                        lastName: row.lastname,
                        email: row.email,
                        phone: row.phone || null,
                        designation: row.designation || "Staff",
                        department: row.department || "General",
                        joiningDate: row.joiningdate && !isNaN(Date.parse(row.joiningdate)) ? new Date(row.joiningdate) : new Date(),
                        basicSalary: row.basicsalary && !isNaN(parseFloat(row.basicsalary)) ? parseFloat(row.basicsalary) : 0,
                        isActive: true,
                        currentStatus: "ACTIVE",
                        lifecycle: "ACTIVE",
                    },
                });

                activatedUserIds.push(user.id);
            });

            results.success++;
        } catch (rowError) {
            results.failed++;
            results.errors.push(`Row ${rowNum}: ${rowError instanceof Error ? rowError.message : "Database error"}`);
        }
    }

    // Issue activation tokens
    let activationFailed = 0;
    for (const userId of activatedUserIds) {
        try {
            await issueActivationToken({
                userId,
                createdBy: "bulk-upload",
                purpose: "FIRST_LOGIN",
            });
        } catch (tokenError) {
            activationFailed++;
            console.error("[BULK_UPLOAD_ACTIVATION_FAILED]", tokenError);
        }
    }

    revalidatePath("/employees");

    return {
        success: results.failed === 0,
        message: `Processed ${rowsData.length} records. Successfully imported: ${results.success}, Failed: ${results.failed}.` +
            (activationFailed > 0
                ? ` (${activationFailed} activation tokens pending re-issuance)`
                : " One-time onboarding activation links generated for all."),
        errors: results.errors,
    };
}
