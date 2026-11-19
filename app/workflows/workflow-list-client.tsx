"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitBranch,
  Plus,
  Play,
  Users,
  Settings,
  Eye,
  FileText,
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteWorkflowTemplateAction } from "./workflow-actions";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isPublished: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { steps: number; runs: number };
};

const categoryColors: Record<string, string> = {
  ONBOARDING: "bg-blue-100 text-blue-700 border-blue-200",
  OFFBOARDING: "bg-orange-100 text-orange-700 border-orange-200",
  LEAVE: "bg-green-100 text-green-700 border-green-200",
  CUSTOM: "bg-purple-100 text-purple-700 border-purple-200",
};

function WorkflowCard({
  template,
  onDelete,
}: {
  template: Template;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border border-slate-200 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <GitBranch className="w-4 h-4 text-indigo-600" />
            </div>
            <CardTitle className="text-sm font-semibold text-slate-800 truncate">
              {template.name}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => router.push(`/workflows/${template.id}`)}
              >
                <Settings className="w-4 h-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(template.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {template.description && (
          <p className="text-xs text-slate-500 line-clamp-2">
            {template.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium border",
              categoryColors[template.category] ?? categoryColors.CUSTOM
            )}
          >
            {template.category}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium border",
              template.isPublished
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-500 border-slate-200"
            )}
          >
            {template.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> {template._count.steps} steps
          </span>
          <span className="flex items-center gap-1">
            <Play className="w-3 h-3" /> {template._count.runs} runs
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs"
            onClick={() => router.push(`/workflows/${template.id}`)}
          >
            <Settings className="w-3 h-3 mr-1" /> Edit
          </Button>
          <Button
            size="sm"
            className="flex-1 h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Play className="w-3 h-3 mr-1" /> Run
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkflowListClient({
  templates,
  tenantId,
}: {
  templates: Template[];
  tenantId: string;
}) {
  const [localTemplates, setLocalTemplates] = useState(templates);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this workflow? This cannot be undone.")) return;
    setIsDeleting(id);
    try {
      await deleteWorkflowTemplateAction(id);
      setLocalTemplates((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setIsDeleting(null);
    }
  }

  const workflowTemplates = localTemplates.filter((t) =>
    ["ONBOARDING", "OFFBOARDING", "LEAVE", "CUSTOM"].includes(t.category)
  );
  const formTemplates = localTemplates.filter(
    (t) => t.category === "FORM" || t.category === "DYNAMIC_FORM"
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Workflows</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Design and manage custom approval workflows
            </p>
          </div>
          <Link href="/workflows/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-9">
              <Plus className="w-4 h-4" /> New Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs defaultValue="workflows">
          <TabsList className="bg-white border border-slate-200 mb-6">
            <TabsTrigger
              value="workflows"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Custom Workflows
              <Badge className="ml-2 bg-slate-100 text-slate-600 text-xs">
                {workflowTemplates.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="forms"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Dynamic Forms
              <Badge className="ml-2 bg-slate-100 text-slate-600 text-xs">
                {formTemplates.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflows">
            {workflowTemplates.length === 0 ? (
              <EmptyState href="/workflows/new" label="Create Workflow" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {workflowTemplates.map((t) => (
                  <WorkflowCard
                    key={t.id}
                    template={t}
                    onDelete={handleDelete}
                  />
                ))}
                <NewCard href="/workflows/new" label="New Workflow" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="forms">
            {formTemplates.length === 0 ? (
              <EmptyState href="/workflows/new" label="Create Form" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {formTemplates.map((t) => (
                  <WorkflowCard
                    key={t.id}
                    template={t}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ href, label }: { href: string; label: string }) {
  return (
    <div className="text-center py-24 bg-white rounded-xl border border-dashed border-slate-300">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <GitBranch className="w-8 h-8 text-indigo-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">
        No workflows yet
      </h3>
      <p className="text-sm text-slate-400 mb-5">
        Create your first workflow to automate HR processes
      </p>
      <Link href={href}>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="w-4 h-4" /> {label}
        </Button>
      </Link>
    </div>
  );
}

function NewCard({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <div className="h-full min-h-[160px] rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group">
        <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
          <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
        </div>
        <span className="text-sm font-medium text-slate-400 group-hover:text-indigo-600 transition-colors">
          {label}
        </span>
      </div>
    </Link>
  );
}
