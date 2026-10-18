"use client";

import { useState } from "react";
import {
    Building2,
    MapPin,
    Network,
    Plus,
    Users,
    CheckCircle2,
    Trash2,
    Edit2,
    Layers,
    ChevronRight,
    AlertCircle,
    Globe,
    Briefcase,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    createCompanyAction,
    updateCompanyAction,
    deleteCompanyAction,
    createLocationAction,
    updateLocationAction,
    deleteLocationAction,
    createDepartmentAction,
    deleteDepartmentAction,
} from "@/app/lib/actions/organization";
import { toast } from "sonner";

interface OrganizationClientProps {
    data: {
        tenant: {
            id: string;
            name: string;
            slug: string;
            currency: string;
            status: string;
            planTier: string;
            quotas: {
                maxEmployees: number;
                maxCompanies: number;
                maxLocations: number;
            };
        };
        companies: any[];
        locations: any[];
        departments: any[];
        totalEmployees: number;
    };
}

export function OrganizationClient({ data }: OrganizationClientProps) {
    const { tenant, companies, locations, departments, totalEmployees } = data;
    const [activeTab, setActiveTab] = useState<"companies" | "locations" | "departments" | "tree">("companies");

    // Modal states
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states - Company
    const [compName, setCompName] = useState("");
    const [tradeLicense, setTradeLicense] = useState("");
    const [taxId, setTaxId] = useState("");
    const [currency, setCurrency] = useState(tenant.currency || "AED");
    const [isDefaultComp, setIsDefaultComp] = useState(false);

    // Form states - Location
    const [locCompanyId, setLocCompanyId] = useState(companies[0]?.id || "");
    const [locName, setLocName] = useState("");
    const [locCode, setLocCode] = useState("");
    const [locAddress, setLocAddress] = useState("");
    const [locCity, setLocCity] = useState("Dubai");
    const [locCountry, setLocCountry] = useState("AE");
    const [locTimezone, setLocTimezone] = useState("Asia/Dubai");

    // Form states - Department
    const [deptCompanyId, setDeptCompanyId] = useState(companies[0]?.id || "");
    const [deptLocationId, setDeptLocationId] = useState("");
    const [deptParentId, setDeptParentId] = useState("");
    const [deptName, setDeptName] = useState("");
    const [deptCode, setDeptCode] = useState("");

    // Quotas calculations
    const companyQuotaPercent = Math.min(Math.round((companies.length / tenant.quotas.maxCompanies) * 100), 100);
    const locationQuotaPercent = Math.min(Math.round((locations.length / tenant.quotas.maxLocations) * 100), 100);
    const employeeQuotaPercent = Math.min(Math.round((totalEmployees / tenant.quotas.maxEmployees) * 100), 100);

    async function handleCreateCompany(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await createCompanyAction({
                name: compName,
                tradeLicenseNumber: tradeLicense,
                taxId,
                currency,
                isDefault: isDefaultComp,
            });
            toast.success("Subsidiary company added successfully.");
            setIsCompanyModalOpen(false);
            setCompName("");
            setTradeLicense("");
            setTaxId("");
        } catch (err: any) {
            toast.error(err.message || "Failed to create company.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteCompany(id: string) {
        if (!confirm("Are you sure you want to delete this company subsidiary?")) return;
        try {
            await deleteCompanyAction(id);
            toast.success("Company deleted.");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete company.");
        }
    }

    async function handleCreateLocation(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await createLocationAction({
                companyId: locCompanyId,
                name: locName,
                code: locCode,
                address: locAddress,
                city: locCity,
                country: locCountry,
                timezone: locTimezone,
            });
            toast.success("Branch location added successfully.");
            setIsLocationModalOpen(false);
            setLocName("");
            setLocCode("");
            setLocAddress("");
        } catch (err: any) {
            toast.error(err.message || "Failed to create location.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteLocation(id: string) {
        if (!confirm("Are you sure you want to delete this branch location?")) return;
        try {
            await deleteLocationAction(id);
            toast.success("Branch location deleted.");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete location.");
        }
    }

    async function handleCreateDepartment(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            await createDepartmentAction({
                companyId: deptCompanyId,
                locationId: deptLocationId || undefined,
                parentId: deptParentId || undefined,
                name: deptName,
                code: deptCode,
            });
            toast.success("Department created successfully.");
            setIsDeptModalOpen(false);
            setDeptName("");
            setDeptCode("");
        } catch (err: any) {
            toast.error(err.message || "Failed to create department.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteDepartment(id: string) {
        if (!confirm("Are you sure you want to delete this department?")) return;
        try {
            await deleteDepartmentAction(id);
            toast.success("Department deleted.");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete department.");
        }
    }

    return (
        <div className="space-y-8">
            {/* Quota Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Building2 className="w-4 h-4 text-blue-400" />
                            Subsidiary Companies
                        </span>
                        <span className="font-semibold text-white">
                            {companies.length} / {tenant.quotas.maxCompanies}
                        </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                        <div
                            className={`h-full rounded-full transition-all ${
                                companyQuotaPercent >= 100 ? "bg-amber-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${companyQuotaPercent}%` }}
                        />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
                        <span>Legal corporate entities</span>
                        <span>{companyQuotaPercent}% used</span>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1.5 font-medium">
                            <MapPin className="w-4 h-4 text-emerald-400" />
                            Branch Locations
                        </span>
                        <span className="font-semibold text-white">
                            {locations.length} / {tenant.quotas.maxLocations}
                        </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                        <div
                            className={`h-full rounded-full transition-all ${
                                locationQuotaPercent >= 100 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${locationQuotaPercent}%` }}
                        />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
                        <span>Offices, warehouses & sites</span>
                        <span>{locationQuotaPercent}% used</span>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="flex items-center gap-1.5 font-medium">
                            <Users className="w-4 h-4 text-purple-400" />
                            Active Workforce Seats
                        </span>
                        <span className="font-semibold text-white">
                            {totalEmployees} / {tenant.quotas.maxEmployees}
                        </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                        <div
                            className={`h-full rounded-full transition-all ${
                                employeeQuotaPercent >= 90 ? "bg-rose-500" : "bg-purple-500"
                            }`}
                            style={{ width: `${employeeQuotaPercent}%` }}
                        />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
                        <span>Staff across all entities</span>
                        <span>{employeeQuotaPercent}% used</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab("companies")}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "companies" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Companies ({companies.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("locations")}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "locations" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Locations & Branches ({locations.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("departments")}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "departments" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Departments ({departments.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("tree")}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            activeTab === "tree" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                    >
                        Hierarchy Tree
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {activeTab === "companies" && (
                        <button
                            type="button"
                            onClick={() => setIsCompanyModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Subsidiary Company
                        </button>
                    )}
                    {activeTab === "locations" && (
                        <button
                            type="button"
                            onClick={() => setIsLocationModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Branch Location
                        </button>
                    )}
                    {activeTab === "departments" && (
                        <button
                            type="button"
                            onClick={() => setIsDeptModalOpen(true)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Department
                        </button>
                    )}
                </div>
            </div>

            {/* TAB: COMPANIES */}
            {activeTab === "companies" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map((company) => (
                        <div
                            key={company.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-white">{company.name}</h3>
                                            {company.isDefault && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    Primary Entity
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Currency: <span className="font-semibold text-slate-200">{company.currency}</span>
                                        </div>
                                    </div>

                                    {!company.isDefault && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCompany(company.id)}
                                            className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                                            title="Delete Subsidiary"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                                    <div>
                                        Trade License:{" "}
                                        <span className="font-mono text-slate-300">
                                            {company.tradeLicenseNumber || "Not recorded"}
                                        </span>
                                    </div>
                                    <div>
                                        Tax / VAT ID:{" "}
                                        <span className="font-mono text-slate-300">{company.taxId || "Not registered"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                <span>{company._count.locations} Branches</span>
                                <span>{company._count.departments} Departments</span>
                                <span className="font-semibold text-white">{company._count.employees} Staff</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB: LOCATIONS */}
            {activeTab === "locations" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-3.5">Branch Name</th>
                                    <th className="px-6 py-3.5">Company Subsidiary</th>
                                    <th className="px-6 py-3.5">City & Country</th>
                                    <th className="px-6 py-3.5">Timezone</th>
                                    <th className="px-6 py-3.5">Assigned Staff</th>
                                    <th className="px-6 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {locations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No branch locations added yet. Click &quot;Add Branch Location&quot; to begin.
                                        </td>
                                    </tr>
                                ) : (
                                    locations.map((loc) => (
                                        <tr key={loc.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-emerald-400" />
                                                    {loc.name}
                                                </div>
                                                {loc.code && <div className="text-xs text-slate-500 font-mono">Code: {loc.code}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-300">
                                                {loc.company.name}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-300">
                                                {loc.city || "Dubai"}, {loc.country || "AE"}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                                {loc.timezone || "Asia/Dubai"}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-white">
                                                {loc._count.employees} employees
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteLocation(loc.id)}
                                                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                                    title="Delete Location"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: DEPARTMENTS */}
            {activeTab === "departments" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-3.5">Department Name</th>
                                    <th className="px-6 py-3.5">Company Entity</th>
                                    <th className="px-6 py-3.5">Branch Location</th>
                                    <th className="px-6 py-3.5">Parent Department</th>
                                    <th className="px-6 py-3.5">Headcount</th>
                                    <th className="px-6 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {departments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No departments configured yet.
                                        </td>
                                    </tr>
                                ) : (
                                    departments.map((dept) => (
                                        <tr key={dept.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-white flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4 text-purple-400" />
                                                    {dept.name}
                                                </div>
                                                {dept.code && <div className="text-xs text-slate-500 font-mono">Code: {dept.code}</div>}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-300">
                                                {dept.company.name}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                {dept.location?.name || "All Branches"}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                {dept.parent?.name || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-white">
                                                {dept._count.employees} employees
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteDepartment(dept.id)}
                                                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                                    title="Delete Department"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: VISUAL HIERARCHY TREE */}
            {activeTab === "tree" && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                        <Network className="w-4 h-4" />
                        Multi-Entity Organizational Graph
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-bold text-white text-base">{tenant.name}</div>
                                    <div className="text-xs text-slate-500">
                                        {tenant.status} · {tenant.planTier} Plan
                                    </div>
                                </div>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                {tenant.planTier} Tier
                            </span>
                        </div>

                        {/* Companies Tree */}
                        <div className="pl-6 border-l-2 border-slate-800 space-y-4">
                            {companies.map((comp) => {
                                const compLocations = locations.filter((l) => l.companyId === comp.id);
                                const compDepts = departments.filter((d) => d.companyId === comp.id);

                                return (
                                    <div key={comp.id} className="space-y-3">
                                        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <Building2 className="w-4 h-4 text-blue-400" />
                                                <span className="font-semibold text-sm text-slate-200">{comp.name}</span>
                                                {comp.isDefault && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                                                        HQ
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-400">{comp._count.employees} employees</span>
                                        </div>

                                        {/* Branches under company */}
                                        <div className="pl-6 border-l-2 border-slate-800/60 space-y-2">
                                            {compLocations.map((loc) => (
                                                <div key={loc.id} className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/50 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2 text-slate-300">
                                                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span>{loc.name}</span>
                                                        <span className="text-slate-500">({loc.city})</span>
                                                    </div>
                                                    <span className="text-slate-500">{loc._count.employees} staff</span>
                                                </div>
                                            ))}

                                            {/* Departments */}
                                            <div className="pt-1 flex flex-wrap gap-2">
                                                {compDepts.map((d) => (
                                                    <span
                                                        key={d.id}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs"
                                                    >
                                                        <Briefcase className="w-3 h-3 text-purple-400" />
                                                        {d.name} ({d._count.employees})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ADD COMPANY */}
            {isCompanyModalOpen && (
                <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-white">Add Subsidiary Company</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400">
                                Create an independent corporate entity or subsidiary under this organization.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateCompany} className="space-y-4 pt-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Company Legal Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acme Tech Solutions LLC"
                                    value={compName}
                                    onChange={(e) => setCompName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Trade License #</label>
                                    <input
                                        type="text"
                                        placeholder="CN-1928374"
                                        value={tradeLicense}
                                        onChange={(e) => setTradeLicense(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Tax / VAT Number</label>
                                    <input
                                        type="text"
                                        placeholder="100293847500003"
                                        value={taxId}
                                        onChange={(e) => setTaxId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Operational Currency</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="AED">AED - United Arab Emirates Dirham</option>
                                    <option value="SAR">SAR - Saudi Riyal</option>
                                    <option value="USD">USD - United States Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCompanyModalOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
                                >
                                    {loading ? "Creating..." : "Create Subsidiary"}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* MODAL: ADD LOCATION */}
            {isLocationModalOpen && (
                <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-white">Add Branch Location</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400">
                                Register a physical office, warehouse, or worksite for your subsidiary.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateLocation} className="space-y-4 pt-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Company Subsidiary</label>
                                <select
                                    value={locCompanyId}
                                    onChange={(e) => setLocCompanyId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Branch / Site Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dubai Internet City Hub"
                                    value={locName}
                                    onChange={(e) => setLocName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={locCity}
                                        onChange={(e) => setLocCity(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Branch Code</label>
                                    <input
                                        type="text"
                                        placeholder="DXB-01"
                                        value={locCode}
                                        onChange={(e) => setLocCode(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Physical Address</label>
                                <input
                                    type="text"
                                    placeholder="Building 4, Level 5, DIC"
                                    value={locAddress}
                                    onChange={(e) => setLocAddress(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsLocationModalOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm"
                                >
                                    {loading ? "Creating..." : "Create Location"}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* MODAL: ADD DEPARTMENT */}
            {isDeptModalOpen && (
                <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
                    <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-white">Add Department</DialogTitle>
                            <DialogDescription className="text-xs text-slate-400">
                                Configure a department or team structure within a company entity.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateDepartment} className="space-y-4 pt-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Company Subsidiary</label>
                                <select
                                    value={deptCompanyId}
                                    onChange={(e) => setDeptCompanyId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                >
                                    {companies.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">Department Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Engineering & IT"
                                    value={deptName}
                                    onChange={(e) => setDeptName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Department Code</label>
                                    <input
                                        type="text"
                                        placeholder="ENG-01"
                                        value={deptCode}
                                        onChange={(e) => setDeptCode(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Branch / Location (Optional)</label>
                                    <select
                                        value={deptLocationId}
                                        onChange={(e) => setDeptLocationId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">All Locations</option>
                                        {locations.map((loc) => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsDeptModalOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm"
                                >
                                    {loading ? "Creating..." : "Create Department"}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
