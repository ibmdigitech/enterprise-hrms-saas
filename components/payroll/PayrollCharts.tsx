"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Users, Clock, Building2, BarChart3, Activity } from "lucide-react";

const COLORS = ['#2563eb', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const tooltipStyle = { 
    borderRadius: '16px', 
    border: '1px solid #e2e8f0', 
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: '#ffffff'
};

const formatAed = (value: number) => `AED ${Math.round(value).toLocaleString()}`;
const formatAedTick = (value: number) => (Math.abs(value) >= 1000 ? `AED ${Math.round(value / 1000)}k` : `AED ${value}`);

function ChartEmptyState({ icon: Icon, message }: { icon: typeof TrendingUp; message: string }) {
    return (
        <div className="h-64 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <Icon className="h-8 w-8 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No data to chart</p>
            <p className="text-xs text-slate-400 max-w-xs">{message}</p>
        </div>
    );
}

export function PayrollCharts({
    trendData,
    departmentData,
    overtimeData,
    trendCaption,
    departmentCaption,
    overtimeCaption,
}: {
    trendData: { label: string; total: number }[];
    departmentData: { name: string; cost: number }[];
    overtimeData: { label: string; hours: number }[];
    trendCaption: string;
    departmentCaption: string;
    overtimeCaption: string;
}) {
    return (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* 1. Monthly Payroll Trend (Area Chart) */}
            <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs rounded-3xl overflow-hidden hover:shadow-sm transition-all group">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Monthly Payroll Trend</CardTitle>
                        </div>
                        <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">{trendCaption}</CardDescription>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                        Disbursals
                    </span>
                </CardHeader>
                <CardContent className="h-64 pt-2">
                    {trendData.length === 0 ? (
                        <ChartEmptyState
                            icon={TrendingUp}
                            message="No salary records exist yet to plot monthly trend."
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatAedTick} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatAed(Number(value))} />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    name="Net salary" 
                                    stroke="#2563eb" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6 }}
                                    fillOpacity={1} 
                                    fill="url(#colorNet)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* 2. Overtime Trend (Vertical Bar Chart) */}
            <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs rounded-3xl overflow-hidden hover:shadow-sm transition-all group">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Clock className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Overtime Trend</CardTitle>
                        </div>
                        <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">{overtimeCaption}</CardDescription>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                        Logged Hours
                    </span>
                </CardHeader>
                <CardContent className="h-64 pt-2">
                    {overtimeData.length === 0 ? (
                        <ChartEmptyState
                            icon={Clock}
                            message="No overtime has been logged in this 6-month window."
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={overtimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="h" />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${Number(value)}h`} />
                                <Bar dataKey="hours" name="Overtime" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* 3. Department Salary Cost (Vertical Column Chart) */}
            <Card className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs rounded-3xl overflow-hidden hover:shadow-sm transition-all group md:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-7 w-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Department Salary Cost</CardTitle>
                        </div>
                        <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">{departmentCaption}</CardDescription>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-900/40">
                        Allocation
                    </span>
                </CardHeader>
                <CardContent className="h-64 pt-2">
                    {departmentData.length === 0 ? (
                        <ChartEmptyState
                            icon={Users}
                            message="No salary records exist for this period to compare departments."
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatAedTick} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={tooltipStyle} formatter={(value) => formatAed(Number(value))} />
                                <Bar dataKey="cost" name="Salary Cost" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={36}>
                                    {departmentData.map((entry, index) => (
                                        <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
