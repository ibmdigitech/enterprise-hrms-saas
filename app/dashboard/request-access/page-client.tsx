"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    KeyRound, CheckCircle2, XCircle, AlertCircle, Clock, ChevronRight,
    ArrowLeft, Shield, ShieldCheck, Info,
} from "lucide-react";
import Link from "next/link";
import { submitAccessRequest, cancelOwnAccessRequest } from "@/app/lib/actions/access-requests";

/* ─── Types ──────────────────────────────────────────────────────────── */

type AccessRequestType =
    | "NEW_ACCESS"
    | "ROLE_CHANGE"
    | "PERMISSION_CHANGE"
    | "TEMPORARY_ACCESS"
    | "ACCESS_RENEWAL"
    | "ACCESS_REVOCATION";

type OwnRequest = {
    id: string;
    status: string;
    requestedRole: string;
    createdAt: Date;
};

type Props = {
    currentRole: string;
    currentUserEmail: string;
    ownRequests: OwnRequest[];
};

/* ─── Status badge ───────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { cls: string; icon: React.ReactNode }> = {
        PENDING:   { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",   icon: <Clock className="h-3 w-3" /> },
        APPROVED:  { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <CheckCircle2 className="h-3 w-3" /> },
        REJECTED:  { cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",       icon: <XCircle className="h-3 w-3" /> },
        CANCELLED: { cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",      icon: <AlertCircle className="h-3 w-3" /> },
    };
    const s = map[status] ?? map.PENDING;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${s.cls}`}>
            {s.icon}{status}
        </span>
    );
}

/* ─── Request type descriptions ───────────────────────────────────────── */

const REQUEST_TYPES: { value: AccessRequestType; label: string; desc: string }[] = [
    { value: "NEW_ACCESS",        label: "New Access",         desc: "Requesting access to a role you have never held." },
    { value: "ROLE_CHANGE",       label: "Role Change",        desc: "Changing from your current role to a different role." },
    { value: "TEMPORARY_ACCESS",  label: "Temporary Access",   desc: "Time-limited access with an automatic expiry date." },
    { value: "ACCESS_RENEWAL",    label: "Access Renewal",     desc: "Renewing temporary or expiring access." },
    { value: "PERMISSION_CHANGE", label: "Permission Change",  desc: "Adjusting specific permissions within your current role." },
    { value: "ACCESS_REVOCATION", label: "Access Revocation",  desc: "Requesting removal of your own access." },
];

const REQUESTABLE_ROLES = [
    { value: "MANAGER",            label: "Manager (Department Head)" },
    { value: "DEPARTMENT_MANAGER", label: "Department Manager" },
    { value: "HR",                 label: "HR Specialist" },
    { value: "HR_MANAGER",         label: "HR Manager" },
    { value: "FINANCE",            label: "Finance Officer" },
    { value: "COMPANY_ADMIN",      label: "Company Administrator" },
    { value: "EMPLOYEE",           label: "Employee (self-service only)" },
];

/* ─── Main Component ─────────────────────────────────────────────────── */

export function RequestAccessPageClient({ currentRole, currentUserEmail, ownRequests }: Props) {
    const [isPending, startTransition] = useTransition();
    const [toast, setToast]            = useState<{ msg: string; ok: boolean } | null>(null);
    const [submitted, setSubmitted]    = useState(false);
    const [requestType, setRequestType] = useState<AccessRequestType>("ROLE_CHANGE");
    const [requestedRole, setRequestedRole] = useState("");

    const hasPendingRequest = ownRequests.some(r => r.status === "PENDING");

    const showToast = (msg: string, ok: boolean) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 5000);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        startTransition(async () => {
            const result = await submitAccessRequest(undefined, formData);
            if (result.success) {
                setSubmitted(true);
            }
            showToast(result.message, result.success);
        });
    };

    const handleCancel = (id: string) => {
        startTransition(async () => {
            const result = await cancelOwnAccessRequest(id);
            showToast(result.message, result.success);
        });
    };

    const isTemporary = requestType === "TEMPORARY_ACCESS";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 p-4 md:p-8">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm ${
                    toast.ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                }`}>
                    {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {toast.msg}
                </div>
            )}

            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 font-medium transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                            <KeyRound className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Request Access</h1>
                            <p className="text-slate-500 text-sm">Apply for a role change or access modification.</p>
                        </div>
                    </div>
                </div>

                {/* Current access info */}
                <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl">
                    <Info className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    <div className="text-sm">
                        <span className="text-slate-500">Your current role: </span>
                        <span className="font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">{currentRole.replace(/_/g, " ")}</span>
                        <span className="text-slate-400 ml-2">({currentUserEmail})</span>
                    </div>
                </div>

                {/* Pending request warning */}
                {hasPendingRequest && !submitted && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl">
                        <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold text-amber-700 dark:text-amber-400">You already have a pending request</p>
                            <p className="text-amber-600/70 dark:text-amber-500/70 text-xs mt-1">
                                Please wait for your existing request to be reviewed before submitting a new one, or cancel it below.
                            </p>
                        </div>
                    </div>
                )}

                {/* Success state */}
                {submitted ? (
                    <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-[2rem] shadow-lg">
                        <CardContent className="p-10 text-center">
                            <div className="h-16 w-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-5">
                                <ShieldCheck className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mb-2">Request Submitted</h3>
                            <p className="text-emerald-700/70 dark:text-emerald-400/70 text-sm max-w-md mx-auto leading-relaxed mb-6">
                                Your access request is now pending review by an administrator. You will be notified when a decision is made.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-xl">
                                    Submit Another Request
                                </Button>
                                <Link href="/dashboard">
                                    <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">Return to Dashboard</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* ─── Request Form ─── */
                    <Card className="border-slate-200 dark:border-slate-800 shadow-xl rounded-[2rem] overflow-hidden">
                        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 px-7 py-6">
                            <CardTitle className="flex items-center gap-2 font-black text-lg">
                                <Shield className="h-5 w-5 text-indigo-500" />
                                Access Request Form
                            </CardTitle>
                            <CardDescription className="text-sm">
                                All fields are required. Your request will be reviewed by an Access Administrator.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-7">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Request Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="requestType" className="font-bold text-sm">Request Type</Label>
                                    <Select
                                        name="requestType"
                                        value={requestType}
                                        onValueChange={v => setRequestType(v as AccessRequestType)}
                                        required
                                    >
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Select request type…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {REQUEST_TYPES.map(rt => (
                                                <SelectItem key={rt.value} value={rt.value}>
                                                    {rt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-slate-400">
                                        {REQUEST_TYPES.find(r => r.value === requestType)?.desc}
                                    </p>
                                </div>

                                {/* Requested Role */}
                                <div className="space-y-2">
                                    <Label htmlFor="requestedRole" className="font-bold text-sm">Requested Role</Label>
                                    <Select
                                        name="requestedRole"
                                        value={requestedRole}
                                        onValueChange={setRequestedRole}
                                        required
                                    >
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Select target role…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {REQUESTABLE_ROLES.map(r => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {requestedRole && (
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                            <span className="font-bold uppercase text-indigo-500">{currentRole.replace(/_/g, " ")}</span>
                                            <ChevronRight className="h-3 w-3" />
                                            <span className="font-bold uppercase text-emerald-600">{requestedRole.replace(/_/g, " ")}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Dates for temporary access */}
                                {isTemporary && (
                                    <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl">
                                        <div className="space-y-2">
                                            <Label htmlFor="effectiveDate" className="font-bold text-sm text-amber-700 dark:text-amber-400">
                                                Effective Date
                                            </Label>
                                            <Input
                                                id="effectiveDate"
                                                name="effectiveDate"
                                                type="date"
                                                required={isTemporary}
                                                className="h-10 rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expiryDate" className="font-bold text-sm text-amber-700 dark:text-amber-400">
                                                Expiry Date
                                            </Label>
                                            <Input
                                                id="expiryDate"
                                                name="expiryDate"
                                                type="date"
                                                required={isTemporary}
                                                className="h-10 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Justification */}
                                <div className="space-y-2">
                                    <Label htmlFor="justification" className="font-bold text-sm">Business Justification</Label>
                                    <Textarea
                                        id="justification"
                                        name="justification"
                                        placeholder="Explain why this access is required, what tasks it enables, and how long it is needed…"
                                        className="min-h-[120px] rounded-xl resize-none"
                                        required
                                        minLength={20}
                                    />
                                    <p className="text-xs text-slate-400">Minimum 20 characters. Be specific — vague requests are more likely to be rejected.</p>
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end gap-3 pt-2">
                                    <Link href="/dashboard">
                                        <Button type="button" variant="outline" className="rounded-xl">Cancel</Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={isPending || hasPendingRequest || !requestedRole}
                                        className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 font-bold min-w-[160px]"
                                    >
                                        {isPending ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Submitting…
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="h-4 w-4" />
                                                Submit Request
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* My Requests History */}
                {ownRequests.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            My Request History
                            <span className="text-slate-400 font-normal normal-case tracking-normal">({ownRequests.length})</span>
                        </h3>
                        {ownRequests.map(req => (
                            <div key={req.id} className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        req.status === "APPROVED" ? "bg-emerald-100 dark:bg-emerald-900/30" :
                                        req.status === "REJECTED" ? "bg-rose-100 dark:bg-rose-900/30" :
                                        "bg-indigo-100 dark:bg-indigo-900/30"
                                    }`}>
                                        <Shield className={`h-4 w-4 ${
                                            req.status === "APPROVED" ? "text-emerald-600" :
                                            req.status === "REJECTED" ? "text-rose-600" :
                                            "text-indigo-500"
                                        }`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                            {req.requestedRole.replace(/_/g, " ")}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            {new Date(req.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <StatusBadge status={req.status} />
                                    {req.status === "PENDING" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 rounded-xl text-xs font-bold"
                                            onClick={() => handleCancel(req.id)}
                                            disabled={isPending}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
