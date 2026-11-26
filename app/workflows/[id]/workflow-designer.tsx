"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  GitBranch,
  User,
  Settings2,
  Bell,
  FileText,
  Eye,
  Edit3,
  EyeOff,
  ChevronDown,
  ArrowDown,
  Save,
  Play,
  Zap,
  CheckSquare,
  AlignJustify,
  Table2,
  ToggleLeft,
  Paperclip,
  Radio,
  Search,
  ArrowLeft,
  ChevronUp,
  GripVertical,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updateWorkflowTemplateAction,
  publishWorkflowTemplateAction,
  type WorkflowStepConfig,
} from "../workflow-actions";

// ─── Types ───────────────────────────────────────────────────────────────────

type StepPermissions = {
  readOnly: boolean;
  editable: boolean;
  hidden: boolean;
};

type FormFieldItem = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
};

type WorkflowNode = {
  id: string;
  name: string;
  description: string;
  stepType: "TRIGGER" | "USER" | "CONDITION" | "NOTIFICATION" | "SYSTEM";
  assigneeType: "USER" | "ROLE" | "DEPARTMENT" | "AUTO";
  assigneeRef: string;
  orderIndex: number;
  isStart: boolean;
  isEnd: boolean;
  config: WorkflowStepConfig;
  permissions: StepPermissions;
};

type WorkflowEdge = {
  id: string;
  fromStepId: string;
  toStepId: string;
  label: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STEP_TYPE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  TRIGGER: {
    label: "Trigger",
    color: "text-indigo-700",
    bg: "bg-indigo-600",
    border: "border-indigo-500",
    icon: Zap,
  },
  USER: {
    label: "User Step",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-300",
    icon: User,
  },
  CONDITION: {
    label: "Condition",
    color: "text-emerald-700",
    bg: "bg-emerald-500",
    border: "border-emerald-500",
    icon: GitBranch,
  },
  NOTIFICATION: {
    label: "Notification",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-300",
    icon: Bell,
  },
  SYSTEM: {
    label: "System",
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-300",
    icon: Settings2,
  },
};

const ROLE_COLORS: Record<string, string> = {
  HR: "bg-indigo-50 border-indigo-200 text-indigo-700",
  IT: "bg-teal-50 border-teal-200 text-teal-700",
  MANAGER: "bg-blue-50 border-blue-200 text-blue-700",
  ADMIN: "bg-orange-50 border-orange-200 text-orange-700",
  USER: "bg-rose-50 border-rose-200 text-rose-700",
};

const COMPONENTS = [
  { type: "TEXT", label: "Form Field", icon: FileText },
  { type: "SECTION", label: "Sections", icon: AlignJustify },
  { type: "TABLE", label: "Tables", icon: Table2 },
  { type: "CHECKBOX", label: "Checkbox", icon: CheckSquare },
  { type: "DROPDOWN", label: "Drop down", icon: ChevronDown },
  { type: "TOGGLE", label: "Toggle Button", icon: ToggleLeft },
  { type: "ATTACHMENT", label: "Attachments", icon: Paperclip },
  { type: "RADIO", label: "Radio Button", icon: Radio },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(prefix = "step") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getRoleCardClass(ref: string, name: string) {
  const combined = `${ref} ${name}`.toUpperCase();
  for (const [key, cls] of Object.entries(ROLE_COLORS)) {
    if (combined.includes(key)) return cls;
  }
  return "bg-rose-50 border-rose-200 text-rose-700";
}

function buildDefaultGraph(templateId: string): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} {
  const triggerId = `${templateId}_trigger`;
  const userStepId = `${templateId}_user`;
  const hrStepId = `${templateId}_hr`;
  const condId = `${templateId}_cond`;
  const itYesId = `${templateId}_it_yes`;
  const hrNoId = `${templateId}_hr_no`;

  return {
    nodes: [
      {
        id: triggerId,
        name: "Trigger",
        description: "",
        stepType: "TRIGGER",
        assigneeType: "AUTO",
        assigneeRef: "",
        orderIndex: 0,
        isStart: true,
        isEnd: false,
        config: { triggerEvent: "STARTING_FLOW", fields: [] },
        permissions: { readOnly: false, editable: false, hidden: false },
      },
      {
        id: userStepId,
        name: "User Step",
        description: "Start Onboarding Process",
        stepType: "USER",
        assigneeType: "USER",
        assigneeRef: "Employee",
        orderIndex: 1,
        isStart: false,
        isEnd: false,
        config: { triggerEvent: "STARTING_FLOW", fields: [] },
        permissions: { readOnly: false, editable: true, hidden: false },
      },
      {
        id: hrStepId,
        name: "HR Coordinator",
        description: "Complete Document Verification",
        stepType: "USER",
        assigneeType: "ROLE",
        assigneeRef: "HR",
        orderIndex: 2,
        isStart: false,
        isEnd: false,
        config: { triggerEvent: "ON_APPROVAL", fields: [] },
        permissions: { readOnly: true, editable: true, hidden: true },
      },
      {
        id: condId,
        name: "Condition",
        description: "Verify all documents submitted",
        stepType: "CONDITION",
        assigneeType: "AUTO",
        assigneeRef: "",
        orderIndex: 3,
        isStart: false,
        isEnd: false,
        config: { triggerEvent: "ON_APPROVAL", fields: [] },
        permissions: { readOnly: false, editable: false, hidden: false },
      },
      {
        id: itYesId,
        name: "IT Administrator",
        description: "Create IT Accounts and Access",
        stepType: "USER",
        assigneeType: "ROLE",
        assigneeRef: "IT",
        orderIndex: 4,
        isStart: false,
        isEnd: true,
        config: { triggerEvent: "ON_APPROVAL", fields: [] },
        permissions: { readOnly: false, editable: true, hidden: false },
      },
      {
        id: hrNoId,
        name: "HR Coordinator",
        description: "Inform Employee of Documentation Requirements",
        stepType: "USER",
        assigneeType: "ROLE",
        assigneeRef: "HR",
        orderIndex: 5,
        isStart: false,
        isEnd: true,
        config: { triggerEvent: "ON_REJECTION", fields: [] },
        permissions: { readOnly: true, editable: true, hidden: false },
      },
    ],
    edges: [
      { id: `${templateId}_e1`, fromStepId: triggerId, toStepId: userStepId, label: "" },
      { id: `${templateId}_e2`, fromStepId: userStepId, toStepId: hrStepId, label: "" },
      { id: `${templateId}_e3`, fromStepId: hrStepId, toStepId: condId, label: "" },
      { id: `${templateId}_e4`, fromStepId: condId, toStepId: itYesId, label: "Yes" },
      { id: `${templateId}_e5`, fromStepId: condId, toStepId: hrNoId, label: "No" },
    ],
  };
}

// ─── Node Card ────────────────────────────────────────────────────────────────

function NodeCard({
  node,
  isSelected,
  onSelect,
  onDropComponent,
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDropComponent?: (nodeId: string, componentType: string, label: string) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const meta = STEP_TYPE_META[node.stepType] ?? STEP_TYPE_META.USER;
  const Icon = meta.icon;
  const fieldCount = node.config?.fields?.length ?? 0;

  if (node.stepType === "TRIGGER") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "px-6 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2 shadow-md transition-all",
          isSelected
            ? "bg-indigo-700 ring-2 ring-indigo-300 ring-offset-2"
            : "bg-indigo-600 hover:bg-indigo-700"
        )}
      >
        <Icon className="w-4 h-4" />
        {node.name}
      </button>
    );
  }

  if (node.stepType === "CONDITION") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "px-5 py-1.5 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-all",
          isSelected
            ? "bg-emerald-700 ring-2 ring-emerald-300 ring-offset-2"
            : "bg-emerald-500 hover:bg-emerald-600"
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        {node.name || "Condition"}
      </button>
    );
  }

  const headerClass = getRoleCardClass(node.assigneeRef, node.name);

  return (
    <button
      type="button"
      onClick={onSelect}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const type = e.dataTransfer.getData("application/x-wf-type");
        const label = e.dataTransfer.getData("application/x-wf-label");
        if (type && label && onDropComponent) {
          onDropComponent(node.id, type, label);
        }
      }}
      className={cn(
        "w-64 rounded-xl border-2 bg-white shadow-sm text-left transition-all hover:shadow-md overflow-hidden",
        isDragOver && "ring-2 ring-indigo-500 border-indigo-400 scale-[1.02]",
        isSelected
          ? "ring-2 ring-indigo-500 ring-offset-2 border-indigo-400"
          : "border-slate-200 hover:border-indigo-300"
      )}
    >
      <div
        className={cn(
          "px-3.5 py-2.5 flex items-center justify-between border-b",
          headerClass
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-white/80 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold truncate">{node.name}</span>
        </div>
        {fieldCount > 0 && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/80 text-indigo-700 shrink-0">
            {fieldCount} {fieldCount === 1 ? "field" : "fields"}
          </span>
        )}
      </div>

      <div className="px-3.5 py-2.5 space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
          Description
        </p>
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          {node.description || "Click to configure step details"}
        </p>

        {node.assigneeRef && (
          <div className="pt-1 flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <User className="w-3 h-3 text-indigo-600" />
            </div>
            <span className="text-[11px] font-medium text-slate-500 truncate">
              {node.assigneeRef} ({node.assigneeType})
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Add Menu ─────────────────────────────────────────────────────────────────

function AddMenu({
  node,
  onAddStep,
  onAddCondition,
  onDeleteNode,
  onClose,
}: {
  node: WorkflowNode;
  onAddStep: (afterId: string) => void;
  onAddCondition: (afterId: string) => void;
  onDeleteNode: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="absolute z-50 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden w-52"
      style={{ top: "100%", left: "50%", transform: "translateX(-50%)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50/70 transition-colors"
        onClick={() => {
          onAddStep(node.id);
          onClose();
        }}
      >
        <Plus className="w-4 h-4 text-emerald-500" />
        Add New Step
      </button>
      <button
        type="button"
        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50/70 transition-colors"
        onClick={() => {
          onAddCondition(node.id);
          onClose();
        }}
      >
        <GitBranch className="w-4 h-4 text-blue-500" />
        Add Double Branch
      </button>
      {!node.isStart && (
        <>
          <div className="border-t border-slate-100" />
          <button
            type="button"
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => {
              onDeleteNode(node.id);
              onClose();
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete Step
          </button>
        </>
      )}
    </div>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel({
  onQuickAddComponent,
}: {
  onQuickAddComponent: (type: string, label: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = COMPONENTS.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <Plus className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-800">Components</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.map(({ type, label, icon: Icon }) => (
          <button
            type="button"
            key={label}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/x-wf-type", type);
              e.dataTransfer.setData("application/x-wf-label", label);
            }}
            onClick={() => onQuickAddComponent(type, label)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 cursor-grab active:cursor-grabbing group transition-colors text-left"
          >
            <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            <span className="text-xs text-slate-600 group-hover:text-slate-900 font-medium">
              {label}
            </span>
            <GripVertical className="w-3.5 h-3.5 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/60">
        <p className="text-[11px] text-slate-500">
          Drag onto a step or click to attach a field
        </p>
      </div>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

function RightPanel({
  node,
  onUpdate,
  onDelete,
  onRemoveField,
}: {
  node: WorkflowNode | null;
  onUpdate: (id: string, updates: Partial<WorkflowNode>) => void;
  onDelete: (id: string) => void;
  onRemoveField: (nodeId: string, fieldId: string) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [permOpen, setPermOpen] = useState(true);

  if (!node) {
    return (
      <div className="w-80 shrink-0 border-l border-slate-200 bg-white flex items-center justify-center h-full">
        <div className="text-center text-slate-400 px-6">
          <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium text-slate-500">No step selected</p>
          <p className="text-xs mt-1">
            Click any step on the canvas to configure details and permissions
          </p>
        </div>
      </div>
    );
  }

  const perms = node.permissions;
  const grantedCount = Object.values(perms).filter(Boolean).length;
  const fields = node.config?.fields ?? [];

  return (
    <div className="w-80 shrink-0 border-l border-slate-200 bg-white flex flex-col h-full overflow-y-auto">
      {/* Step Details */}
      <div className="border-b border-slate-100">
        <button
          type="button"
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
          onClick={() => setDetailsOpen((v) => !v)}
        >
          <span className="text-sm font-semibold text-slate-800">Step Details</span>
          {detailsOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {detailsOpen && (
          <div className="px-5 pb-5 space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Step Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={node.name}
                onChange={(e) => onUpdate(node.id, { name: e.target.value })}
                className="h-8 text-sm"
                placeholder="Enter step name"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Trigger <span className="text-red-500">*</span>
              </Label>
              <Select
                value={node.config?.triggerEvent ?? "STARTING_FLOW"}
                onValueChange={(v) =>
                  onUpdate(node.id, {
                    config: { ...(node.config ?? {}), triggerEvent: v },
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTING_FLOW">Starting Flow</SelectItem>
                  <SelectItem value="ON_APPROVAL">On Approval</SelectItem>
                  <SelectItem value="ON_REJECTION">On Rejection</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Assign type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={node.assigneeType}
                onValueChange={(v) =>
                  onUpdate(node.id, {
                    assigneeType: v as WorkflowNode["assigneeType"],
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ROLE">Role</SelectItem>
                  <SelectItem value="DEPARTMENT">Department</SelectItem>
                  <SelectItem value="AUTO">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {node.assigneeType !== "AUTO" && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Assignee / Role Target
                </Label>
                <Input
                  value={node.assigneeRef}
                  onChange={(e) =>
                    onUpdate(node.id, { assigneeRef: e.target.value })
                  }
                  className="h-8 text-sm"
                  placeholder="e.g. HR, IT, Manager"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={node.description}
                onChange={(e) =>
                  onUpdate(node.id, { description: e.target.value })
                }
                className="text-sm resize-none"
                rows={3}
                placeholder="Describe what this step does..."
              />
            </div>

            {fields.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Form Components ({fields.length})
                </Label>
                <div className="space-y-1.5">
                  {fields.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <span className="font-medium text-slate-700 truncate">
                        {f.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveField(node.id, f.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Permissions */}
      <div className="border-b border-slate-100">
        <button
          type="button"
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
          onClick={() => setPermOpen((v) => !v)}
        >
          <span className="text-sm font-semibold text-slate-800">Permissions</span>
          {permOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {permOpen && (
          <div className="px-5 pb-5">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              {/* Assignee Row */}
              <div className="px-4 py-3 bg-slate-50 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {node.name}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      {String(grantedCount).padStart(2, "0")} Permissions Granted
                    </p>
                  </div>
                </div>
              </div>

              {/* Read Only */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">
                      Read Only
                    </span>
                  </div>
                  <Switch
                    checked={perms.readOnly}
                    onCheckedChange={(v) =>
                      onUpdate(node.id, { permissions: { ...perms, readOnly: v } })
                    }
                    className="data-[state=checked]:bg-indigo-600 scale-90"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-5">
                  View-only access, no edits allowed
                </p>
              </div>

              {/* Editable */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">
                      Editable
                    </span>
                  </div>
                  <Switch
                    checked={perms.editable}
                    onCheckedChange={(v) =>
                      onUpdate(node.id, { permissions: { ...perms, editable: v } })
                    }
                    className="data-[state=checked]:bg-indigo-600 scale-90"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-5">
                  Full access for modifications allowed
                </p>
              </div>

              {/* Hidden */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">
                      Hidden
                    </span>
                  </div>
                  <Switch
                    checked={perms.hidden}
                    onCheckedChange={(v) =>
                      onUpdate(node.id, { permissions: { ...perms, hidden: v } })
                    }
                    className="data-[state=checked]:bg-indigo-600 scale-90"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-5">
                  Not visible to users or access
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!node.isStart && (
        <div className="p-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDelete(node.id)}
            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Remove Step
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Recursive Canvas Node Renderer ──────────────────────────────────────────

function CanvasNode({
  node,
  nodes,
  edges,
  visited,
  selectedNodeId,
  addMenuNodeId,
  onSelectNode,
  onOpenAddMenu,
  onCloseAddMenu,
  onAddStep,
  onAddCondition,
  onDeleteNode,
  onDropComponent,
}: {
  node: WorkflowNode;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  visited: Set<string>;
  selectedNodeId: string | null;
  addMenuNodeId: string | null;
  onSelectNode: (id: string) => void;
  onOpenAddMenu: (id: string) => void;
  onCloseAddMenu: () => void;
  onAddStep: (afterId: string) => void;
  onAddCondition: (afterId: string) => void;
  onDeleteNode: (id: string) => void;
  onDropComponent: (nodeId: string, type: string, label: string) => void;
}) {
  if (visited.has(node.id)) return null;
  const nextVisited = new Set(visited);
  nextVisited.add(node.id);

  const childEdges = edges.filter((e) => e.fromStepId === node.id);
  const children = childEdges
    .map((e) => ({
      edge: e,
      child: nodes.find((n) => n.id === e.toStepId),
    }))
    .filter((item): item is { edge: WorkflowEdge; child: WorkflowNode } => Boolean(item.child));

  const isSelected = selectedNodeId === node.id;
  const addMenuOpen = addMenuNodeId === node.id;

  if (node.stepType === "CONDITION") {
    const yesBranch = children.find((c) => c.edge.label === "Yes") ?? children[0];
    const noBranch = children.find((c) => c.edge.label === "No") ?? children[1];

    return (
      <div className="flex flex-col items-center">
        <div className="w-px h-4 bg-indigo-200" />
        <NodeCard
          node={node}
          isSelected={isSelected}
          onSelect={() => onSelectNode(node.id)}
          onDropComponent={onDropComponent}
        />

        <div className="relative flex items-start justify-center gap-12 mt-4 pt-4 border-t-2 border-indigo-200/80">
          {yesBranch && (
            <div className="flex flex-col items-center">
              <span className="px-3 py-0.5 -mt-7 mb-3 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-sm">
                Yes
              </span>
              <CanvasNode
                node={yesBranch.child}
                nodes={nodes}
                edges={edges}
                visited={nextVisited}
                selectedNodeId={selectedNodeId}
                addMenuNodeId={addMenuNodeId}
                onSelectNode={onSelectNode}
                onOpenAddMenu={onOpenAddMenu}
                onCloseAddMenu={onCloseAddMenu}
                onAddStep={onAddStep}
                onAddCondition={onAddCondition}
                onDeleteNode={onDeleteNode}
                onDropComponent={onDropComponent}
              />
            </div>
          )}

          {noBranch && (
            <div className="flex flex-col items-center">
              <span className="px-3 py-0.5 -mt-7 mb-3 rounded-full text-[11px] font-bold bg-rose-500 text-white shadow-sm">
                No
              </span>
              <CanvasNode
                node={noBranch.child}
                nodes={nodes}
                edges={edges}
                visited={nextVisited}
                selectedNodeId={selectedNodeId}
                addMenuNodeId={addMenuNodeId}
                onSelectNode={onSelectNode}
                onOpenAddMenu={onOpenAddMenu}
                onCloseAddMenu={onCloseAddMenu}
                onAddStep={onAddStep}
                onAddCondition={onAddCondition}
                onDeleteNode={onDeleteNode}
                onDropComponent={onDropComponent}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        node={node}
        isSelected={isSelected}
        onSelect={() => onSelectNode(node.id)}
        onDropComponent={onDropComponent}
      />

      {/* Connector + Add button */}
      <div className="relative flex flex-col items-center my-0.5">
        <div className="w-px h-4 bg-indigo-200" />
        <div className="relative">
          <button
            type="button"
            title="Add step or branch"
            onClick={(e) => {
              e.stopPropagation();
              addMenuOpen ? onCloseAddMenu() : onOpenAddMenu(node.id);
            }}
            className={cn(
              "px-2.5 h-6 rounded-full text-white text-[11px] font-semibold flex items-center gap-1 shadow-sm transition-all hover:scale-105",
              addMenuOpen
                ? "bg-emerald-600 ring-2 ring-emerald-200"
                : "bg-emerald-500 hover:bg-emerald-600"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
          {addMenuOpen && (
            <AddMenu
              node={node}
              onAddStep={onAddStep}
              onAddCondition={onAddCondition}
              onDeleteNode={onDeleteNode}
              onClose={onCloseAddMenu}
            />
          )}
        </div>
        {children.length > 0 && (
          <>
            <div className="w-px h-4 bg-indigo-200" />
            <ArrowDown className="w-3.5 h-3.5 text-indigo-300 -mt-1.5 mb-1" />
          </>
        )}
      </div>

      {/* Render linear children */}
      {children.map(({ child }) => (
        <CanvasNode
          key={child.id}
          node={child}
          nodes={nodes}
          edges={edges}
          visited={nextVisited}
          selectedNodeId={selectedNodeId}
          addMenuNodeId={addMenuNodeId}
          onSelectNode={onSelectNode}
          onOpenAddMenu={onOpenAddMenu}
          onCloseAddMenu={onCloseAddMenu}
          onAddStep={onAddStep}
          onAddCondition={onAddCondition}
          onDeleteNode={onDeleteNode}
          onDropComponent={onDropComponent}
        />
      ))}
    </div>
  );
}

// ─── Main Designer Component ──────────────────────────────────────────────────

type TemplateShape = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isPublished: boolean;
};

type StepShape = {
  id: string;
  name: string;
  description: string | null;
  stepType: string;
  assigneeType: string;
  assigneeRef: string | null;
  orderIndex: number;
  isStart: boolean;
  isEnd: boolean;
  config?: unknown;
  permissions: unknown;
};

type EdgeShape = {
  id: string;
  fromStepId: string;
  toStepId: string;
  label: string | null;
};

export function WorkflowDesigner({
  template,
  initialSteps,
  initialEdges,
}: {
  template: TemplateShape;
  initialSteps: StepShape[];
  initialEdges: EdgeShape[];
}) {
  const [templateName, setTemplateName] = useState(template.name);
  const [category, setCategory] = useState(template.category);
  const [isPublished, setIsPublished] = useState(template.isPublished);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [zoom, setZoom] = useState(100);

  const initialGraph = (() => {
    if (initialSteps.length > 0) {
      return {
        nodes: initialSteps.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? "",
          stepType: (s.stepType as WorkflowNode["stepType"]) || "USER",
          assigneeType: (s.assigneeType as WorkflowNode["assigneeType"]) || "USER",
          assigneeRef: s.assigneeRef ?? "",
          orderIndex: s.orderIndex,
          isStart: s.isStart,
          isEnd: s.isEnd,
          config: (s.config as WorkflowStepConfig) ?? { triggerEvent: "STARTING_FLOW", fields: [] },
          permissions: (s.permissions as StepPermissions) ?? {
            readOnly: false,
            editable: false,
            hidden: false,
          },
        })),
        edges: initialEdges.map((e) => ({
          id: e.id,
          fromStepId: e.fromStepId,
          toStepId: e.toStepId,
          label: e.label ?? "",
        })),
      };
    }
    return buildDefaultGraph(template.id);
  })();

  const [nodes, setNodes] = useState<WorkflowNode[]>(initialGraph.nodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialGraph.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialGraph.nodes[1]?.id ?? initialGraph.nodes[0]?.id ?? null
  );
  const [addMenuNodeId, setAddMenuNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  function markDirty() {
    setIsDirty(true);
  }

  function updateNode(id: string, updates: Partial<WorkflowNode>) {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
    markDirty();
  }

  function attachComponentToNode(nodeId: string, type: string, label: string) {
    const newField: FormFieldItem = {
      id: uid("field"),
      type,
      label,
      required: false,
    };
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        const existingFields = n.config?.fields ?? [];
        return {
          ...n,
          config: {
            ...(n.config ?? {}),
            fields: [...existingFields, newField],
          },
        };
      })
    );
    setSelectedNodeId(nodeId);
    markDirty();
    toast.success(`Added ${label} to step`);
  }

  function handleQuickAddComponent(type: string, label: string) {
    const target =
      selectedNode && !selectedNode.isStart
        ? selectedNode
        : nodes.find((n) => !n.isStart);
    if (!target) {
      toast.info("Add a step first, then click or drag components onto it");
      return;
    }
    attachComponentToNode(target.id, type, label);
  }

  function removeFieldFromNode(nodeId: string, fieldId: string) {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          config: {
            ...(n.config ?? {}),
            fields: (n.config?.fields ?? []).filter((f) => f.id !== fieldId),
          },
        };
      })
    );
    markDirty();
  }

  function addStep(afterId: string) {
    const afterNode = nodes.find((n) => n.id === afterId);
    const newId = uid("step");
    const newNode: WorkflowNode = {
      id: newId,
      name: "New Approval Step",
      description: "Review and approve task",
      stepType: "USER",
      assigneeType: "ROLE",
      assigneeRef: "Manager",
      orderIndex: (afterNode?.orderIndex ?? 0) + 0.5,
      isStart: false,
      isEnd: false,
      config: { triggerEvent: "ON_APPROVAL", fields: [] },
      permissions: { readOnly: false, editable: true, hidden: false },
    };

    const existingOutEdge = edges.find((e) => e.fromStepId === afterId);
    const newEdges = edges.filter((e) => e.id !== existingOutEdge?.id);
    newEdges.push({
      id: uid("edge"),
      fromStepId: afterId,
      toStepId: newId,
      label: "",
    });
    if (existingOutEdge) {
      newEdges.push({
        id: uid("edge"),
        fromStepId: newId,
        toStepId: existingOutEdge.toStepId,
        label: existingOutEdge.label,
      });
    }

    setNodes((prev) =>
      [...prev, newNode].sort((a, b) => a.orderIndex - b.orderIndex)
    );
    setEdges(newEdges);
    setSelectedNodeId(newId);
    markDirty();
  }

  function addCondition(afterId: string) {
    const afterNode = nodes.find((n) => n.id === afterId);
    const condId = uid("cond");
    const yesId = uid("yes");
    const noId = uid("no");

    const condNode: WorkflowNode = {
      id: condId,
      name: "Condition",
      description: "Evaluate branch condition",
      stepType: "CONDITION",
      assigneeType: "AUTO",
      assigneeRef: "",
      orderIndex: (afterNode?.orderIndex ?? 0) + 0.5,
      isStart: false,
      isEnd: false,
      config: { triggerEvent: "ON_APPROVAL", fields: [] },
      permissions: { readOnly: false, editable: false, hidden: false },
    };
    const yesNode: WorkflowNode = {
      id: yesId,
      name: "IT Administrator",
      description: "Create IT Accounts and Access",
      stepType: "USER",
      assigneeType: "ROLE",
      assigneeRef: "IT",
      orderIndex: condNode.orderIndex + 0.5,
      isStart: false,
      isEnd: true,
      config: { triggerEvent: "ON_APPROVAL", fields: [] },
      permissions: { readOnly: false, editable: true, hidden: false },
    };
    const noNode: WorkflowNode = {
      id: noId,
      name: "HR Coordinator",
      description: "Request missing information",
      stepType: "USER",
      assigneeType: "ROLE",
      assigneeRef: "HR",
      orderIndex: condNode.orderIndex + 0.6,
      isStart: false,
      isEnd: true,
      config: { triggerEvent: "ON_REJECTION", fields: [] },
      permissions: { readOnly: true, editable: true, hidden: false },
    };

    const existingOut = edges.find((e) => e.fromStepId === afterId);
    const newEdgesArr = edges.filter((e) => e.id !== existingOut?.id);
    newEdgesArr.push(
      { id: uid("edge"), fromStepId: afterId, toStepId: condId, label: "" },
      { id: uid("edge"), fromStepId: condId, toStepId: yesId, label: "Yes" },
      { id: uid("edge"), fromStepId: condId, toStepId: noId, label: "No" }
    );
    if (existingOut) {
      newEdgesArr.push({
        id: uid("edge"),
        fromStepId: yesId,
        toStepId: existingOut.toStepId,
        label: existingOut.label,
      });
    }

    setNodes((prev) => [...prev, condNode, yesNode, noNode]);
    setEdges(newEdgesArr);
    setSelectedNodeId(condId);
    markDirty();
  }

  function deleteNode(id: string) {
    const target = nodes.find((n) => n.id === id);
    if (!target || target.isStart) return;

    const incoming = edges.find((e) => e.toStepId === id);
    const outgoing = edges.filter((e) => e.fromStepId === id);
    const newEdges = edges.filter((e) => e.fromStepId !== id && e.toStepId !== id);

    if (incoming && outgoing.length === 1) {
      newEdges.push({
        id: uid("edge"),
        fromStepId: incoming.fromStepId,
        toStepId: outgoing[0].toStepId,
        label: incoming.label,
      });
    }

    setEdges(newEdges);
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    markDirty();
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await updateWorkflowTemplateAction(template.id, {
        name: templateName,
        category,
        steps: nodes.map((n, i) => ({
          id: n.id,
          name: n.name,
          description: n.description || undefined,
          stepType: n.stepType,
          assigneeType: n.assigneeType,
          assigneeRef: n.assigneeRef || undefined,
          orderIndex: i,
          isStart: n.isStart,
          isEnd: n.isEnd,
          config: n.config,
          permissions: n.permissions,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          fromStepId: e.fromStepId,
          toStepId: e.toStepId,
          label: e.label || undefined,
        })),
      });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      setIsDirty(false);
      toast.success("Workflow saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    setIsPublishing(true);
    try {
      if (isDirty) {
        await handleSave();
      }
      const res = await publishWorkflowTemplateAction(template.id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      const next = !isPublished;
      setIsPublished(next);
      toast.success(next ? "Workflow published" : "Workflow unpublished");
    } finally {
      setIsPublishing(false);
    }
  }

  const rootNode = nodes.find((n) => n.isStart) ?? nodes[0];

  const reachableIds = new Set<string>();
  const markReachable = (id: string) => {
    if (reachableIds.has(id)) return;
    reachableIds.add(id);
    edges.filter((e) => e.fromStepId === id).forEach((e) => markReachable(e.toStepId));
  };
  if (rootNode) markReachable(rootNode.id);
  const orphanNodes = nodes.filter((n) => !reachableIds.has(n.id));

  return (
    <div
      className="-m-3 sm:-m-6 flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden"
      onClick={() => {
        setAddMenuNodeId(null);
      }}
    >
      {/* Left Panel */}
      <LeftPanel onQuickAddComponent={handleQuickAddComponent} />

      {/* Center Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Canvas Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 shrink-0">
          <Link href="/workflows">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GitBranch className="w-4 h-4 text-indigo-500 shrink-0" />
            <input
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                markDirty();
              }}
              className="text-sm font-semibold text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-indigo-300 outline-none focus:ring-1 focus:ring-indigo-300 rounded px-2 py-1 min-w-0 w-56"
            />
            <Select
              value={category}
              onValueChange={(v) => {
                setCategory(v);
                markDirty();
              }}
            >
              <SelectTrigger className="h-7 text-xs w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                <SelectItem value="OFFBOARDING">Offboarding</SelectItem>
                <SelectItem value="LEAVE">Leave</SelectItem>
                <SelectItem value="DYNAMIC_FORM">Dynamic Form</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Zoom Controls */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoom((z) => Math.max(70, z - 10))}
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] font-medium text-slate-600 px-1.5 w-11 text-center">
              {zoom}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoom((z) => Math.min(130, z + 10))}
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoom(100)}
              title="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isDirty && (
              <span className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Unsaved
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handlePublish}
              disabled={isPublishing || isSaving}
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {/* Canvas Body with soft dot-grid */}
        <div
          className="flex-1 overflow-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] bg-slate-50/70"
          onClick={() => {
            setAddMenuNodeId(null);
            setSelectedNodeId(null);
          }}
        >
          <div
            className="min-h-full flex flex-col items-center py-10 px-6 origin-top transition-transform"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {rootNode && (
              <div onClick={(e) => e.stopPropagation()}>
                <CanvasNode
                  node={rootNode}
                  nodes={nodes}
                  edges={edges}
                  visited={new Set()}
                  selectedNodeId={selectedNodeId}
                  addMenuNodeId={addMenuNodeId}
                  onSelectNode={(id) => setSelectedNodeId(id)}
                  onOpenAddMenu={(id) => setAddMenuNodeId(id)}
                  onCloseAddMenu={() => setAddMenuNodeId(null)}
                  onAddStep={addStep}
                  onAddCondition={addCondition}
                  onDeleteNode={deleteNode}
                  onDropComponent={attachComponentToNode}
                />
              </div>
            )}

            {orphanNodes.length > 0 && (
              <div className="mt-8 pt-6 border-t border-dashed border-slate-300 flex flex-wrap gap-4 justify-center">
                {orphanNodes.map((orphan) => (
                  <div
                    key={orphan.id}
                    className="opacity-75"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <NodeCard
                      node={orphan}
                      isSelected={selectedNodeId === orphan.id}
                      onSelect={() => setSelectedNodeId(orphan.id)}
                      onDropComponent={attachComponentToNode}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div onClick={(e) => e.stopPropagation()}>
        <RightPanel
          node={selectedNode}
          onUpdate={updateNode}
          onDelete={deleteNode}
          onRemoveField={removeFieldFromNode}
        />
      </div>
    </div>
  );
}
