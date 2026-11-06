"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar, UserPlus, Loader2 } from "lucide-react";
import { enrollEmployeeInSession } from "@/app/lib/actions/training";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EmployeeOption {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string | null;
    department: string | null;
    designation: string | null;
    photo: string | null;
}

interface SessionOption {
    id: string;
    title: string;
    startDate: string | Date;
    endDate: string | Date;
    course: { title: string; code: string };
}

interface EnrollEmployeeDialogProps {
    sessions: SessionOption[];
    employees: EmployeeOption[];
}

export function EnrollEmployeeDialog({ sessions, employees }: EnrollEmployeeDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [justification, setJustification] = useState("");

    const handleEnroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSessionId || !selectedEmployeeId) {
            toast.error("Please select both a Training Session and an Employee");
            return;
        }

        try {
            setLoading(true);
            await enrollEmployeeInSession({
                sessionId: selectedSessionId,
                employeeId: selectedEmployeeId,
                
            });

            toast.success("Employee enrolled in training session successfully");
            setOpen(false);
            setSelectedSessionId("");
            setSelectedEmployeeId("");
            setJustification("");
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to enroll employee");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-teal-500/40 text-teal-300 hover:bg-teal-500/10 gap-2 rounded-xl">
                    <UserPlus className="h-4 w-4" />
                    Enroll Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-white">Enroll Employee in Training</DialogTitle>
                            <DialogDescription className="text-slate-400 text-sm">
                                Register an active employee into a scheduled training cohort.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleEnroll} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-300">Select Training Session *</Label>
                        <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                            <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white">
                                <SelectValue placeholder="Choose scheduled session..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-64">
                                {sessions.length === 0 ? (
                                    <SelectItem value="none" disabled>No active sessions found</SelectItem>
                                ) : (
                                    sessions.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.course.code} - {s.title} ({new Date(s.startDate).toLocaleDateString()})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-300">Select Employee *</Label>
                        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                            <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white">
                                <SelectValue placeholder="Choose team member..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-64">
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName} {emp.employeeCode ? `(${emp.employeeCode})` : ""} - {emp.designation || emp.department || "Staff"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="justification" className="text-xs font-semibold text-slate-300">Training Justification / Objective</Label>
                        <Input
                            id="justification"
                            placeholder="e.g. Required annual compliance certification or PDP goal"
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            className="bg-slate-800/80 border-slate-700 text-white"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Enrollment
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
