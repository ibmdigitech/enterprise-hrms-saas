"use client";

import { useState, useCallback, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, GitBranch, User, Settings2, Bell, FileText,
  Eye, Edit3, EyeOff, ChevronDown, ArrowDown, Save, Play,
  Zap, Users, Building2, CheckSquare, AlignJustify, Table2,
  ToggleLeft, Paperclip, Radio, Search, X, MoreVertical,
  ArrowLeft, ChevronRight, ChevronUp, GripVertical, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateWorkflowTemplateAction, publishWorkflowTemplateAction } from "../workflow-actions";

// ─── Types ───────────────────────────────────────────────────────────────────

type StepPermissions = { readOnly: boolean; editable: boolean; hidden: boolean };

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
  permissions: StepPermissions;
  branchNodes?: { yes?: string; no?: string }; // child node IDs for CONDITION
};

type WorkflowEdge = {
  id: string;
  fromStepId: string;
  toStepId: string;
  label: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STEP_TYPE_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  TRIGGER: { label: "Trigger", color: "text-indigo-700", bg: "bg-indigo-500", border: "border-indigo-500", icon: Zap },
  USER:    { label: "User Step", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-300", icon: User },
  CONDITION: { label: "Condition", color: "text-emerald-700", bg: "bg-emerald-500", border: "border-emerald-500", icon: GitBranch },
  NOTIFICATION: { label: "Notification", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", icon: Bell },
  SYSTEM: { label: "System", color: "text-slate-700", bg: "bg-slate-50", border: "border-slate-300", icon: Settings2 },
};

const ROLE_COLORS: Record<string, string> = {
  HR: "bg-violet-100 border-violet-300 text-violet-700",
  IT: "bg-teal-100 border-teal-300 text-teal-700",
  MANAGER: "bg-blue-100 border-blue-300 text-blue-700",
  ADMIN: "bg-orange-100 border-orange-300 text-orange-700",
  USER: "bg-rose-50 border-rose-300 text-rose-700",
};

const COMPONENTS = [
  { label: "Form Field", icon: FileText },
  { label: "Sections", icon: AlignJustify },
  { label: "Tables", icon: Table2 },
  { label: "Checkbox", icon: CheckSquare },
  { label: "Drop down", icon: ChevronDown },
  { label: "Toggle Button", icon: ToggleLeft },
  { label: "Attachments", icon: Paperclip },
  { label: "Radio Button", icon: Radio },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getRoleCardClass(ref: string) {
  for (const [key, cls] of Object.entries(ROLE_COLORS)) {
    if (ref?.toUpperCase().includes(key)) return cls;
  }
  return "bg-slate-50 border-slate-300 text-slate-700";
}

// ─── Default initial state ────────────────────────────────────────────────────

const DEFAULT_NODES: WorkflowNode[] = [
  {
    id: "trigger",
    name: "Trigger",
    description: "",
    stepType: "TRIGGER",
    assigneeType: "AUTO",
    assigneeRef: "",
    orderIndex: 0,
    isStart: true,
    isEnd: false,
    permissions: { readOnly: false, editable: false, hidden: false },
  },
  {
    id: "step-user",
    name: "User Step",
    description: "Start Onboarding Process",
    stepType: "USER",
    assigneeType: "USER",
    assigneeRef: "Employee",
    orderIndex: 1,
    isStart: false,
    isEnd: false,
    permissions: { readOnly: false, editable: true, hidden: false },
  },
  {
    id: "step-hr",
    name: "HR Coordinator",
    description: "Complete Document Verification",
    stepType: "USER",
    assigneeType: "ROLE",
    assigneeRef: "HR",
    orderIndex: 2,
    isStart: false,
    isEnd: false,
    permissions: { readOnly: true, editable: true, hidden: false },
  },
];

const DEFAULT_EDGES: WorkflowEdge[] = [
  { id: "e1", fromStepId: "trigger", toStepId: "step-user", label: "" },
  { id: "e2", fromStepId: "step-user", toStepId: "step-hr", label: "" },
];

// ─── Node Card ────────────────────────────────────────────────────────────────

function NodeCard({
  node,
  isSelected,
  onSelect,
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const meta = STEP_TYPE_META[node.stepType] ?? STEP_TYPE_META.USER;
  const Icon = meta.icon;

  if (node.stepType === "TRIGGER") {
    return (
      <button
        onClick={onSelect}
        className={cn(
          "px-6 py-2 rounded-full text-white text-sm font-semibold flex items-center gap-2 shadow transition-all",
          isSelected ? "bg-indigo-700 ring-2 ring-indigo-300 ring-offset-2" : "bg-indigo-500 hover:bg-indigo-600"
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
        onClick={onSelect}
        className={cn(
          "px-5 py-2 rounded-full text-white text-sm font-semibold flex items-center gap-2 shadow transition-all",
          isSelected ? "bg-emerald-700 ring-2 ring-emerald-300 ring-offset-2" : "bg-emerald-500 hover:bg-emerald-600"
        )}
      >
        <Icon className="w-4 h-4" />
        Condition
      </button>
    );
  }

  const cardClass = getRoleCardClass(node.assigneeRef);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-64 rounded-xl border-2 bg-white shadow-sm text-left transition-all hover:shadow-md",
        isSelected ? "ring-2 ring-indigo-400 ring-offset-2 border-indigo-400" : meta.border
      )}
    >
      <div className={cn("px-4 py-3 rounded-t-lg flex items-center gap-2", cardClass, "border-b")}>
        <div className="w-6 h-6 rounded-md bg-white/60 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wide">{node.name}</span>
      </div>
      {node.description && (
        <div className="px-4 py-2.5">
          <p className="text-xs text-slate-500 leading-relaxed">{node.description}</p>
        </div>
      )}
      {node.assigneeRef && (
        <div className="px-4 pb-3 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="w-3 h-3 text-slate-500" />
          </div>
          <span className="text-[11px] text-slate-400">{node.assigneeRef}</span>
        </div>
      )}
    </button>
  );
}

// ─── Add Menu ─────────────────────────────────────────────────────────────────

function AddMenu({
  nodeId,
  onAddStep,
  onAddCondition,
  onDeleteAfter,
  onClose,
}: {
  nodeId: string;
  onAddStep: (afterId: string) => void;
  onAddCondition: (afterId: string) => void;
  onDeleteAfter: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute z-50 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden w-48" style={{ top: "100%", left: "50%", transform: "translateX(-50%)" }}>
      <button
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        onClick={() => { onAddStep(nodeId); onClose(); }}
      >
        <Plus className="w-4 h-4 text-emerald-500" />
        Add New Step
      </button>
      <button
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        onClick={() => { onAddCondition(nodeId); onClose(); }}
      >
        <GitBranch className="w-4 h-4 text-blue-500" />
        Add Double Branch
      </button>
      <div className="border-t border-slate-100" />
      <button
        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        onClick={() => { onDeleteAfter(nodeId); onClose(); }}
      >
        <Trash2 className="w-4 h-4" />
        Delete Step
      </button>
    </div>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel() {
  const [search, setSearch] = useState("");
  const filtered = COMPONENTS.filter((c) =>
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-indigo-500 flex items-center justify-center">
            <Plus className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-700">Components</span>
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

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-grab active:cursor-grabbing group transition-colors"
            draggable
          >
            <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
            <span className="text-xs text-slate-600 group-hover:text-slate-800 font-medium">{label}</span>
            <GripVertical className="w-3.5 h-3.5 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-slate-100">
        <span className="text-[10px] text-slate-400">akriviahcm.com</span>
      </div>
    </div>
  );
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

function RightPanel({
  node,
  onUpdate,
}: {
  node: WorkflowNode | null;
  onUpdate: (id: string, updates: Partial<WorkflowNode>) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [permOpen, setPermOpen] = useState(true);

  if (!node) {
    return (
      <div className="w-80 shrink-0 border-l border-slate-200 bg-white flex items-center justify-center">
        <div className="text-center text-slate-400 px-6">
          <GitBranch className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a step to edit its details</p>
        </div>
      </div>
    );
  }

  const perms = node.permissions;

  return (
    <div className="w-80 shrink-0 border-l border-slate-200 bg-white flex flex-col h-full overflow-y-auto">
      {/* Step Details */}
      <div className="border-b border-slate-100">
        <button
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
          onClick={() => setDetailsOpen((v) => !v)}
        >
          <span className="text-sm font-semibold text-slate-700">Step Details</span>
          {detailsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {detailsOpen && (
          <div className="px-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
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
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Trigger <span className="text-red-500">*</span>
              </Label>
              <Select defaultValue="STARTING_FLOW">
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
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Assign type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={node.assigneeType}
                onValueChange={(v) => onUpdate(node.id, { assigneeType: v as WorkflowNode["assigneeType"] })}
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

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={node.description}
                onChange={(e) => onUpdate(node.id, { description: e.target.value })}
                className="text-sm resize-none"
                rows={3}
                placeholder="Describe what this step does..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Permissions */}
      <div>
        <button
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
          onClick={() => setPermOpen((v) => !v)}
        >
          <span className="text-sm font-semibold text-slate-700">Permissions</span>
          {permOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {permOpen && (
          <div className="px-5 pb-5">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              {/* Assignee Row */}
              <div className="px-4 py-3 bg-slate-50 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{node.name}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      {Object.values(perms).filter(Boolean).length * 1 + 1} Permissions Granted
                    </p>
                  </div>
                </div>
              </div>

              {/* Read Only */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">Read Only</span>
                  </div>
                  <Switch
                    checked={perms.readOnly}
                    onCheckedChange={(v) =>
                      onUpdate(node.id, { permissions: { ...perms, readOnly: v } })
                    }
                    className="data-[state=checked]:bg-blue-500 scale-90"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-5">View-only access, no edits allowed</p>
              </div>

              {/* Editable */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">Editable</span>
                  </div>
                  <Switch
                    checked={perms.editable}
                    onCheckedChange={(v) =>
                      onUpdate(node.id, { permissions: { ...perms, editable: v } })
                    }
                    className="data-[state=checked]:bg-blue-500 scale-90"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-5">Full access for modifications allowed</p>
              </div>

              {/* Hidden */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">Hidden</span>
                  </div>
                  <Switch
                    checked={perms.hidden}
                    onCheckedChange={(v) =>
                      onUpdate(node.id, { permissions: { ...perms, hidden: v } })
                    }
                    className="data-[state=checked]:bg-blue-500 scale-90"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-5">Not visible to users or access</p>
              </div>
            </div>

            <button className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View Global Permissions →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Canvas Node Renderer ────────────────────────────────────────────────

function CanvasNode({
  node,
  nodes,
  edges,
  isSelected,
  addMenuOpen,
  onSelect,
  onOpenAddMenu,
  onCloseAddMenu,
  onAddStep,
  onAddCondition,
  onDelete,
}: {
  node: WorkflowNode;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isSelected: boolean;
  addMenuOpen: boolean;
  onSelect: () => void;
  onOpenAddMenu: () => void;
  onCloseAddMenu: () => void;
  onAddStep: (afterId: string) => void;
  onAddCondition: (afterId: string) => void;
  onDelete: (id: string) => void;
}) {
  // Find children via edges
  const childEdges = edges.filter((e) => e.fromStepId === node.id);
  const children = childEdges
    .map((e) => nodes.find((n) => n.id === e.toStepId))
    .filter(Boolean) as WorkflowNode[];

  if (node.stepType === "CONDITION") {
    const yesChild = children.find((_, i) => childEdges[i]?.label === "Yes");
    const noChild = children.find((_, i) => childEdges[i]?.label === "No");
    const yes = yesChild ?? children[0];
    const no = noChild ?? children[1];

    return (
      <div className="flex flex-col items-center">
        <NodeCard node={node} isSelected={isSelected} onSelect={onSelect} />
        <div className="flex gap-16 mt-4">
          {/* Yes branch */}
          {yes && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white">Yes</span>
              </div>
              <CanvasNode
                node={yes}
                nodes={nodes}
                edges={edges}
                isSelected={isSelected && yes.id === yes.id}
                addMenuOpen={false}
                onSelect={() => onSelect()}
                onOpenAddMenu={onOpenAddMenu}
                onCloseAddMenu={onCloseAddMenu}
                onAddStep={onAddStep}
                onAddCondition={onAddCondition}
                onDelete={onDelete}
              />
            </div>
          )}
          {/* No branch */}
          {no && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 mb-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white">No</span>
              </div>
              <CanvasNode
                node={no}
                nodes={nodes}
                edges={edges}
                isSelected={isSelected && no.id === no.id}
                addMenuOpen={false}
                onSelect={() => onSelect()}
                onOpenAddMenu={onOpenAddMenu}
                onCloseAddMenu={onCloseAddMenu}
                onAddStep={onAddStep}
                onAddCondition={onAddCondition}
                onDelete={onDelete}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <NodeCard node={node} isSelected={isSelected} onSelect={onSelect} />

      {/* Add button between nodes */}
      <div className="relative flex flex-col items-center my-1">
        <div className="w-px h-5 bg-slate-200" />
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); addMenuOpen ? onCloseAddMenu() : onOpenAddMenu(); }}
            className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-sm transition-all hover:scale-110"
          >
            <Plus className="w-4 h-4" />
          </button>
          {addMenuOpen && (
            <AddMenu
              nodeId={node.id}
              onAddStep={onAddStep}
              onAddCondition={onAddCondition}
              onDeleteAfter={onDelete}
              onClose={onCloseAddMenu}
            />
          )}
        </div>
        <div className="w-px h-5 bg-slate-200" />
        <ArrowDown className="w-3.5 h-3.5 text-slate-300 -mt-1" />
      </div>

      {/* Render linear children */}
      {children.map((child) => (
        <CanvasNode
          key={child.id}
          node={child}
          nodes={nodes}
          edges={edges}
          isSelected={isSelected}
          addMenuOpen={false}
          onSelect={onSelect}
          onOpenAddMenu={onOpenAddMenu}
          onCloseAddMenu={onCloseAddMenu}
          onAddStep={onAddStep}
          onAddCondition={onAddCondition}
          onDelete={onDelete}
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
  const router = useRouter();

  const [templateName, setTemplateName] = useState(template.name);
  const [category, setCategory] = useState(template.category);
  const [isPublished, setIsPublished] = useState(template.isPublished);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Convert DB steps → local nodes
  const toNodes = (steps: StepShape[]): WorkflowNode[] =>
    steps.length > 0
      ? steps.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? "",
          stepType: s.stepType as WorkflowNode["stepType"],
          assigneeType: s.assigneeType as WorkflowNode["assigneeType"],
          assigneeRef: s.assigneeRef ?? "",
          orderIndex: s.orderIndex,
          isStart: s.isStart,
          isEnd: s.isEnd,
          permissions: (s.permissions as StepPermissions) ?? { readOnly: false, editable: false, hidden: false },
        }))
      : DEFAULT_NODES;

  const toEdges = (edgesRaw: EdgeShape[]): WorkflowEdge[] =>
    edgesRaw.length > 0
      ? edgesRaw.map((e) => ({ id: e.id, fromStepId: e.fromStepId, toStepId: e.toStepId, label: e.label ?? "" }))
      : DEFAULT_EDGES;

  const [nodes, setNodes] = useState<WorkflowNode[]>(() => toNodes(initialSteps));
  const [edges, setEdges] = useState<WorkflowEdge[]>(() => toEdges(initialEdges));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [addMenuNodeId, setAddMenuNodeId] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;

  function markDirty() { setIsDirty(true); setSaveMsg(null); }

  function updateNode(id: string, updates: Partial<WorkflowNode>) {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, ...updates } : n));
    markDirty();
  }

  function addStep(afterId: string) {
    const afterNode = nodes.find((n) => n.id === afterId);
    const newId = uid();
    const newNode: WorkflowNode = {
      id: newId,
      name: "New Step",
      description: "",
      stepType: "USER",
      assigneeType: "USER",
      assigneeRef: "",
      orderIndex: (afterNode?.orderIndex ?? 0) + 0.5,
      isStart: false,
      isEnd: false,
      permissions: { readOnly: false, editable: false, hidden: false },
    };

    // Find what afterId's outgoing edge pointed to, re-route it
    const existingOutEdge = edges.find((e) => e.fromStepId === afterId);
    const newEdges = edges.filter((e) => e.id !== existingOutEdge?.id);
    newEdges.push({ id: uid(), fromStepId: afterId, toStepId: newId, label: "" });
    if (existingOutEdge) {
      newEdges.push({ id: uid(), fromStepId: newId, toStepId: existingOutEdge.toStepId, label: "" });
    }

    setNodes((prev) => [...prev, newNode].sort((a, b) => a.orderIndex - b.orderIndex));
    setEdges(newEdges);
    setSelectedNodeId(newId);
    markDirty();
  }

  function addCondition(afterId: string) {
    const afterNode = nodes.find((n) => n.id === afterId);
    const condId = uid();
    const yesId = uid();
    const noId = uid();

    const condNode: WorkflowNode = {
      id: condId, name: "Condition", description: "Check conditions",
      stepType: "CONDITION", assigneeType: "AUTO", assigneeRef: "",
      orderIndex: (afterNode?.orderIndex ?? 0) + 0.5,
      isStart: false, isEnd: false,
      permissions: { readOnly: false, editable: false, hidden: false },
    };
    const yesNode: WorkflowNode = {
      id: yesId, name: "On Approval", description: "Approved path",
      stepType: "USER", assigneeType: "ROLE", assigneeRef: "Manager",
      orderIndex: condNode.orderIndex + 0.5,
      isStart: false, isEnd: false,
      permissions: { readOnly: false, editable: true, hidden: false },
    };
    const noNode: WorkflowNode = {
      id: noId, name: "On Rejection", description: "Rejected path",
      stepType: "USER", assigneeType: "ROLE", assigneeRef: "HR",
      orderIndex: condNode.orderIndex + 0.6,
      isStart: false, isEnd: false,
      permissions: { readOnly: true, editable: false, hidden: false },
    };

    const existingOut = edges.find((e) => e.fromStepId === afterId);
    const newEdgesArr = edges.filter((e) => e.id !== existingOut?.id);
    newEdgesArr.push(
      { id: uid(), fromStepId: afterId, toStepId: condId, label: "" },
      { id: uid(), fromStepId: condId, toStepId: yesId, label: "Yes" },
      { id: uid(), fromStepId: condId, toStepId: noId, label: "No" },
    );

    setNodes((prev) => [...prev, condNode, yesNode, noNode]);
    setEdges(newEdgesArr);
    setSelectedNodeId(condId);
    markDirty();
  }

  function deleteNode(id: string) {
    if (id === "trigger") return;
    // Remove edges involving this node
    const incoming = edges.find((e) => e.toStepId === id);
    const outgoing = edges.find((e) => e.fromStepId === id);
    let newEdges = edges.filter((e) => e.fromStepId !== id && e.toStepId !== id);
    // Reconnect parent → child if both existed
    if (incoming && outgoing) {
      newEdges.push({ id: uid(), fromStepId: incoming.fromStepId, toStepId: outgoing.toStepId, label: "" });
    }
    setEdges(newEdges);
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    markDirty();
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateWorkflowTemplateAction(template.id, {
        name: templateName,
        category,
        steps: nodes.map((n, i) => ({ ...n, orderIndex: i, description: n.description || undefined })),
        edges: edges.map((e) => ({ ...e, label: e.label || undefined })),
      });
      setIsDirty(false);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      console.error(err);
      setSaveMsg("Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublish() {
    await publishWorkflowTemplateAction(template.id);
    setIsPublished((v) => !v);
  }

  // Find root (start) node
  const rootNode = nodes.find((n) => n.isStart) ?? nodes[0];

  return (
    <div
      className="flex h-screen bg-slate-50 overflow-hidden"
      onClick={() => { setAddMenuNodeId(null); setSelectedNodeId(null); }}
    >
      {/* Left Panel */}
      <LeftPanel />

      {/* Center Canvas */}
      <div className="flex-1 flex flex-col min-w-0" onClick={(e) => e.stopPropagation()}>
        {/* Canvas Header */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center gap-3 shrink-0">
          <Link href="/workflows">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GitBranch className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={templateName}
              onChange={(e) => { setTemplateName(e.target.value); markDirty(); }}
              className="text-sm font-semibold text-slate-700 bg-transparent border-0 outline-none focus:ring-1 focus:ring-indigo-300 rounded px-1 py-0.5 min-w-0 w-48"
            />
            <Select value={category} onValueChange={(v) => { setCategory(v); markDirty(); }}>
              <SelectTrigger className="h-7 text-xs w-32 ml-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                <SelectItem value="OFFBOARDING">Offboarding</SelectItem>
                <SelectItem value="LEAVE">Leave</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {saveMsg && (
              <span className={cn("text-xs font-medium", saveMsg === "Saved!" ? "text-emerald-600" : "text-red-500")}>
                {saveMsg}
              </span>
            )}
            {isDirty && !saveMsg && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Unsaved
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handlePublish}
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button
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

        {/* Canvas Body */}
        <div className="flex-1 overflow-auto">
          <div className="min-h-full flex flex-col items-center py-10 px-6">
            {rootNode && (
              <div onClick={(e) => e.stopPropagation()}>
                <CanvasNode
                  node={rootNode}
                  nodes={nodes}
                  edges={edges}
                  isSelected={selectedNodeId === rootNode.id}
                  addMenuOpen={addMenuNodeId === rootNode.id}
                  onSelect={() => setSelectedNodeId(rootNode.id)}
                  onOpenAddMenu={() => setAddMenuNodeId(rootNode.id)}
                  onCloseAddMenu={() => setAddMenuNodeId(null)}
                  onAddStep={addStep}
                  onAddCondition={addCondition}
                  onDelete={deleteNode}
                />
              </div>
            )}

            {/* Render orphan nodes not reachable from root */}
            {nodes
              .filter((n) => {
                if (n.id === rootNode?.id) return false;
                const reachable = new Set<string>();
                const visit = (id: string) => {
                  if (reachable.has(id)) return;
                  reachable.add(id);
                  edges.filter((e) => e.fromStepId === id).forEach((e) => visit(e.toStepId));
                };
                if (rootNode) visit(rootNode.id);
                return !reachable.has(n.id);
              })
              .map((orphan) => (
                <div key={orphan.id} className="mt-6 opacity-50" onClick={(e) => e.stopPropagation()}>
                  <NodeCard
                    node={orphan}
                    isSelected={selectedNodeId === orphan.id}
                    onSelect={() => setSelectedNodeId(orphan.id)}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div onClick={(e) => e.stopPropagation()}>
        <RightPanel node={selectedNode} onUpdate={updateNode} />
      </div>
    </div>
  );
}
