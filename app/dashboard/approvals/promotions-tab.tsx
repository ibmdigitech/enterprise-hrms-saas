"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { approvePromotionRequest, rejectPromotionRequest } from "@/app/lib/actions/promotions";
import { toast } from "sonner";
import { CheckCircle2, XCircle, TrendingUp, Clock, AlertCircle, Loader2 } from "lucide-react";

interface PromotionRow {
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
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        employeeCode: string | null;
        department: string | null;
        designation: string | null;
    };
    requestedBy: {
        name: string | null;
        email: string;
    };
}

interface PromotionsTabProps {
    requests: PromotionRow[];
}

export function PromotionsTab({ requests }: PromotionsTabProps) {
    const [items, setItems] = useState<PromotionRow[]>(requests);
    const [busyId, setBusyId] = useState<string | null>(null);

    // Reject Modal
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const handleApprove = async (id: string) => {
        setBusyId(id);
        try {
            const res = await approvePromotionRequest(id);
            if (res.success) {
                toast.success(res.message || "Promotion approved successfully");
                setItems((prev) => prev.filter((r) => r.id !== id));
            } else {
                toast.error(res.error || "Approval failed");
            }
        } catch (err: any) {
            toast.error(err.message || "Approval action failed");
        } finally {
            setBusyId(null);
        }
    };

    const handleReject = async () => {
        if (!rejectingId) return;
        setBusyId(rejectingId);
        try {
            const res = await rejectPromotionRequest(rejectingId, rejectReason);
            if (res.success) {
                toast.success(res.message || "Promotion rejected");
                setItems((prev) => prev.filter((r) => r.id !== rejectingId));
                setRejectingId(null);
                setRejectReason("");
            } else {
                toast.error(res.error || "Rejection failed");
            }
        } catch (err: any) {
            toast.error(err.message || "Rejection action failed");
        } finally {
            setBusyId(null);
        }
    };

    if (items.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
                    <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    No Pending Promotions
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                    All employee career progression requests have been reviewed and decided.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Employee</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Role</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Proposed Promotion</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Effective Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reason / Requester</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((promo) => {
                            const effective = new Date(promo.effectiveDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            });

                            const isBusy = busyId === promo.id;

                            return (
                                <TableRow key={promo.id}>
                                    <TableCell>
                                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                                            {promo.employee.firstName} {promo.employee.lastName}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            {promo.employee.employeeCode || promo.employee.id.slice(0, 8)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500">
                                        <div>{promo.previousDesignation || "N/A"}</div>
                                        <div className="text-[10px] text-slate-400">{promo.previousDepartment || "General"}</div>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        <div className="font-black text-indigo-600 dark:text-indigo-400">
                                            {promo.proposedDesignation}
                                        </div>
                                        {promo.proposedBasicSalary ? (
                                            <div className="text-[10px] text-emerald-600 font-bold">
                                                AED {promo.proposedBasicSalary.toLocaleString()} / mo
                                            </div>
                                        ) : null}
                                    </TableCell>
                                    <TableCell className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {effective}
                                    </TableCell>
                                    <TableCell className="text-xs max-w-xs">
                                        <div className="truncate text-slate-700 dark:text-slate-300 font-medium">{promo.reason}</div>
                                        <div className="text-[10px] text-slate-400">By: {promo.requestedBy?.name || promo.requestedBy?.email}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                disabled={isBusy}
                                                onClick={() => handleApprove(promo.id)}
                                                className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3"
                                            >
                                                {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={isBusy}
                                                onClick={() => {
                                                    setRejectingId(promo.id);
                                                    setRejectReason("");
                                                }}
                                                className="h-8 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950 font-bold text-xs px-3"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Rejection Reason Modal */}
            <Dialog open={Boolean(rejectingId)} onOpenChange={(open) => !open && setRejectingId(null)}>
                <DialogContent className="rounded-3xl p-6 sm:p-8 max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase text-slate-900 dark:text-white">
                            Reject Promotion Request
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Reason for Rejection *</Label>
                        <Input
                            placeholder="State reason for declining this promotion..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="rounded-xl border-slate-200"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingId(null)} className="rounded-xl text-xs font-bold uppercase">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || busyId !== null}
                            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase"
                        >
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

