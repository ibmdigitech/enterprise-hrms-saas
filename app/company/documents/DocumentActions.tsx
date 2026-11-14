"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { deleteCompanyDocument } from "@/app/lib/actions/company-documents";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";

interface DocumentActionsProps {
    document: {
        id: string;
        title: string;
        fileUrl: string;
        isActive: boolean;
    };
    onDelete: () => void;
}

export function DocumentActions({ document, onDelete }: DocumentActionsProps) {
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm(`Are you sure you want to delete "${document.title}"?`)) {
            return;
        }

        setDeleting(true);
        try {
            const res = await deleteCompanyDocument(document.id);
            if (res.success) {
                toast.success("Document deleted successfully");
                onDelete();
            } else {
                toast.error(res.error || "Failed to delete document");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Link href={`/company/documents/${document.id}/edit`}>
                <Button variant="ghost" size="sm" className="gap-1" title="Edit">
                    <Edit className="h-3 w-3" />
                </Button>
            </Link>
            <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/20"
                onClick={handleDelete}
                disabled={deleting}
                title="Delete"
            >
                <Trash2 className="h-3 w-3" />
            </Button>
            <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-1">
                    View
                </Button>
            </a>
        </div>
    );
}