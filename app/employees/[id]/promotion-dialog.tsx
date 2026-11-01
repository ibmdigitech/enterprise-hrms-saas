"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { TrendingUp, Loader2 } from "lucide-react";
import { createPromotionRequest } from "@/app/lib/actions/promotions";

interface PromotionDialogProps {
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        designation: string | null;
        department: string | null;
        basicSalary: number | null;
        housingAllowance?: number | null;
        transportAllowance?: number | null;
        otherAllowance?: number | null;
    };
}

export function PromotionDialog({ employee }: PromotionDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        promotionType: "DESIGNATION_PROMOTION",
        proposedDesignation: "",
        proposedDepartment: employee.department || "",
        proposedGrade: "",
        salaryRevision: false,
        proposedBasicSalary: employee.basicSalary ? String(employee.basicSalary) : "",
        proposedHousing: employee.housingAllowance ? String(employee.housingAllowance) : "",
        proposedTransport: employee.transportAllowance ? String(employee.transportAllowance) : "",
        proposedOther: employee.otherAllowance ? String(employee.otherAllowance) : "",
        effectiveDate: new Date().toISOString().split("T")[0],
        reason: "",
        justificationNotes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.proposedDesignation.trim()) {
            toast.error("Please specify the proposed designation");
            return;
        }
        if (!form.reason.trim()) {
            toast.error("Please enter a reason for the promotion");
            return;
        }

        setLoading(true);
        try {
            const res = await createPromotionRequest({
                employeeId: employee.id,
                promotionType: form.promotionType,
                proposedDesignation: form.proposedDesignation,
                proposedDepartment: form.proposedDepartment,
                proposedGrade: form.proposedGrade || undefined,
                salaryRevision: form.salaryRevision,
                proposedBasicSalary: form.salaryRevision && form.proposedBasicSalary ? parseFloat(form.proposedBasicSalary) : undefined,
                proposedHousing: form.salaryRevision && form.proposedHousing ? parseFloat(form.proposedHousing) : undefined,
                proposedTransport: form.salaryRevision && form.proposedTransport ? parseFloat(form.proposedTransport) : undefined,
                proposedOther: form.salaryRevision && form.proposedOther ? parseFloat(form.proposedOther) : undefined,
                effectiveDate: form.effectiveDate,
                reason: form.reason,
                justificationNotes: form.justificationNotes,
            });

            if (res.success) {
                toast.success("Promotion request submitted successfully!");
                setOpen(false);
            } else {
                toast.error(res.error || "Failed to submit promotion request");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="h-9 gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-indigo-700">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Request Promotion
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        Initiate Promotion Request
                    </DialogTitle>
                    <p className="text-xs font-medium text-slate-500">
                        Employee: <span className="font-bold text-slate-900 dark:text-white">{employee.firstName} {employee.lastName}</span> · Current: <span className="font-bold">{employee.designation || "N/A"}</span>
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Promotion Type</Label>
                            <Select
                                value={form.promotionType}
                                onValueChange={(val) => setForm((prev) => ({ ...prev, promotionType: val }))}
                            >
                                <SelectTrigger className="rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DESIGNATION_PROMOTION">Designation Promotion</SelectItem>
                                    <SelectItem value="GRADE_PROMOTION">Grade / Level Promotion</SelectItem>
                                    <SelectItem value="MANAGEMENT_PROMOTION">Management Promotion</SelectItem>
                                    <SelectItem value="INTERNAL_PROMOTION">Internal Progression</SelectItem>
                                    <SelectItem value="CAREER_LEVEL_PROMOTION">Career Track Advancement</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Effective Date</Label>
                            <Input
                                type="date"
                                required
                                value={form.effectiveDate}
                                onChange={(e) => setForm((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                                className="rounded-xl border-slate-200"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proposed Designation *</Label>
                            <Input
                                required
                                placeholder="e.g. Lead Engineer"
                                value={form.proposedDesignation}
                                onChange={(e) => setForm((prev) => ({ ...prev, proposedDesignation: e.target.value }))}
                                className="rounded-xl border-slate-200"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Proposed Department</Label>
                            <Input
                                placeholder="e.g. Engineering"
                                value={form.proposedDepartment}
                                onChange={(e) => setForm((prev) => ({ ...prev, proposedDepartment: e.target.value }))}
                                className="rounded-xl border-slate-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reason for Promotion *</Label>
                        <Input
                            required
                            placeholder="e.g. Exceptional Q3 leadership, taking over team delivery responsibility"
                            value={form.reason}
                            onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                            className="rounded-xl border-slate-200"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Justification / Performance Notes</Label>
                        <Textarea
                            placeholder="Details on achievements, KPIs met, or management endorsement..."
                            value={form.justificationNotes}
                            onChange={(e) => setForm((prev) => ({ ...prev, justificationNotes: e.target.value }))}
                            className="rounded-xl border-slate-200 text-sm"
                            rows={3}
                        />
                    </div>

                    {/* Salary Revision Section */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="salaryRevision"
                                checked={form.salaryRevision}
                                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, salaryRevision: Boolean(checked) }))}
                            />
                            <Label htmlFor="salaryRevision" className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 cursor-pointer">
                                Include Compensation / Salary Revision
                            </Label>
                        </div>

                        {form.salaryRevision && (
                            <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Basic (AED)</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={form.proposedBasicSalary}
                                        onChange={(e) => setForm((prev) => ({ ...prev, proposedBasicSalary: e.target.value }))}
                                        className="h-9 rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Housing</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={form.proposedHousing}
                                        onChange={(e) => setForm((prev) => ({ ...prev, proposedHousing: e.target.value }))}
                                        className="h-9 rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Transport</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={form.proposedTransport}
                                        onChange={(e) => setForm((prev) => ({ ...prev, proposedTransport: e.target.value }))}
                                        className="h-9 rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold uppercase text-slate-400">Other</Label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={form.proposedOther}
                                        onChange={(e) => setForm((prev) => ({ ...prev, proposedOther: e.target.value }))}
                                        className="h-9 rounded-lg"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="rounded-xl font-bold uppercase text-xs tracking-wider"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-indigo-600 px-6 font-black uppercase text-xs tracking-wider text-white hover:bg-indigo-700"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

