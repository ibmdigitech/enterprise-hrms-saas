"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    Save,
    RotateCcw,
    Search,
    ShieldCheck,
    CreditCard,
    Calendar,
    Briefcase,
    FileUp,
    Workflow,
    Bell,
    Info,
    Settings2,
    CheckCircle2,
    Building2,
    FileText,
    AlertCircle,
    Undo2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigItem {
    id: string;
    module: string;
    key: string;
    label: string;
    description: string | null;
    type: string;
    value: string;
    options?: unknown;
    isActive: boolean;
}

const MODULES = [
    { id: 'PLATFORM',      label: 'Platform',     icon: ShieldCheck },
    { id: 'payroll',       label: 'Payroll',      icon: CreditCard },
    { id: 'attendance',    label: 'Attendance',   icon: Calendar },
    { id: 'leave',         label: 'Leave',        icon: Briefcase },
    { id: 'visa',          label: 'Visa & Docs',  icon: FileUp },
    { id: 'letters',       label: 'Letters',      icon: FileText },
    { id: 'notifications', label: 'Alerts',       icon: Bell },
    { id: 'COMPANY',       label: 'Company',      icon: Building2 },
    { id: 'workflow',      label: 'Workflow',     icon: Workflow },
];

export default function ConfigPageClient() {
    // Original configs from server
    const [configs, setConfigs] = useState<ConfigItem[]>([]);
    // Working draft values keyed by config ID
    const [draftValues, setDraftValues] = useState<Record<string, string>>({});
    // Set of config IDs successfully saved recently (for green checkmark badge)
    const [recentlySaved, setRecentlySaved] = useState<Set<string>>(new Set());

    const [loading, setLoading] = useState(true);
    const [savingItem, setSavingItem] = useState<string | null>(null);
    const [savingAll, setSavingAll] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<string>("PLATFORM");

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/configs');
            if (!res.ok) throw new Error();
            const data: ConfigItem[] = await res.json();
            setConfigs(data);
            
            // Initialize draft values
            const initialDrafts: Record<string, string> = {};
            data.forEach((c) => {
                initialDrafts[c.id] = c.value ?? "";
            });
            setDraftValues(initialDrafts);
        } catch {
            toast.error("Failed to load configurations");
        } finally {
            setLoading(false);
        }
    };

    // Calculate changed items
    const dirtyConfigIds = useMemo(() => {
        const dirty = new Set<string>();
        configs.forEach((c) => {
            const draft = draftValues[c.id];
            if (draft !== undefined && draft !== c.value) {
                dirty.add(c.id);
            }
        });
        return dirty;
    }, [configs, draftValues]);

    const hasUnsavedChanges = dirtyConfigIds.size > 0;

    const handleDraftChange = (id: string, value: string) => {
        setDraftValues((prev) => ({ ...prev, [id]: value }));
    };

    const handleDiscardChange = (config: ConfigItem) => {
        setDraftValues((prev) => ({ ...prev, [config.id]: config.value ?? "" }));
    };

    const handleDiscardAll = () => {
        const resetDrafts: Record<string, string> = {};
        configs.forEach((c) => {
            resetDrafts[c.id] = c.value ?? "";
        });
        setDraftValues(resetDrafts);
        toast.info("All unsaved changes discarded");
    };

    // Save a single configuration
    const handleSaveSingle = async (config: ConfigItem) => {
        const newValue = draftValues[config.id] ?? config.value;
        setSavingItem(config.id);

        try {
            const res = await fetch('/api/configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...config, value: newValue }),
            });

            if (!res.ok) throw new Error();

            const updated: ConfigItem = await res.json();
            setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setDraftValues((prev) => ({ ...prev, [updated.id]: updated.value }));

            // Trigger success indicator
            setRecentlySaved((prev) => new Set(prev).add(config.id));
            setTimeout(() => {
                setRecentlySaved((prev) => {
                    const next = new Set(prev);
                    next.delete(config.id);
                    return next;
                });
            }, 3000);

            toast.success(`"${config.label}" saved and applied!`);
        } catch {
            toast.error(`Failed to save "${config.label}"`);
        } finally {
            setSavingItem(null);
        }
    };

    // Save all unsaved configuration changes in one click
    const handleSaveAll = async () => {
        if (!hasUnsavedChanges) return;

        setSavingAll(true);
        const configsToUpdate = configs.filter((c) => dirtyConfigIds.has(c.id));
        let successCount = 0;
        let failCount = 0;

        try {
            for (const config of configsToUpdate) {
                const newValue = draftValues[config.id] ?? config.value;
                const res = await fetch('/api/configs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...config, value: newValue }),
                });

                if (res.ok) {
                    const updated: ConfigItem = await res.json();
                    setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                    setDraftValues((prev) => ({ ...prev, [updated.id]: updated.value }));
                    setRecentlySaved((prev) => new Set(prev).add(config.id));
                    successCount++;
                } else {
                    failCount++;
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully applied ${successCount} configuration change${successCount > 1 ? 's' : ''}!`);
            }
            if (failCount > 0) {
                toast.error(`Failed to apply ${failCount} configuration(s).`);
            }

            setTimeout(() => {
                setRecentlySaved(new Set());
            }, 3500);
        } catch {
            toast.error("Error saving configurations");
        } finally {
            setSavingAll(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("Are you sure you want to reset all configurations to system defaults? This cannot be undone.")) return;

        setResetting(true);
        try {
            const res = await fetch('/api/configs/reset', { method: 'POST' });
            if (!res.ok) throw new Error();
            await fetchConfigs();
            toast.success("Configurations reset to default");
        } catch {
            toast.error("Failed to reset configurations");
        } finally {
            setResetting(false);
        }
    };

    // Filter by search and normalize module comparison
    const filteredConfigs = configs.filter((c) =>
        c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.module.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderConfigField = (config: ConfigItem) => {
        const isSaving = savingItem === config.id || savingAll;
        const currentValue = draftValues[config.id] !== undefined ? draftValues[config.id] : config.value;
        const normalizedType = (config.type || "text").toLowerCase();

        switch (normalizedType) {
            case 'boolean':
                return (
                    <div className="flex items-center space-x-3">
                        <Switch
                            checked={currentValue === 'true'}
                            onCheckedChange={(checked) => handleDraftChange(config.id, checked ? 'true' : 'false')}
                            disabled={isSaving}
                        />
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {currentValue === 'true' ? 'Enabled' : 'Disabled'}
                        </Label>
                    </div>
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleDraftChange(config.id, e.target.value)}
                        className="max-w-[170px] h-9 text-sm font-medium"
                        disabled={isSaving}
                    />
                );
            case 'select': {
                const configured = Array.isArray(config.options)
                    ? (config.options as unknown[]).filter((o) => typeof o === 'string') as string[]
                    : [];
                const options = configured.length > 0
                    ? configured
                    : currentValue
                        ? [currentValue]
                        : ['Monthly', 'Weekly', 'Bi-weekly'];

                return (
                    <div className="space-y-1.5">
                        <Select
                            value={currentValue || undefined}
                            onValueChange={(val) => handleDraftChange(config.id, val)}
                            disabled={isSaving}
                        >
                            <SelectTrigger className="max-w-[220px] h-9">
                                <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-slate-400">
                            {options.length} option{options.length === 1 ? "" : "s"}
                        </p>
                    </div>
                );
            }
            case 'json':
                return (
                    <div className="space-y-2">
                        <textarea
                            className="w-full h-24 p-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                            value={currentValue}
                            onChange={(e) => handleDraftChange(config.id, e.target.value)}
                            disabled={isSaving}
                        />
                        <p className="text-[10px] text-slate-400">Must be valid JSON array or object</p>
                    </div>
                );
            default:
                return (
                    <Input
                        value={currentValue}
                        onChange={(e) => handleDraftChange(config.id, e.target.value)}
                        className="max-w-md h-9 text-sm font-medium"
                        disabled={isSaving}
                    />
                );
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium animate-pulse">Loading system configurations...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Settings2 className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Service Configuration</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                        Central control panel for dynamic system rules and business logic.
                        Edit values and click <strong>Apply Changes</strong> to update modules in real-time.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10">
                    {/* Search Field */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search config..."
                            className="pl-10 h-11 w-56 sm:w-64 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Save All Changes Button */}
                    <Button
                        onClick={handleSaveAll}
                        disabled={savingAll}
                        className={cn(
                            "h-11 px-5 rounded-2xl font-bold shadow-md transition-all gap-2",
                            hasUnsavedChanges
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30 animate-pulse"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white opacity-80"
                        )}
                    >
                        {savingAll ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Applying Changes...</span>
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                <span>Apply Changes</span>
                                {dirtyConfigIds.size > 0 && (
                                    <span className="ml-1 rounded-full bg-white/25 px-2 py-0.5 text-xs font-black">
                                        {dirtyConfigIds.size}
                                    </span>
                                )}
                            </>
                        )}
                    </Button>

                    {/* Discard Changes Button (shown when modified) */}
                    {hasUnsavedChanges && (
                        <Button
                            variant="outline"
                            onClick={handleDiscardAll}
                            disabled={savingAll}
                            className="h-11 px-4 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all gap-1.5 text-xs font-bold"
                            title="Discard all unsaved edits"
                        >
                            <Undo2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Discard</span>
                        </Button>
                    )}

                    {/* Reset to Factory Defaults */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                        onClick={handleReset}
                        disabled={resetting || savingAll}
                        title="Reset all configurations to system defaults"
                    >
                        {resetting ? <Loader2 className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Unsaved Changes Banner */}
            {hasUnsavedChanges && (
                <div className="flex items-center justify-between p-4 px-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 dark:text-amber-200 animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                            <p className="text-xs font-bold">
                                You have {dirtyConfigIds.size} unsaved configuration change{dirtyConfigIds.size > 1 ? 's' : ''}.
                            </p>
                            <p className="text-[11px] opacity-80">
                                Click &quot;Apply Changes&quot; in the header or &quot;Save&quot; on individual items to apply them live.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={handleSaveAll}
                            disabled={savingAll}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold h-8 rounded-xl shadow-sm"
                        >
                            {savingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                            Apply All
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Tabs Container */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0 space-y-8">
                {/* Scrollable module tab pills */}
                <div className="w-full min-w-0 overflow-x-auto rounded-3xl bg-slate-100/50 dark:bg-slate-900/50 p-2 border border-slate-200/50 dark:border-slate-800/50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <TabsList className="bg-transparent h-auto p-0 gap-2 w-max min-w-full justify-start">
                        {MODULES.map(m => {
                            // Count how many unsaved edits in this module
                            const moduleDirtyCount = configs.filter(
                                (c) => c.module.toLowerCase() === m.id.toLowerCase() && dirtyConfigIds.has(c.id)
                            ).length;

                            return (
                                <TabsTrigger
                                    key={m.id}
                                    value={m.id}
                                    className={cn(
                                        "px-4 sm:px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap shrink-0 relative",
                                        "data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 data-[state=active]:shadow-xl data-[state=active]:shadow-indigo-500/10",
                                        "data-[state=inactive]:text-slate-500 hover:text-indigo-600"
                                    )}
                                >
                                    <m.icon className="h-4 w-4 mr-2 inline-block" />
                                    {m.label}
                                    {moduleDirtyCount > 0 && (
                                        <span className="ml-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                                            {moduleDirtyCount}
                                        </span>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>

                {MODULES.map(module => {
                    const moduleConfigs = filteredConfigs.filter(
                        (c) => c.module.toLowerCase() === module.id.toLowerCase()
                    );

                    return (
                        <TabsContent key={module.id} value={module.id} className="space-y-6 outline-none focus:ring-0">
                            <div className="grid gap-6">
                                {moduleConfigs.map(config => {
                                    const isDirty = dirtyConfigIds.has(config.id);
                                    const isSaving = savingItem === config.id;
                                    const wasRecentlySaved = recentlySaved.has(config.id);

                                    return (
                                        <Card
                                            key={config.id}
                                            className={cn(
                                                "border transition-all duration-300 rounded-3xl overflow-hidden group shadow-sm",
                                                isDirty
                                                    ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-300 dark:border-amber-700/50 shadow-amber-500/5"
                                                    : "bg-white dark:bg-slate-950 border-slate-200/70 dark:border-slate-800/70 hover:shadow-md"
                                            )}
                                        >
                                            <CardContent className="p-0">
                                                <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 sm:p-8 gap-6">
                                                    {/* Left: Label, Description & Status Badges */}
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                                                {config.label}
                                                            </h3>
                                                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter bg-slate-50 text-slate-500 border-slate-200">
                                                                {config.key}
                                                            </Badge>

                                                            {/* Unsaved Draft Badge */}
                                                            {isDirty && (
                                                                <Badge className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white border-none shadow-sm">
                                                                    ● Unsaved Change
                                                                </Badge>
                                                            )}

                                                            {/* Saved Success Badge */}
                                                            {wasRecentlySaved && (
                                                                <Badge className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white border-none shadow-sm flex items-center gap-1 animate-in fade-in duration-300">
                                                                    <CheckCircle2 className="h-3 w-3" /> Applied Live
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                            <Info className="h-3.5 w-3.5 text-indigo-500/50 shrink-0" />
                                                            {config.description || `Configure system behavior for ${config.label.toLowerCase()}.`}
                                                        </p>
                                                    </div>

                                                    {/* Right: Field Control + Apply / Discard Buttons */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
                                                        <div className="flex flex-col gap-1 min-w-[200px]">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                                    Config Value
                                                                </span>
                                                                {isDirty && (
                                                                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 italic">
                                                                        Modified
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {renderConfigField(config)}
                                                        </div>

                                                        {/* Action Buttons for this item */}
                                                        <div className="flex items-center gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 sm:pl-3">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSaveSingle(config)}
                                                                disabled={isSaving || savingAll}
                                                                className={cn(
                                                                    "h-9 px-3.5 rounded-xl font-bold text-xs gap-1.5 transition-all shadow-sm",
                                                                    isDirty
                                                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                                                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                                )}
                                                                title="Apply changes to this setting"
                                                            >
                                                                {isSaving ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : wasRecentlySaved ? (
                                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-100" />
                                                                ) : (
                                                                    <Save className="h-3.5 w-3.5" />
                                                                )}
                                                                <span>{wasRecentlySaved ? "Saved" : "Save"}</span>
                                                            </Button>

                                                            {isDirty && (
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => handleDiscardChange(config)}
                                                                    disabled={isSaving || savingAll}
                                                                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                                    title="Revert to original value"
                                                                >
                                                                    <Undo2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {moduleConfigs.length === 0 && (
                                    <div className="text-center p-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                            <Search className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-400">No configurations found in this module</h4>
                                        <p className="text-sm text-slate-500">Try adjusting your search or reset to defaults.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    );
                })}
            </Tabs>

            {/* Footer Audit Info */}
            <div className="flex items-center justify-between p-6 bg-indigo-600 rounded-3xl text-white shadow-2xl shadow-indigo-500/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-widest leading-none">Security Enforcement Active</h4>
                        <p className="text-[10px] text-indigo-100 mt-1">Changes are validated on save, written to the database, and reflected immediately.</p>
                    </div>
                </div>
                <div className="text-right relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-50 block mb-1">System Environment</span>
                    <Badge className="bg-white text-indigo-600 hover:bg-white font-black tracking-tighter px-3">PRODUCTION READY v2.4</Badge>
                </div>
            </div>
        </div>
    );
}
