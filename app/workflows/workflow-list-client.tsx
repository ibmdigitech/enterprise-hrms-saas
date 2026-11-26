"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitBranch,
  Plus,
  Play,
  Settings,
  FileText,
  MoreVertical,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteWorkflowTemplateAction,
  runWorkflowTemplateAction,
} from "./workflow-actions";
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
  DYNAMIC_FORM: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CUSTOM: "bg-purple-100 text-purple-700 border-purple-200",
};

function WorkflowCard({
  template,
  isBusy,
  onDelete,
  onRun,
}: {
  template: Template;
  isBusy: boolean;
  onDelete: (id: string) => void;
  onRun: (id: string) => void;
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
                className="h-7 w-7 p-0 opacity-70 group-hover:opacity-100 transition-opacity"
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
                disabled={isBusy}
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
            {template.category.replace("_", " ")}
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
            className="flex-1 h-8 text-xs"
            onClick={() => router.push(`/workflows/${template.id}`)}
          >
            <Settings className="w-3 h-3 mr-1" /> Design
          </Button>
          <Button
            size="sm"
            disabled={isBusy}
            onClick={() => onRun(template.id)}
            className="flex-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isBusy ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Play className="w-3 h-3 mr-1" />
            )}
            Run
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
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this workflow? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const res = await deleteWorkflowTemplateAction(id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setLocalTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Workflow deleted");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRun(id: string) {
    setBusyId(id);
    try {
      const res = await runWorkflowTemplateAction(id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setLocalTemplates((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, _count: { ...t._count, runs: t._count.runs + 1 } }
            : t
        )
      );
      toast.success("Workflow run started");
    } finally {
      setBusyId(null);
    }
  }

  const formTemplates = localTemplates.filter(
    (t) => t.category === "FORM" || t.category === "DYNAMIC_FORM"
  );
  const workflowTemplates = localTemplates.filter(
    (t) => t.category !== "FORM" && t.category !== "DYNAMIC_FORM"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Custom Workflows & Dynamic Forms
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Design visual approval flows, conditional branches, and role permissions
          </p>
        </div>
        <Link href="/workflows/new">
          <Button
            disabled={!tenantId}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-9"
          >
            <Plus className="w-4 h-4" /> New Workflow
          </Button>
        </Link>
      </div>

      {/* Content */}
      <Tabs defaultValue="workflows">
        <TabsList className="bg-white border border-slate-200 mb-4">
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
            <EmptyState
              href="/workflows/new?category=ONBOARDING"
              label="Create Workflow"
              title="No workflows yet"
              subtitle="Create your first visual HR approval workflow"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {workflowTemplates.map((t) => (
                <WorkflowCard
                  key={t.id}
                  template={t}
                  isBusy={busyId === t.id}
                  onDelete={handleDelete}
                  onRun={handleRun}
                />
              ))}
              <NewCard href="/workflows/new?category=ONBOARDING" label="New Workflow" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="forms">
          {formTemplates.length === 0 ? (
            <EmptyState
              href="/workflows/new?category=DYNAMIC_FORM"
              label="Create Dynamic Form"
              title="No dynamic forms yet"
              subtitle="Build custom employee forms with drag-and-drop fields"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {formTemplates.map((t) => (
                <WorkflowCard
                  key={t.id}
                  template={t}
                  isBusy={busyId === t.id}
                  onDelete={handleDelete}
                  onRun={handleRun}
                />
              ))}
              <NewCard href="/workflows/new?category=DYNAMIC_FORM" label="New Form" />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({
  href,
  label,
  title,
  subtitle,
}: {
  href: string;
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <GitBranch className="w-8 h-8 text-indigo-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-5">{subtitle}</p>
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
      <div className="h-full min-h-[180px] rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group">
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
