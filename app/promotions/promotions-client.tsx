"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Plus, Search, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { PromotionDialog } from "@/app/employees/[id]/promotion-dialog";
import { generateLetterPDF } from "@/app/lib/utils/letter-generator";
import { getCompanySettings } from "@/app/lib/actions/company-settings";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PromotionRecord {
    id: string;
    promotionType: string;
    status: string;
    previousDesignation: string | null;
    previousDepartment: string | null;
    previousBasicSalary: number | null;
    proposedDesignation: string;
    proposedDepartment: string | null;
    proposedBasicSalary: number | null;
    effectiveDate: string | Date;
    reason: string;
    createdAt: string | Date;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        employeeCode: string | null;
        department: string | null;
        designation: string | null;
    };
    requestedBy?: { name: string | null; email: string };
    approvedBy?: { name: string | null; email: string } | null;
}

interface EmployeeOption {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string | null;
    department: string | null;
    designation: string | null;
    basicSalary: number | null;
    housingAllowance?: number | null;
    transportAllowance?: number | null;
    otherAllowance?: number | null;
}

interface PromotionsClientProps {
    initialPromotions: PromotionRecord[];
    employees: EmployeeOption[];
}

export function PromotionsClient({ initialPromotions, employees }: PromotionsClientProps) {
    const [promotions] = useState<PromotionRecord[]>(initialPromotions);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || "");
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const filtered = promotions.filter((p) => {
        const matchesSearch =
            p.employee.firstName.toLowerCase().includes(search.toLowerCase()) ||
            p.employee.lastName.toLowerCase().includes(search.toLowerCase()) ||
            p.proposedDesignation.toLowerCase().includes(search.toLowerCase()) ||
            (p.employee.employeeCode && p.employee.employeeCode.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

    const handleDownloadLetter = async (promo: PromotionRecord) => {
        setDownloadingId(promo.id);
        try {
            const branding = await getCompanySettings();
            const dateStr = new Date(promo.effectiveDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });

            const letterData = {
                referenceNumber: `PROM-${new Date(promo.createdAt).getFullYear()}-${promo.id.slice(-5).toUpperCase()}`,
                employee: {
                    firstName: promo.employee.firstName,
                    lastName: promo.employee.lastName,
                },
                template: {
                    name: "Promotion & Career Progression Letter",
                    type: "PROMOTION",
                },
                content_en: `
Dear ${promo.employee.firstName} ${promo.employee.lastName},

We are delighted to officially congratulate you on your promotion to the position of ${promo.proposedDesignation}${promo.proposedDepartment ? ` in the ${promo.proposedDepartment} department` : ""}, effective ${dateStr}.

This promotion is in recognition of your exceptional performance, dedication, and valued contributions to the organization.

${promo.reason ? `Key remarks: "${promo.reason}".` : ""}
${promo.proposedBasicSalary ? `Your revised basic salary is set to AED ${promo.proposedBasicSalary.toLocaleString()} per month.` : ""}

We have full confidence in your abilities and look forward to your continued leadership and success with the company.

Sincerely,
Management & Human Resources
                `.trim(),
                content_ar: null,
            };

            await generateLetterPDF(letterData, branding);
            toast.success("Promotion letter downloaded successfully!");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to generate promotion letter PDF");
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPLIED":
                return <Badge className="bg-emerald-600 text-white font-black text-[10px] uppercase">Active / Applied</Badge>;
            case "APPROVED":
                return <Badge className="bg-sky-600 text-white font-black text-[10px] uppercase">Approved (Scheduled)</Badge>;
            case "PENDING_APPROVAL":
                return <Badge className="bg-amber-500 text-white font-black text-[10px] uppercase">Pending Approval</Badge>;
            case "REJECTED":
                return <Badge className="bg-rose-600 text-white font-black text-[10px] uppercase">Rejected</Badge>;
            default:
                return <Badge variant="outline" className="font-black text-[10px] uppercase">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-indigo-600" />
                        Company Promotions
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Manage employee career advancements, title upgrades, compensation adjustments, and letters.
                    </p>
                </div>

                {selectedEmployee && (
                    <PromotionDialog employee={selectedEmployee} />
                )}
            </div>

            {/* Quick Actions & Filters Card */}
            <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 items-center gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by employee name or title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 rounded-xl border-slate-200 h-9 text-xs"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-44 rounded-xl border-slate-200 h-9 text-xs font-bold">
                                    <SelectValue placeholder="Status filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="PENDING_APPROVAL">Pending</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="APPLIED">Applied (Active)</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Select Employee to promote */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-slate-400 whitespace-nowrap">Target:</span>
                            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                <SelectTrigger className="w-56 rounded-xl border-slate-200 h-9 text-xs">
                                    <SelectValue placeholder="Choose employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} ({emp.designation || "N/A"})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Employee</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Previous Role</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Promoted Designation</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Effective Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reason</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Letter</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                                    No promotion records found matching the criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((p) => {
                                const effective = new Date(p.effectiveDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                });

                                return (
                                    <TableRow key={p.id}>
                                        <TableCell>
                                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                                                {p.employee.firstName} {p.employee.lastName}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                {p.employee.employeeCode || p.employee.id.slice(0, 8)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            <div>{p.previousDesignation || "—"}</div>
                                            <div className="text-[10px] text-slate-400">{p.previousDepartment || "General"}</div>
                                        </TableCell>
                                        <TableCell className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                            <div>{p.proposedDesignation}</div>
                                            {p.proposedBasicSalary ? (
                                                <div className="text-[10px] text-emerald-600 font-bold">
                                                    AED {p.proposedBasicSalary.toLocaleString()} / mo
                                                </div>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {effective}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                                        <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                            {p.reason}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(p.status === "APPROVED" || p.status === "APPLIED") && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={downloadingId === p.id}
                                                    onClick={() => handleDownloadLetter(p)}
                                                    className="h-8 gap-1.5 rounded-xl border-slate-200 text-xs font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                                                >
                                                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                                    {downloadingId === p.id ? "Generating..." : "Download Letter"}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

