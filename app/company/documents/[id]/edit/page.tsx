"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getCompanyDocumentById, updateCompanyDocument } from "@/app/lib/actions/company-documents";
import { FileText, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

type CompanyDocument = NonNullable<Awaited<ReturnType<typeof getCompanyDocumentById>>["data"]>;

export default function EditCompanyDocumentPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [document, setDocument] = useState<CompanyDocument | null>(null);

    useEffect(() => {
        async function fetchDocument() {
            try {
                const res = await getCompanyDocumentById(id);
                if (res.success) {
                    setDocument(res.data);
                } else {
                    toast.error(res.error || "Failed to load document");
                    router.push("/company/documents");
                }
            } catch {
                toast.error("An unexpected error occurred");
                router.push("/company/documents");
            } finally {
                setInitialLoading(false);
            }
        }
        fetchDocument();
    }, [id, router]);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const res = await updateCompanyDocument(id, formData);
            if (res.success) {
                toast.success("Document updated successfully");
                router.push("/company/documents");
            } else {
                toast.error(res.error || "Failed to update document");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    if (initialLoading) {
        return (
            <div className="space-y-8 p-4 md:p-8 w-full max-w-3xl mx-auto">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            </div>
        );
    }

    if (!document) {
        return null;
    }

    return (
        <div className="space-y-8 p-4 md:p-8 w-full max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/company/documents">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Edit Document</h1>
                    <p className="text-slate-500 text-sm font-medium">Update the metadata for this document</p>
                </div>
            </div>

            <Card className="bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800/60 shadow-sm rounded-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-600" />
                        Document Details
                    </CardTitle>
                    <CardDescription>Update the metadata for this document</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                        <input type="hidden" name="id" value={document.id} />
                        <input type="hidden" name="fileUrl" value={document.fileUrl} />
                        <input type="hidden" name="fileName" value={document.fileName} />
                        <input type="hidden" name="fileType" value={document.fileType} />

                        <div className="space-y-2">
                            <Label htmlFor="title">Document Title</Label>
                            <Input id="title" name="title" defaultValue={document.title} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select name="type" defaultValue={document.type} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="POLICY">Policy</SelectItem>
                                        <SelectItem value="HANDBOOK">Handbook</SelectItem>
                                        <SelectItem value="PROCEDURE">Procedure</SelectItem>
                                        <SelectItem value="FORM">Form</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select name="category" defaultValue={document.category} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HR">HR</SelectItem>
                                        <SelectItem value="FINANCE">Finance</SelectItem>
                                        <SelectItem value="IT">IT</SelectItem>
                                        <SelectItem value="LEGAL">Legal</SelectItem>
                                        <SelectItem value="GENERAL">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" defaultValue={document.description || ""} placeholder="Brief description of the document..." rows={3} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="version">Version</Label>
                            <Input id="version" name="version" defaultValue={document.version} placeholder="1.0" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="effectiveFrom">Effective From</Label>
                                <DatePicker id="effectiveFrom" name="effectiveFrom" defaultValue={document.effectiveFrom ? new Date(document.effectiveFrom).toISOString().split("T")[0] : ""} aria-label="Effective from date" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="effectiveTo">Effective To (optional)</Label>
                                <DatePicker id="effectiveTo" name="effectiveTo" defaultValue={document.effectiveTo ? new Date(document.effectiveTo).toISOString().split("T")[0] : ""} aria-label="Effective to date" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="isActive">Status</Label>
                            <Select name="isActive" defaultValue={document.isActive.toString()}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="true">Active</SelectItem>
                                    <SelectItem value="false">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Link href="/company/documents">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={loading} className="gap-2">
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}