"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Loader2, Play, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
];

export function PayrollExportButtons() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [loading, setLoading] = useState<string | null>(null);

    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i + 1);

    const handleExport = async (format: "csv" | "excel" | "wps" | "pdf") => {
        setLoading(format);
        try {
            const res = await fetch(
                `/api/payroll/export?month=${month}&year=${year}&format=${format}`
            );

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                alert(errorData.error || "Export failed. Please try again.");
                return;
            }

            const blob = await res.blob();
            const contentDisposition = res.headers.get("content-disposition");
            let filename = `payroll_export_${month}_${year}.${format === "excel" ? "xlsx" : format === "wps" ? "sif" : format === "pdf" ? "pdf" : "csv"}`;
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match) filename = match[1];
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            alert("Export failed. Please check your connection and try again.");
        } finally {
            setLoading(null);
        }
    };

    const currentMonthLabel = MONTHS.find(m => m.value === month)?.label || "November";

    return (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Left: Export Payroll Header & Description */}
            <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Export Payroll
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Select period & format
                </p>
            </div>

            {/* Right: Interactive Period Selector + Quick Action + Export Format Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
                {/* 1. Interactive Period Selector: Month & Year Picker */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 shadow-2xs">
                    <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
                        title="Select payroll month"
                    >
                        {MONTHS.map((m) => (
                            <option key={m.value} value={m.value} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                                {m.label}
                            </option>
                        ))}
                    </select>
                    <span className="text-slate-300 dark:text-slate-600 font-bold text-xs">/</span>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pl-1"
                        title="Select payroll year"
                    >
                        {years.map((y) => (
                            <option key={y} value={y} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                                {y}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Quick Action Link: Run Payroll for Selected Period */}
                <Link
                    href={`/payroll/generate?month=${month}&year=${year}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 transition-colors shadow-2xs"
                    title={`Run payroll for ${currentMonthLabel} ${year}`}
                >
                    <Play className="h-3 w-3 fill-indigo-600 dark:fill-indigo-400" />
                    <span>Run Period</span>
                </Link>

                {/* 3. CSV Button - Pastel Mint */}
                <button
                    onClick={() => handleExport("csv")}
                    disabled={loading !== null}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#d1fae5] hover:bg-[#a7f3d0] text-[#065f46] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border dark:border-emerald-800/40 transition-colors shadow-2xs disabled:opacity-50"
                >
                    {loading === "csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "CSV"}
                </button>

                {/* 4. Excel Button - Pastel Light Cyan */}
                <button
                    onClick={() => handleExport("excel")}
                    disabled={loading !== null}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#cffafe] hover:bg-[#a5f3fc] text-[#155e75] dark:bg-cyan-950/40 dark:text-cyan-300 dark:border dark:border-cyan-800/40 transition-colors shadow-2xs disabled:opacity-50"
                >
                    {loading === "excel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Excel"}
                </button>

                {/* 5. WPS UAE MOL SIF Button - Pastel Soft Teal */}
                <button
                    onClick={() => handleExport("wps")}
                    disabled={loading !== null}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ccfbf1] hover:bg-[#99f6e4] text-[#115e59] dark:bg-teal-950/40 dark:text-teal-300 dark:border dark:border-teal-800/40 transition-colors shadow-2xs disabled:opacity-50"
                >
                    {loading === "wps" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "WPS UAE MOL SIF"}
                </button>

                {/* 6. PDF Button - Pastel Rose / Pink */}
                <button
                    onClick={() => handleExport("pdf")}
                    disabled={loading !== null}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ffe4e6] hover:bg-[#fecdd3] text-[#9f1239] dark:bg-rose-950/40 dark:text-rose-300 dark:border dark:border-rose-800/40 transition-colors shadow-2xs disabled:opacity-50"
                >
                    {loading === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "PDF"}
                </button>
            </div>
        </div>
    );
}
