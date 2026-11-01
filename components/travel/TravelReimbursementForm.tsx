"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plane, Upload, FileText, Ticket, PlaneTakeoff, CheckCircle2, X } from "lucide-react";
import { requestBusinessTravel, fileBusinessTravelDocument } from "@/app/lib/actions/travel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { FormField } from "@/components/common/FormField";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type EmployeeOption = { id: string; firstName: string; lastName: string; employeeCode: string | null };

const CLASSES = [
    { value: "ECONOMY", label: "Economy" },
    { value: "PREMIUM_ECONOMY", label: "Premium economy" },
    { value: "BUSINESS", label: "Business" },
];

const DOCUMENT_KINDS = [
    {
        kind: "BOARDING_PASS",
        label: "Boarding Pass",
        Icon: PlaneTakeoff,
        hint: "Proof of travel - required for reimbursement",
        required: true,
    },
    {
        kind: "TICKET",
        label: "Air Ticket / E-Ticket",
        Icon: Ticket,
        hint: "Flight booking confirmation / itinerary",
        required: false,
    },
    {
        kind: "RECEIPT",
        label: "Expense Receipts",
        Icon: FileText,
        hint: "Hotel, transport, meals, other expenses",
        required: false,
    },
    {
        kind: "OTHER",
        label: "Other Documents",
        Icon: FileText,
        hint: "Visa, invitation letter, conference badge, etc.",
        required: false,
    },
] as const;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/jpg,application/pdf,.png,.jpg,.jpeg,.pdf";

type Draft = { file: File; preview: string };

const size = (bytes: number): string =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export function TravelReimbursementForm({
    employees,
    ownEmployeeId,
    canRequestForOthers,
    isReimbursement = false,
    existingRequestId = null,
}: {
    employees: EmployeeOption[];
    ownEmployeeId: string | null;
    canRequestForOthers: boolean;
    isReimbursement?: boolean;
    existingRequestId?: string | null;
}) {
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("details");
    const router = useRouter();

    // Document drafts and references
    const [drafts, setDrafts] = useState<Record<string, Draft | undefined>>({});
    const [references, setReferences] = useState<Record<string, string>>({});
    const [busyKind, setBusyKind] = useState<string | null>(null);
    const [draggingKind, setDraggingKind] = useState<string | null>(null);
    const inputs = useRef<Record<string, HTMLInputElement | null>>({});

    const selectable = canRequestForOthers ? employees : ownEmployeeId ? [ownEmployeeId] : [];
    if (selectable.length === 0) {
        return (
            <Card className="rounded-2xl border-slate-200 shadow-sm dark:border-slate-800">
                <CardHeader>
                    <CardTitle>Travel Reimbursement</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                        No active employee record is linked to your account. Ask HR to link it before
                        submitting travel.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Document handlers
    function pick(kind: string, file: File | undefined) {
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
            toast.error("Choose a PNG, JPEG or PDF file.");
            return;
        }
        if (file.size > MAX_BYTES) {
            toast.error("That file is larger than 10 MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result;
            setDrafts((current) => ({
                ...current,
                [kind]: {
                    file,
                    preview: file.type === "application/pdf" || typeof result !== "string" ? "" : result,
                },
            }));
        };
        reader.readAsDataURL(file);
    }

    async function saveDocument(kind: string, file: File, requestId: string) {
        setBusyKind(kind);
        try {
            const formData = new FormData();
            formData.append("requestId", requestId);
            formData.append("kind", kind);
            formData.append("file", file);
            const reference = references[kind]?.trim();
            if (reference) formData.append("reference", reference);

            const result = await fileBusinessTravelDocument(formData);
            if (result.success) {
                toast.success(`${kind} uploaded successfully`);
                setDrafts((current) => ({ ...current, [kind]: undefined }));
                setReferences((current) => ({ ...current, [kind]: "" }));
                router.refresh();
            } else {
                toast.error(result.message, { duration: 7000 });
            }
        } catch {
            toast.error("Could not upload the document. Please try again.");
        } finally {
            setBusyKind(null);
        }
    }

    async function handleSubmit(formData: FormData) {
        setSaving(true);
        try {
            let requestId = existingRequestId;

            if (!requestId) {
                const result = await requestBusinessTravel(formData);
                if (!result.success) {
                    toast.error(result.message);
                    return;
                }
                toast.success(result.message);
                requestId = result.requestId ?? null;
            }

            // Upload all pending documents
            for (const kind of Object.keys(drafts)) {
                const draft = drafts[kind];
                if (draft && requestId) {
                    await saveDocument(kind, draft.file, requestId);
                }
            }

            if (!existingRequestId) {
                router.refresh();
                (document.getElementById("travel-reimbursement-form") as HTMLFormElement | null)?.reset();
                setDrafts({});
                setReferences({});
            }
        } catch {
            toast.error("Could not submit. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    const tabs = [
        { id: "details", label: "Travel Details", icon: Plane },
        { id: "documents", label: "Upload Documents", icon: Upload },
    ];

    return (
        <Card className="rounded-2xl border-slate-200 shadow-sm dark:border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Plane className="h-4 w-4" aria-hidden="true" />
                    {isReimbursement ? "Travel Reimbursement" : "Travel Request"}
                </CardTitle>
                <CardDescription>
                    {isReimbursement
                        ? "Submit your completed travel with boarding passes and receipts for reimbursement."
                        : "Company-purpose travel outside the country. Upload documents for faster approval."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border-b border-slate-200 dark:border-slate-800 mb-4">
                    <nav className="flex gap-1" role="tablist">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600"
                                        : "text-slate-500 hover:text-slate-700 dark:text-slate-300"
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <form id="travel-reimbursement-form" action={handleSubmit} className="space-y-5">
                    {/* Travel Details Tab */}
                    {activeTab === "details" && (
                        <>
                            {canRequestForOthers ? (
                                <div className="space-y-2">
                                    <Label htmlFor="travel-employee">Employee</Label>
                                    <select
                                        id="travel-employee"
                                        name="employeeId"
                                        required
                                        defaultValue=""
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <option value="" disabled>Select an employee</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.firstName} {employee.lastName}
                                                {employee.employeeCode ? ` · ${employee.employeeCode}` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <input type="hidden" name="employeeId" value={ownEmployeeId ?? ""} />
                            )}

                            <FormField
                                name="purpose"
                                label="Purpose of travel"
                                required
                                maxLength={1000}
                                placeholder={isReimbursement ? "e.g. Client site survey, Doha - Completed Mar 2024" : "e.g. Client site survey, Doha"}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    name="destinationCountry"
                                    label="Destination country"
                                    required
                                    maxLength={80}
                                    placeholder="e.g. Qatar"
                                />
                                <FormField
                                    name="destinationCity"
                                    label="Destination city"
                                    maxLength={80}
                                    placeholder="e.g. Doha"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <DateField name="departureDate" label="Departure date" required />
                                <DateField name="returnDate" label="Return date" hint="Leave empty for one-way travel." />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="travel-class">Travel class</Label>
                                    <select
                                        id="travel-class"
                                        name="travelClass"
                                        defaultValue="ECONOMY"
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold dark:border-slate-800 dark:bg-slate-900"
                                    >
                                        {CLASSES.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cost-bearer">Ticket cost borne by</Label>
                                    <select
                                        id="cost-bearer"
                                        name="ticketCostBorneBy"
                                        defaultValue={isReimbursement ? "EMPLOYEE" : "COMPANY"}
                                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold dark:border-slate-800 dark:bg-slate-900"
                                    >
                                        <option value="COMPANY">Company</option>
                                        <option value="EMPLOYEE">Employee (Reimbursement)</option>
                                    </select>
                                </div>

                                <FormField
                                    name="estimatedCost"
                                    label="Estimated/Actual cost (AED)"
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="0"
                                />
                            </div>

                            <p className="text-xs leading-relaxed text-slate-500">
                                {isReimbursement
                                    ? "Enter the actual amount spent. Attach boarding passes and receipts for each expense."
                                    : "Attach flight itinerary, boarding passes, and receipts for faster approval."}
                            </p>
                        </>
                    )}

                    {/* Documents Tab */}
                    {activeTab === "documents" && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                    <Upload className="h-4 w-4" />
                                    Supporting Documents
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Upload all required documents. Boarding pass is mandatory for reimbursement.
                                    Each file: PNG, JPEG, PDF up to 10 MB.
                                </p>
                            </div>

                            {DOCUMENT_KINDS.map(({ kind, label, Icon, hint, required }) => {
                                const draft = drafts[kind];
                                const busy = busyKind === kind;

                                return (
                                    <div
                                        key={kind}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            setDraggingKind(kind);
                                        }}
                                        onDragLeave={() => setDraggingKind((current) => (current === kind ? null : current))}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            setDraggingKind(null);
                                            pick(kind, event.dataTransfer.files?.[0]);
                                        }}
                                        className={`rounded-xl border p-4 transition-colors ${
                                            draggingKind === kind
                                                ? "border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40"
                                                : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40"
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                                    <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{label}</p>
                                                        {required && (
                                                            <Badge variant="secondary" className="text-xs h-5 px-2">
                                                                Required
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-500 mt-0.5">{hint}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {draft && (
                                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                        {draft.file.name} ({size(draft.file.size)})
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {draft ? (
                                            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-white p-3 dark:border-emerald-800 dark:bg-slate-900">
                                                {draft.preview ? (
                                                    <img
                                                        src={draft.preview}
                                                        alt="Preview"
                                                        className="h-16 w-24 rounded-md object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                                    />
                                                ) : (
                                                    <span className="flex h-16 w-24 items-center justify-center rounded-md bg-rose-50 text-rose-500 ring-1 ring-rose-100 dark:bg-rose-950/30 dark:ring-rose-900">
                                                        <FileText className="h-6 w-6" aria-hidden="true" />
                                                    </span>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold">{draft.file.name}</p>
                                                    <p className="text-xs text-slate-500">{size(draft.file.size)}</p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={busy}
                                                    onClick={() => saveDocument(kind, draft.file, existingRequestId || "")}
                                                    className="h-8 px-3"
                                                >
                                                    <Upload className="h-3.5 w-3.5 mr-1" />
                                                    {busy ? "Uploading…" : "Upload"}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={busy}
                                                    onClick={() => setDrafts((current) => ({ ...current, [kind]: undefined }))}
                                                    className="h-8 px-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                >
                                                    <X className="h-3.5 w-3.5 mr-1" />
                                                    Remove
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="mt-3">
                                                <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-6 text-center">
                                                    <input
                                                        ref={(element) => {
                                                            inputs.current[kind] = element;
                                                        }}
                                                        id={`travel-doc-${kind}`}
                                                        type="file"
                                                        className="sr-only"
                                                        accept={ACCEPT}
                                                        onChange={(event) => {
                                                            pick(kind, event.target.files?.[0]);
                                                            event.target.value = "";
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`travel-doc-${kind}`}
                                                        className="cursor-pointer flex flex-col items-center gap-3"
                                                    >
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Upload className="h-6 w-6 text-indigo-500" />
                                                            <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                                                Drag & drop or click to upload {label}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500">PNG, JPEG, PDF up to 10 MB</p>
                                                    </label>
                                                </div>
                                                <div className="mt-2">
                                                    <label
                                                        htmlFor={`travel-doc-ref-${kind}`}
                                                        className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500"
                                                    >
                                                        Reference (PNR, booking ref, invoice #) - optional
                                                    </label>
                                                    <input
                                                        id={`travel-doc-ref-${kind}`}
                                                        type="text"
                                                        maxLength={100}
                                                        defaultValue={references[kind] ?? ""}
                                                        onChange={(event) =>
                                                            setReferences((current) => ({ ...current, [kind]: event.target.value }))
                                                        }
                                                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm sm:max-w-md dark:border-slate-800 dark:bg-slate-900"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                                <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Document Checklist</h5>
                                <ul className="grid gap-2 sm:grid-cols-2 text-sm">
                                    {DOCUMENT_KINDS.map(({ kind, label, required }) => (
                                        <li key={kind} className="flex items-center gap-2">
                                            <CheckCircle2 className={`h-4 w-4 ${drafts[kind] ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}`} />
                                            <span className={`${drafts[kind] ? "text-emerald-700 dark:text-emerald-300 line-through" : "text-slate-600 dark:text-slate-300"}`}>
                                                {label} {required && <span className="text-amber-500 ml-1">*</span>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                        <Button type="submit" disabled={saving} className="min-w-[180px]">
                            {saving ? "Submitting…" : isReimbursement ? "Submit for Reimbursement" : "Submit Travel Request"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}