"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Plus, Search, FileText, CheckCircle2, Clock, AlertCircle, Sparkles, Award } from "lucide-react";
import { PromotionDialog } from "@/app/employees/[id]/promotion-dialog";
import { generateLetterPDF } from "@/app/lib/utils/letter-generator";
import { getCompanySettings } from "@/app/lib/actions/company-settings";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PromotionRecord {
    id: string;
    promotionType?: string;
    status: string;
    fromTitle?: string | null;
    toTitle?: string | null;
    previousDesignation?: string | null;
    previousDepartment?: string | null;
    previousBasicSalary?: number | null;
    proposedDesignation?: string | null;
    proposedDepartment?: string | null;
    proposedBasicSalary?: number | null;
    effectiveDate: string | Date;
    reason?: string | null;
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
        const destTitle = p.proposedDesignation || p.toTitle || "";
        const matchesSearch =
            p.employee.firstName.toLowerCase().includes(search.toLowerCase()) ||
            p.employee.lastName.toLowerCase().includes(search.toLowerCase()) ||
            destTitle.toLowerCase().includes(search.toLowerCase()) ||
            (p.employee.employeeCode && p.employee.employeeCode.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

    const handleDownloadLetter = async (promo: PromotionRecord) => {
        setDownloadingId(promo.id);
        try {
            const branding = await getCompanySettings().catch(() => ({
                name: "MultiSaaS HRMS",
                address: "Dubai, UAE",
                phone: "+971 4 123 4567",
                email: "hr@company.com",
                website: "https://company.com",
            }));

            const dateStr = new Date(promo.effectiveDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });

            const newTitle = promo.proposedDesignation || promo.toTitle || "Senior Professional";
            const newDept = promo.proposedDepartment ? ` in the ${promo.proposedDepartment} department` : "";

            const letterData = {
                id: promo.id,
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

We are delighted to officially congratulate you on your promotion to the position of ${newTitle}${newDept}, effective ${dateStr}.

This promotion is in recognition of your exceptional performance, dedication, and valued contributions to the organization.

${promo.reason ? `Key remarks: "${promo.reason}".` : ""}
${promo.proposedBasicSalary ? `Your revised basic salary is set to AED ${promo.proposedBasicSalary.toLocaleString()} per month.` : ""}

We have full confidence in your abilities and look forward to your continued leadership and success with the company.

Sincerely,
Management & Human Resources
                `.trim(),
                content_ar: null,
            };

            await generateLetterPDF(letterData, branding as any);
            toast.success("Promotion letter downloaded successfully!");
        } catch (err: any) {
            console.error("Failed to generate PDF:", err);
            toast.error("Failed to generate promotion letter PDF. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPLIED":
                return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px] uppercase">Active / Applied</Badge>;
            case "APPROVED":
                return <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold text-[10px] uppercase">Approved</Badge>;
            case "PENDING_APPROVAL":
            case "PENDING":
                return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] uppercase">Pending</Badge>;
            case "REJECTED":
                return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px] uppercase">Rejected</Badge>;
            default:
                return <Badge variant="outline" className="font-bold text-[10px] uppercase">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-7">
            {/* ── 1. Hero Banner Matching HRMS Design System ── */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 shadow-xl border border-slate-800">
                <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="min-w-0">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-300 backdrop-blur-md">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            Career Progression & Lifecycle
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                            Company Promotions
                        </h1>
                        <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-slate-300 max-w-2xl">
                            Manage employee title upgrades, compensation advancements, and official promotion letters.
                        </p>
                    </div>

                    {selectedEmployee && (
                        <div className="shrink-0 w-full sm:w-auto">
                            <PromotionDialog employee={selectedEmployee} />
                        </div>
                    )}
                </div>
            </section>

            {/* ── 2. Filters & Actions ── */}
            <Card className="rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-1 items-center gap-3 flex-wrap">
                            <div className="relative flex-1 min-w-[14rem] max-w-sm">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by employee name or title..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 h-9 text-xs"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-40 rounded-xl border-slate-200 dark:border-slate-800 h-9 text-xs font-bold">
                                    <SelectValue placeholder="Status filter" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="APPROVED">Approved</SelectItem>
                                    <SelectItem value="APPLIED">Applied</SelectItem>
                                    <SelectItem value="REJECTED">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {employees.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase text-slate-400 whitespace-nowrap">Target:</span>
                                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                    <SelectTrigger className="w-56 rounded-xl border-slate-200 dark:border-slate-800 h-9 text-xs">
                                        <SelectValue placeholder="Choose employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id}>
                                                {emp.firstName} {emp.lastName} ({emp.designation || "Staff"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── 3. Promotions Table ── */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs">
                <Table>
                    <TableHeader className="bg-slate-50/70 dark:bg-slate-850/50">
                        <TableRow className="border-slate-100 dark:border-slate-800">
                            <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Employee</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Previous Role</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Promoted Designation</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Effective Date</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Status</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Reason</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs text-right">Letter</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                                    No promotion records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((p) => {
                                const effective = new Date(p.effectiveDate).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                });
                                const prevTitle = p.previousDesignation || p.fromTitle || "—";
                                const destTitle = p.proposedDesignation || p.toTitle || "Promoted";

                                return (
                                    <TableRow key={p.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                                        <TableCell>
                                            <div className="font-bold text-slate-900 dark:text-white text-xs">
                                                {p.employee.firstName} {p.employee.lastName}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                {p.employee.employeeCode || p.employee.id.slice(0, 8)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            <div>{prevTitle}</div>
                                            <div className="text-[10px] text-slate-400">{p.previousDepartment || "General"}</div>
                                        </TableCell>
                                        <TableCell className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                            <div>{destTitle}</div>
                                            {p.proposedBasicSalary ? (
                                                <div className="text-[10px] text-emerald-600 font-bold">
                                                    AED {p.proposedBasicSalary.toLocaleString()} / mo
                                                </div>
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {effective}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                                        <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                            {p.reason || "Merit advancement"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(p.status === "APPROVED" || p.status === "APPLIED") && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={downloadingId === p.id}
                                                    onClick={() => handleDownloadLetter(p)}
                                                    className="h-8 gap-1.5 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-all"
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
