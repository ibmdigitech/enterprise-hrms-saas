"use client";

import React, { useState, useTransition } from "react";
import { Plus, Database, Building2, Sparkles, AlertCircle } from "lucide-react";
import { createTenantAction } from "./actions";

export function TenantCreationModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        slug: "",
        legalName: "",
        contactEmail: "",
        planTier: "GROWTH" as "STARTER" | "GROWTH" | "ENTERPRISE",
        useSeparateDatabase: false,
    });

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const autoSlug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]/g, "-")
            .replace(/-+/g, "-");
        setForm((prev) => ({ ...prev, name, slug: autoSlug }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
            try {
                await createTenantAction(form);
                setIsOpen(false);
                setForm({
                    name: "",
                    slug: "",
                    legalName: "",
                    contactEmail: "",
                    planTier: "GROWTH",
                    useSeparateDatabase: false,
                });
            } catch (err: any) {
                setError(err.message || "Failed to provision tenant.");
            }
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-blue-600/20"
            >
                <Plus className="w-4 h-4" />
                Provision New Tenant
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Provision Tenant Organization</h3>
                                    <p className="text-xs text-slate-400">Deploy an isolated tenant workspace</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-medium text-slate-300 mb-1">Organization Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={handleNameChange}
                                    placeholder="e.g. Al Futtaim Group"
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block font-medium text-slate-300 mb-1">Subdomain Slug *</label>
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        required
                                        value={form.slug}
                                        onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                        placeholder="alfuttaim"
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-l-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                                    />
                                    <span className="px-3.5 py-2.5 bg-slate-800 text-slate-400 border border-l-0 border-slate-800 rounded-r-xl font-mono text-[11px]">
                                        .hrms-saas.com
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium text-slate-300 mb-1">Billing / Admin Contact Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={form.contactEmail}
                                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                                    placeholder="admin@alfuttaim.com"
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-slate-300 mb-1">Subscription Plan</label>
                                    <select
                                        value={form.planTier}
                                        onChange={(e) => setForm({ ...form, planTier: e.target.value as any })}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="STARTER">Starter (50 Staff)</option>
                                        <option value="GROWTH">Growth (250 Staff)</option>
                                        <option value="ENTERPRISE">Enterprise (1000 Staff)</option>
                                    </select>
                                </div>

                                <div className="flex flex-col justify-end">
                                    <label className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={form.useSeparateDatabase}
                                            onChange={(e) => setForm({ ...form, useSeparateDatabase: e.target.checked })}
                                            className="rounded border-slate-700 text-blue-600 focus:ring-0"
                                        />
                                        <div className="text-[11px] leading-tight">
                                            <div className="font-semibold text-slate-200 flex items-center gap-1">
                                                <Database className="w-3 h-3 text-emerald-400" />
                                                Separate DB
                                            </div>
                                            <div className="text-[10px] text-slate-500">Dedicated PostgreSQL instance</div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                >
                                    {isPending ? "Provisioning Database..." : "Complete Provisioning"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
