"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, CheckCircle2, Clock, XCircle } from "lucide-react";
import { generateLetterPDF } from "@/app/lib/utils/letter-generator";
import { getCompanySettings } from "@/app/lib/actions/company-settings";
import { toast } from "sonner";

interface PromotionItem {
    id: string;
    promotionType: string;
    status: string;
    previousDesignation: string | null;
    previousDepartment: string | null;
    previousBasicSalary: number | null;
    proposedDesignation: string;
    proposedDepartment: string | null;
    proposedBasicSalary: number | null;
    effectiveDate: Date | string;
    reason: string;
    createdAt: Date | string;
    requestedBy?: { name: string | null; email: string };
    approvedBy?: { name: string | null; email: string } | null;
    letterRecordId?: string | null;
}

interface PromotionHistoryProps {
    promotions: PromotionItem[];
    employee: {
        firstName: string;
        lastName: string;
        designation: string | null;
        employeeCode: string | null;
    };
}

export function PromotionHistoryTable({ promotions, employee }: PromotionHistoryProps) {
    const [downloading, setDownloading] = useState<string | null>(null);

    const handleDownloadLetter = async (promo: PromotionItem) => {
        setDownloading(promo.id);
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
                    firstName: employee.firstName,
                    lastName: employee.lastName,
                },
                template: {
                    name: "Promotion & Career Progression Letter",
                    type: "PROMOTION",
                },
                content_en: `
Dear ${employee.firstName} ${employee.lastName},

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
            toast.success("Promotion letter generated successfully!");
        } catch (err: any) {
            console.error("Letter generation error", err);
            toast.error("Failed to generate promotion letter PDF");
        } finally {
            setDownloading(null);
        }
    };

    if (promotions.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <TrendingUp className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">No promotion records found</p>
                <p className="text-xs text-slate-500 mt-1">This employee has no promotion history recorded yet.</p>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPLIED":
                return <Badge className="bg-emerald-600 text-white font-black text-[10px] tracking-wider uppercase">Active / Applied</Badge>;
            case "APPROVED":
                return <Badge className="bg-sky-600 text-white font-black text-[10px] tracking-wider uppercase">Approved (Scheduled)</Badge>;
            case "PENDING_APPROVAL":
                return <Badge className="bg-amber-500 text-white font-black text-[10px] tracking-wider uppercase">Pending Approval</Badge>;
            case "REJECTED":
                return <Badge className="bg-rose-600 text-white font-black text-[10px] tracking-wider uppercase">Rejected</Badge>;
            default:
                return <Badge variant="outline" className="font-black text-[10px] uppercase">{status}</Badge>;
        }
    };

    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Date</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">From</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">To (Promoted)</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reason</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Letter</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {promotions.map((p) => {
                        const effective = new Date(p.effectiveDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        });

                        return (
                            <TableRow key={p.id}>
                                <TableCell className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {effective}
                                </TableCell>
                                <TableCell className="text-xs text-slate-500">
                                    {p.previousDesignation || "—"}
                                </TableCell>
                                <TableCell className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                                    {p.proposedDesignation}
                                    {p.proposedBasicSalary ? (
                                        <span className="block text-[10px] font-normal text-slate-400">
                                            AED {p.proposedBasicSalary.toLocaleString()}
                                        </span>
                                    ) : null}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(p.status)}
                                </TableCell>
                                <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                    {p.reason}
                                </TableCell>
                                <TableCell className="text-right">
                                    {(p.status === "APPROVED" || p.status === "APPLIED") && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadLetter(p)}
                                            disabled={downloading === p.id}
                                            className="h-8 gap-1.5 rounded-xl border-slate-200 text-xs font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                                        >
                                            <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                            {downloading === p.id ? "Generating..." : "Download Letter"}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

