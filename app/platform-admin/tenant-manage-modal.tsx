"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Building2,
    Database,
    Shield,
    Users,
    CheckCircle2,
    XCircle,
    Sliders,
    Globe,
    Mail,
    Phone,
    ExternalLink,
    AlertTriangle,
    Save,
} from "lucide-react";
import {
    toggleTenantStatusAction,
    updateTenantQuotasAction,
    updateTenantDatabaseIsolationAction,
    updateTenantProfileAction,
} from "./actions";
import { toast } from "sonner";

interface TenantManageModalProps {
    tenant: any;
    isOpen: boolean;
    onClose: () => void;
}

export function TenantManageModal({ tenant, isOpen, onClose }: TenantManageModalProps) {
    if (!tenant) return null;

    const [activeTab, setActiveTab] = useState<"overview" | "quotas" | "database">("overview");
    const [loading, setLoading] = useState(false);

    // Profile form state
    const [name, setName] = useState(tenant.name || "");
    const [legalName, setLegalName] = useState(tenant.legalName || "");
    const [contactEmail, setContactEmail] = useState(tenant.contactEmail || "");
    const [customDomain, setCustomDomain] = useState(tenant.customDomain || "");

    // Quotas form state
    const sub = tenant.subscription || {};
    const [maxEmployees, setMaxEmployees] = useState(sub.maxEmployees || 50);
    const [maxCompanies, setMaxCompanies] = useState(sub.maxCompanies || 1);
    const [maxLocations, setMaxLocations] = useState(sub.maxLocations || 2);
    const [hasPayroll, setHasPayroll] = useState(sub.hasPayroll ?? true);
    const [hasCompliance, setHasCompliance] = useState(sub.hasCompliance ?? true);
    const [hasRecruitment, setHasRecruitment] = useState(sub.hasRecruitment ?? false);
    const [hasCustomTheme, setHasCustomTheme] = useState(sub.hasCustomTheme ?? false);
    const [hasApiAccess, setHasApiAccess] = useState(sub.hasApiAccess ?? false);

    // Database state
    const [databaseUrl, setDatabaseUrl] = useState(tenant.databaseUrl || "");

    const isActive = tenant.status === "ACTIVE";

    async function handleToggleStatus() {
        setLoading(true);
        try {
            const nextStatus = isActive ? "SUSPENDED" : "ACTIVE";
            await toggleTenantStatusAction(tenant.id, nextStatus);
            toast.success(`Organization ${nextStatus === "ACTIVE" ? "activated" : "suspended"} successfully.`);
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to update tenant status.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveProfile() {
        setLoading(true);
        try {
            await updateTenantProfileAction({
                tenantId: tenant.id,
                name,
                legalName,
                contactEmail,
                customDomain,
            });
            toast.success("Organization profile updated.");
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveQuotas() {
        setLoading(true);
        try {
            await updateTenantQuotasAction({
                tenantId: tenant.id,
                maxEmployees: Number(maxEmployees),
                maxCompanies: Number(maxCompanies),
                maxLocations: Number(maxLocations),
                hasPayroll,
                hasCompliance,
                hasRecruitment,
                hasCustomTheme,
                hasApiAccess,
            });
            toast.success("Subscription limits and module entitlements updated.");
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to update quotas.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveDatabase() {
        setLoading(true);
        try {
            await updateTenantDatabaseIsolationAction({
                tenantId: tenant.id,
                databaseUrl: databaseUrl.trim() || null,
            });
            toast.success("Database routing tier updated.");
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to update database routing.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b border-slate-800 bg-slate-950/50">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {tenant.slug}.hrms-saas.com
                                </span>
                                {isActive ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-medium">
                                        <XCircle className="w-3.5 h-3.5" />
                                        Suspended
                                    </span>
                                )}
                            </div>
                            <DialogTitle className="text-xl font-bold text-white mt-1">
                                {tenant.name}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-slate-400 mt-0.5">
                                Organization ID: <span className="font-mono">{tenant.id}</span>
                            </DialogDescription>
                        </div>

                        <button
                            type="button"
                            onClick={handleToggleStatus}
                            disabled={loading}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                isActive
                                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                        >
                            {isActive ? "Suspend Tenant" : "Reactivate Tenant"}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-4 mt-6 text-sm border-b border-slate-800 -mb-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab("overview")}
                            className={`pb-3 font-medium transition-colors border-b-2 ${
                                activeTab === "overview"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-white"
                            }`}
                        >
                            Overview & Info
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("quotas")}
                            className={`pb-3 font-medium transition-colors border-b-2 ${
                                activeTab === "quotas"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-white"
                            }`}
                        >
                            Quotas & Features
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("database")}
                            className={`pb-3 font-medium transition-colors border-b-2 ${
                                activeTab === "database"
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-400 hover:text-white"
                            }`}
                        >
                            Database Isolation
                        </button>
                    </div>
                </DialogHeader>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    {/* TAB: OVERVIEW */}
                    {activeTab === "overview" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Organization Display Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Legal Corporate Name</label>
                                    <input
                                        type="text"
                                        value={legalName}
                                        onChange={(e) => setLegalName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Billing / Primary Contact Email</label>
                                    <input
                                        type="email"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Custom Domain (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="hrms.clientdomain.com"
                                        value={customDomain}
                                        onChange={(e) => setCustomDomain(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Save Profile Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB: QUOTAS */}
                    {activeTab === "quotas" && (
                        <div className="space-y-4">
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                                <Sliders className="w-5 h-5 text-blue-400 shrink-0" />
                                <div className="text-xs text-slate-300">
                                    Current Plan: <span className="font-semibold text-white">{sub.planTier || "TRIAL"}</span>.
                                    Super Admins can grant custom quota overrides and toggle modular entitlements.
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Max Employees</label>
                                    <input
                                        type="number"
                                        value={maxEmployees}
                                        onChange={(e) => setMaxEmployees(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Max Companies</label>
                                    <input
                                        type="number"
                                        value={maxCompanies}
                                        onChange={(e) => setMaxCompanies(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Max Branches/Locations</label>
                                    <input
                                        type="number"
                                        value={maxLocations}
                                        onChange={(e) => setMaxLocations(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-800">
                                <div className="text-xs font-semibold text-slate-300 mb-2">Feature Modules Entitlements</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasPayroll}
                                            onChange={(e) => setHasPayroll(e.target.checked)}
                                            className="rounded border-slate-700 text-blue-600 focus:ring-0"
                                        />
                                        <span className="text-xs font-medium text-slate-200">Payroll & WPS Module</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasCompliance}
                                            onChange={(e) => setHasCompliance(e.target.checked)}
                                            className="rounded border-slate-700 text-blue-600 focus:ring-0"
                                        />
                                        <span className="text-xs font-medium text-slate-200">Visa & Compliance Module</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasRecruitment}
                                            onChange={(e) => setHasRecruitment(e.target.checked)}
                                            className="rounded border-slate-700 text-blue-600 focus:ring-0"
                                        />
                                        <span className="text-xs font-medium text-slate-200">Recruitment & ATS</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasCustomTheme}
                                            onChange={(e) => setHasCustomTheme(e.target.checked)}
                                            className="rounded border-slate-700 text-blue-600 focus:ring-0"
                                        />
                                        <span className="text-xs font-medium text-slate-200">Custom Branding Studio</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasApiAccess}
                                            onChange={(e) => setHasApiAccess(e.target.checked)}
                                            className="rounded border-slate-700 text-blue-600 focus:ring-0"
                                        />
                                        <span className="text-xs font-medium text-slate-200">REST API & Webhooks Access</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveQuotas}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Update Quotas & Modules
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB: DATABASE ISOLATION */}
                    {activeTab === "database" && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                                    <Database className="w-4 h-4" />
                                    Database Routing Strategy
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    By default, tenants operate on the shared tenant connection pool with strict row-level isolation via Scoped Prisma. For enterprise compliance or high performance, specify a dedicated PostgreSQL connection string below to route this tenant to their own isolated database instance.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    Dedicated PostgreSQL Connection String
                                </label>
                                <input
                                    type="password"
                                    placeholder="postgresql://user:password@isolated-db.internal:5432/tenant_db"
                                    value={databaseUrl}
                                    onChange={(e) => setDatabaseUrl(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                                />
                                <span className="text-[11px] text-slate-500 mt-1 block">
                                    Leave blank to route queries through the shared tenant cluster.
                                </span>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSaveDatabase}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Save Database Routing
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
