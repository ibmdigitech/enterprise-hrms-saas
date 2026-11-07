"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface Props {
    record: any;
}

export function DownloadPDFButton({ record }: Props) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);

        try {
            // 1. Request official vector PDF from server-side PDF generator
            const res = await fetch("/api/pdf/payslip", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ salaryRecordId: record.id }),
            });

            if (res.ok) {
                const data = await res.json();
                const rawUrl = data.pdfUrl || "";
                const filename = rawUrl.split("/").pop() || `payslip-${record.employee?.employeeCode || record.id}.pdf`;

                // Trigger direct file download from the authenticated download endpoint
                const downloadUrl = `/api/pdf/download?file=${encodeURIComponent(filename)}&download=true`;
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setLoading(false);
                return;
            }
        } catch {
            // Fall back to clean single-page client-side printout if offline or API error
        }

        // 2. Client-side fallback: strictly single-page, clean A4 print
        fallbackSinglePagePrint(record);
        setLoading(false);
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold transition-all duration-200 hover:scale-105"
            onClick={handleDownload}
            disabled={loading}
            title="Download Official PDF Payslip"
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            PDF
        </Button>
    );
}

/** Strictly isolated single-page print fallback without nested HTML documents */
function fallbackSinglePagePrint(record: any) {
    const emp = record.employee || {};
    const monthName = new Date(record.year, record.month - 1).toLocaleString("default", { month: "long" });

    const earnings = [
        { label: "Basic Salary", amount: record.basic || 0 },
        { label: "Housing Allowance", amount: record.housingAllowance || 0 },
        { label: "Transport Allowance", amount: record.transportAllowance || 0 },
        { label: "Medical Allowance", amount: record.medicalAllowance || 0 },
        { label: "Food Allowance", amount: record.foodAllowance || 0 },
        { label: "Travel Allowance", amount: record.travelAllowance || 0 },
        { label: "Commission", amount: record.commission || 0 },
        { label: "Other Allowances", amount: record.otherAllowances || 0 },
        { label: "Overtime Pay", amount: record.overtimePay || 0 },
        { label: "Bonus", amount: record.bonus || 0 },
    ].filter((e) => e.amount > 0);

    const deductions = [
        { label: "Late Penalty", amount: record.latePenalty || 0 },
        { label: "Penalty", amount: record.penalty || 0 },
        { label: "Leave Deduction", amount: record.leaveDeduction || 0 },
        { label: "Loan Deduction", amount: record.loanDeduction || 0 },
        { label: "Advance Salary", amount: record.advanceSalary || 0 },
        { label: "Other Deductions", amount: record.otherDeductions || 0 },
    ].filter((d) => d.amount > 0);

    const fmt = (n: number) => n.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netSalary = record.netSalary || 0;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payslip - ${emp.firstName || ""} ${emp.lastName || ""} - ${monthName} ${record.year}</title>
    <style>
        @page { size: A4 portrait; margin: 12mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background: white; color: #0f172a; padding: 10px; font-size: 12px; }
        .page { max-width: 750px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; page-break-inside: avoid; break-inside: avoid; }
        .header { background: #0f172a; color: white; padding: 24px; }
        .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .header p { font-size: 11px; opacity: 0.75; }
        .emp-box { background: #f8fafc; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
        .emp-box strong { color: #334155; }
        .table-wrap { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e2e8f0; }
        .col { padding: 16px 24px; }
        .col:first-child { border-right: 1px solid #e2e8f0; }
        .col h3 { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .item-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f1f5f9; font-size: 11px; }
        .net-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
        .net-title { font-size: 13px; font-weight: 700; color: #166534; }
        .net-amount { font-size: 18px; font-weight: 800; color: #15803d; }
        .footer { padding: 16px 24px; font-size: 10px; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <h1>SALARY STATEMENT</h1>
            <p>Pay Period: ${monthName} ${record.year} &bull; Confidential</p>
        </div>
        <div class="emp-box">
            <div><strong>Employee:</strong> ${emp.firstName || ""} ${emp.lastName || ""}</div>
            <div><strong>Employee ID:</strong> ${emp.employeeCode || emp.id || "N/A"}</div>
            <div><strong>Department:</strong> ${emp.department || "General"}</div>
            <div><strong>Designation:</strong> ${emp.designation || "Staff"}</div>
        </div>
        <div class="table-wrap">
            <div class="col">
                <h3>Earnings</h3>
                ${earnings.map((e) => `<div class="item-row"><span>${e.label}</span><strong>AED ${fmt(e.amount)}</strong></div>`).join("")}
                <div class="item-row" style="margin-top:8px;font-weight:700;border-top:1px solid #cbd5e1;"><span>Total Gross</span><span>AED ${fmt(totalEarnings)}</span></div>
            </div>
            <div class="col">
                <h3>Deductions</h3>
                ${deductions.length ? deductions.map((d) => `<div class="item-row"><span>${d.label}</span><strong style="color:#dc2626;">AED ${fmt(d.amount)}</strong></div>`).join("") : '<div class="item-row"><span>No deductions</span><span>AED 0.00</span></div>'}
                <div class="item-row" style="margin-top:8px;font-weight:700;border-top:1px solid #cbd5e1;"><span>Total Deductions</span><span style="color:#dc2626;">AED ${fmt(totalDeductions)}</span></div>
            </div>
        </div>
        <div class="net-box">
            <span class="net-title">NET TAKE-HOME SALARY</span>
            <span class="net-amount">AED ${fmt(netSalary)}</span>
        </div>
        <div class="footer">
            Generated by HRMS Payroll System &bull; Official Digital Record
        </div>
    </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 300);
    }
}
