"use client";

import React, { useState, useTransition } from "react";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export interface TenantOption {
    id: string;
    name: string;
    slug: string;
    role: string;
}

export interface TenantSwitcherProps {
    currentTenantId: string | null;
    currentTenantName: string | null;
    tenants: TenantOption[];
}

export function TenantSwitcher({
    currentTenantId,
    currentTenantName,
    tenants,
}: TenantSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const activeTenant = tenants.find((t) => t.id === currentTenantId);

    const handleSwitch = (tenant: TenantOption) => {
        setIsOpen(false);
        startTransition(() => {
            // Set active tenant cookie / header redirect
            document.cookie = `x-tenant-id=${tenant.id}; path=/; max-age=2592000; SameSite=Lax`;
            router.refresh();
        });
    };

    if (!tenants || tenants.length === 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-900/50 rounded-lg border border-slate-800">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentTenantName || "Single Tenant"}</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 rounded-lg border border-slate-750 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <div className="w-4 h-4 rounded bg-blue-600/30 flex items-center justify-center text-[10px] text-blue-400 font-bold border border-blue-500/40">
                    <Building2 className="w-2.5 h-2.5 text-blue-400" />
                </div>
                <span className="max-w-[140px] truncate">
                    {activeTenant?.name || currentTenantName || "Select Organization"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 mt-1.5 w-60 z-50 rounded-xl bg-slate-900 border border-slate-800 shadow-xl p-1.5 text-xs animate-in fade-in zoom-in-95">
                        <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                            Switch Organization
                        </div>
                        <div className="space-y-0.5 max-h-56 overflow-y-auto">
                            {tenants.map((t) => {
                                const isSelected = t.id === currentTenantId;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => handleSwitch(t)}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                                            isSelected
                                                ? "bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30"
                                                : "text-slate-300 hover:bg-slate-800/60"
                                        }`}
                                    >
                                        <div className="truncate">
                                            <div className="truncate">{t.name}</div>
                                            <div className="text-[10px] text-slate-500">
                                                {t.role} · {t.slug}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <Check className="w-3.5 h-3.5 text-blue-400 ml-2 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
