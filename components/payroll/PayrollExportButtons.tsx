"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Loader2, Play, Calendar, FileSpreadsheet, FileText, ShieldCheck, FileDown, Sparkles } from "lucide-react";

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

    const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i + 1);

    const handleExport = async (format: "csv" | "excel" | "wps" | "pdf") => {
        setLoading(format);
        try {
            const res = await fetch(
                `/api/payroll/export?month=${month}&year=${year}&format=${format}`
            );

            if (!okStatus(res.status)) {
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

    const okStatus = (status: number) => status >= 200 && status < 300;
    const currentMonthLabel = MONTHS.find(m => m.value === month)?.label || "November";

    return (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 transition-all">
            {/* Left: Export Payroll Header & Description */}
            <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <FileDown className="h-5 w-5" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                            Export Payroll & Compliance Reports
                        </h3>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            WPS Ready
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Select payroll cycle to generate Ministry of Human Resources SIF, audit spreadsheets, or slips.
                    </p>
                </div>
            </div>

            {/* Right: Interactive Period Selector + Quick Action + Export Format Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
                {/* 1. Interactive Period Selector: Month & Year Picker */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2 shadow-2xs">
                    <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                    title={`Run payroll for ${currentMonthLabel} ${year}`}
                >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Run Period</span>
                </Link>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

                {/* 3. CSV Button */}
                <button
                    onClick={() => handleExport("csv")}
                    disabled={loading !== null}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 transition-colors shadow-2xs disabled:opacity-50"
                    title="Export Comma Separated Values (.csv)"
                >
                    {loading === "csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                    <span>CSV</span>
                </button>

                {/* 4. Excel Button */}
                <button
                    onClick={() => handleExport("excel")}
                    disabled={loading !== null}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40 transition-colors shadow-2xs disabled:opacity-50"
                    title="Export Microsoft Excel (.xlsx)"
                >
                    {loading === "excel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
                    <span>Excel</span>
                </button>

                {/* 5. WPS UAE MOL SIF Button */}
                <button
                    onClick={() => handleExport("wps")}
                    disabled={loading !== null}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 transition-colors shadow-2xs disabled:opacity-50"
                    title="Generate UAE Ministry of Labour Wages Protection System SIF File"
                >
                    {loading === "wps" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />}
                    <span>WPS UAE MOL SIF</span>
                </button>

                {/* 6. PDF Button */}
                <button
                    onClick={() => handleExport("pdf")}
                    disabled={loading !== null}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 transition-colors shadow-2xs disabled:opacity-50"
                    title="Download Full Summary PDF"
                >
                    {loading === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />}
                    <span>PDF</span>
                </button>
            </div>
        </div>
    );
}
