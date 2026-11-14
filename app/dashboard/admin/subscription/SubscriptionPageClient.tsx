"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, Crown, Check, X, AlertTriangle, DollarSign, Users, Database, Zap, Shield, RefreshCw, Plus, Edit, Trash2, ArrowUpRight, Clock, Calendar, FileText, Briefcase, ClipboardList, Bell, Plane, Target, UserPlus, FolderOpen, Activity, Key, Paintbrush, Sparkles, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubscriptionPlan {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    priceMonthly: number;
    priceYearly: number;
    currency: string;
    features: Record<string, unknown>;
    isActive: boolean;
    isDefault: boolean;
    sortOrder: number;
    activeSubscriptions: number;
}

interface CurrentSubscription {
    id: string;
    planId: string;
    plan: SubscriptionPlan;
    status: string;
    billingCycle: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    cancelledAt: string | null;
    trialEnd: string | null;
    provider: string | null;
    employeesCount: number;
    storageUsedMB: number;
    apiCallsThisMonth: number;
}

interface Usage {
    employeesCount: number;
    documentsCount: number;
    storageUsedMB: number;
    daysRemaining: number;
}

const MODULE_FEATURES = [
    { key: "employees", label: "Employee Management", icon: Users },
    { key: "attendance", label: "Attendance & Shifts", icon: Clock },
    { key: "leave", label: "Leave Management", icon: Calendar },
    { key: "payroll", label: "Payroll", icon: CreditCard },
    { key: "visa", label: "Visa & Compliance", icon: Shield },
    { key: "letters", label: "Letter Generation", icon: FileText },
    { key: "staffServices", label: "Staff Services", icon: Briefcase },
    { key: "requests", label: "Requests & Approvals", icon: ClipboardList },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "travel", label: "Business Travel", icon: Plane },
    { key: "performance", label: "Performance Reviews", icon: Target },
    { key: "recruitment", label: "Recruitment", icon: UserPlus },
    { key: "companyDocuments", label: "Company Documents", icon: FolderOpen },
    { key: "auditLog", label: "Audit Log", icon: Activity },
    { key: "backup", label: "Backup & Recovery", icon: Database },
    { key: "apiAccess", label: "API Access", icon: Zap },
    { key: "aiAssistant", label: "AI Copilot & Smart Insights", icon: Sparkles },
    { key: "sso", label: "Single Sign-On (SSO)", icon: Key },
    { key: "customBranding", label: "Custom Branding", icon: Paintbrush },
];

export default function SubscriptionPageClient() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
    const [usage, setUsage] = useState<Usage | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [plansRes, currentRes] = await Promise.all([
                fetch("/api/subscription/plans"),
                fetch("/api/subscription/current")
            ]);

            if (plansRes.ok) {
                const data = await plansRes.json();
                setPlans(data);
            }
            if (currentRes.ok) {
                const data = await currentRes.json();
                setCurrentSubscription(data.subscription);
                setUsage(data.usage);
            }
        } catch (error) {
            toast.error("Failed to load subscription data");
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = async (planId: string, billingCycle: "MONTHLY" | "YEARLY") => {
        setSaving(planId);
        try {
            const res = await fetch("/api/subscription/current", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId, billingCycle })
            });
            if (res.ok) {
                toast.success("Subscription updated successfully");
                fetchData();
            } else {
                toast.error("Failed to update subscription");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSaving(null);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm("Are you sure you want to cancel the subscription? It will remain active until the end of the billing period.")) return;
        
        try {
            const res = await fetch(`/api/subscription/current/${currentSubscription?.id}/cancel`, {
                method: "POST"
            });
            if (res.ok) {
                toast.success("Subscription cancelled");
                fetchData();
            } else {
                toast.error("Failed to cancel subscription");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            ACTIVE: "default",
            TRIAL: "secondary",
            PAST_DUE: "destructive",
            CANCELLED: "outline",
            EXPIRED: "destructive"
        };
        return (
            <Badge variant={variants[status] || "outline"} className="text-xs">
                {status}
            </Badge>
        );
    };

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat("en-AE", { style: "currency", currency, minimumFractionDigits: 0 }).format(price);
    };

    const getFeatureIcon = (enabled: unknown) => {
        const isEnabled = enabled === true || enabled === "true" || enabled === 1;
        return isEnabled ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />;
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-slate-500 font-medium">Loading subscription data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Subscription Management</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 max-w-lg">
                        Manage plans, billing cycles, and feature access for your organization.
                    </p>
                </div>
            </div>

            {/* Current Subscription Overview */}
            <Tabs defaultValue="overview" className="w-full">
                <div className="w-full overflow-x-auto rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 p-1 border border-slate-200/50 dark:border-slate-800/50">
                    <TabsList className="bg-transparent h-auto p-0 gap-1 w-max min-w-full justify-start">
                        <TabsTrigger value="overview" className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap shrink-0">Current Plan</TabsTrigger>
                        <TabsTrigger value="plans" className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap shrink-0">Available Plans</TabsTrigger>
                        <TabsTrigger value="usage" className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap shrink-0">Usage & Limits</TabsTrigger>
                        <TabsTrigger value="features" className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap shrink-0">Feature Matrix</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-6 pt-6">
                    {currentSubscription ? (
                        <div className="grid gap-6 md:grid-cols-3">
                            {/* Main Plan Card */}
                            <Card className="md:col-span-2 border-none bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden group relative">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
                                <CardContent className="p-8">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center text-white",
                                                    currentSubscription.status === "ACTIVE" && "bg-green-500",
                                                    currentSubscription.status === "TRIAL" && "bg-amber-500",
                                                    currentSubscription.status === "PAST_DUE" && "bg-red-500",
                                                    currentSubscription.status === "CANCELLED" && "bg-slate-500",
                                                )}>
                                                    <Crown className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 dark:text-white text-2xl">{currentSubscription.plan.displayName}</h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {getStatusBadge(currentSubscription.status)}
                                                        {currentSubscription.billingCycle === "YEARLY" && (
                                                            <Badge variant="outline" className="text-xs">Billed Yearly (Save 17%)</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400">{currentSubscription.plan.description}</p>
                                        </div>
                                        <div className="text-right md:min-w-[200px]">
                                            <div className="text-4xl font-black text-slate-900 dark:text-white">
                                                {formatPrice(
                                                    currentSubscription.billingCycle === "YEARLY" 
                                                        ? currentSubscription.plan.priceYearly 
                                                        : currentSubscription.plan.priceMonthly,
                                                    currentSubscription.plan.currency
                                                )}
                                                <span className="text-lg font-normal text-slate-500">/{currentSubscription.billingCycle === "YEARLY" ? "year" : "month"}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Next billing: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                                            </p>
                                            {currentSubscription.cancelAtPeriodEnd && (
                                                <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    Cancels at period end
                                                </p>
                                            )}
                                            <div className="flex gap-3 mt-4 justify-end">
                                                <Button 
                                                    variant="outline" 
                                                    onClick={() => handlePlanChange(currentSubscription.plan.id, "MONTHLY")}
                                                    disabled={saving === currentSubscription.plan.id}
                                                >
                                                    Switch to Monthly
                                                </Button>
                                                <Button 
                                                    onClick={() => handlePlanChange(currentSubscription.plan.id, "YEARLY")}
                                                    disabled={saving === currentSubscription.plan.id}
                                                >
                                                    Switch to Yearly
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="my-6" />

                                    <div className="grid gap-4 md:grid-cols-5">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                                            <p className="text-sm text-slate-500">Employees</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                                {usage?.employeesCount || currentSubscription.employeesCount}
                                            </p>
                                            <p className="text-xs text-slate-400">Limit: {(currentSubscription.plan.features as any)?.maxEmployees || "Unlimited"}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                                            <p className="text-sm text-slate-500">Storage Used</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                                {usage?.storageUsedMB || currentSubscription.storageUsedMB} MB
                                            </p>
                                            <p className="text-xs text-slate-400">Limit: {(currentSubscription.plan.features as any)?.maxStorageGB || "Unlimited"} GB</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                                            <p className="text-sm text-slate-500">API Calls</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                                {currentSubscription.apiCallsThisMonth.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-slate-400">Resets monthly</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-indigo-100 dark:border-indigo-950/50 bg-indigo-50/30 dark:bg-indigo-950/20">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                <Sparkles className="h-3.5 w-3.5" />
                                                <span>AI Modules</span>
                                            </div>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                                                Active
                                            </p>
                                            <p className="text-xs text-indigo-500 dark:text-indigo-400">5 Services Online</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                                            <p className="text-sm text-slate-500">Days Remaining</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                                {usage?.daysRemaining || Math.ceil((new Date(currentSubscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                                            </p>
                                            <p className="text-xs text-slate-400">Until {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions Card */}
                            <Card className="border-none bg-white dark:bg-slate-950 shadow-sm rounded-3xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-slate-600" />
                                        Actions
                                    </CardTitle>
                                    <CardDescription>Manage your subscription</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        onClick={handleCancelSubscription}
                                        disabled={currentSubscription.status === "CANCELLED" || currentSubscription.cancelAtPeriodEnd}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Cancel Subscription
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Retry Failed Payment
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        className="w-full justify-start text-slate-600"
                                    >
                                        <ArrowUpRight className="h-4 w-4 mr-2" />
                                        View Billing History
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <CardContent className="p-12 text-center">
                                <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                                    <CreditCard className="h-8 w-8 text-slate-300" />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Active Subscription</h4>
                                <p className="text-sm text-slate-500 mb-6">Select a plan from the Available Plans tab to get started.</p>
                                <Button onClick={() => setActiveTab("plans")}>
                                    View Available Plans
                                    <ArrowUpRight className="h-4 w-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="plans" className="space-y-6 pt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {plans.map(plan => (
                            <Card 
                                key={plan.id} 
                                className={cn(
                                    "border-none bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden group relative",
                                    plan.isDefault && "ring-2 ring-indigo-500"
                                )}
                            >
                                {plan.isDefault && (
                                    <div className="absolute top-3 right-3 z-10">
                                        <Badge variant="secondary" className="text-xs">DEFAULT</Badge>
                                    </div>
                                )}
                                <div className={cn(
                                    "absolute top-0 left-0 right-0 h-1",
                                    plan.isDefault && "bg-gradient-to-r from-indigo-500 to-violet-500",
                                    !plan.isDefault && "bg-slate-200 dark:bg-slate-800"
                                )}></div>
                                <CardContent className="p-6">
                                    <div className="text-center mb-4">
                                        <h3 className="font-black text-slate-900 dark:text-white text-xl">{plan.displayName}</h3>
                                        <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="text-center">
                                            <div className="text-3xl font-black text-slate-900 dark:text-white">
                                                {formatPrice(plan.priceMonthly, plan.currency)}
                                            </div>
                                            <p className="text-xs text-slate-500">/month</p>
                                        </div>
                                        {plan.priceYearly > 0 && (
                                            <div className="text-center text-green-600">
                                                <p className="text-xs font-bold">Yearly: {formatPrice(plan.priceYearly, plan.currency)}</p>
                                                <p className="text-[10px]">Save {Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)}%</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 mb-4 max-h-40 overflow-y-auto pr-2">
                                        {Object.entries(plan.features).map(([key, value]) => {
                                            const module = MODULE_FEATURES.find(m => m.key === key);
                                            if (!module || typeof value === "number" || typeof value === "string") return null;
                                            return (
                                                <div key={key} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                                                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <module.icon className="h-3.5 w-3.5" />
                                                        {module.label}
                                                    </span>
                                                    {getFeatureIcon(value)}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button 
                                            variant={currentSubscription?.planId === plan.id ? "default" : "outline"}
                                            className="flex-1"
                                            onClick={() => handlePlanChange(plan.id, "MONTHLY")}
                                            disabled={saving === plan.id || currentSubscription?.planId === plan.id}
                                        >
                                            {saving === plan.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : currentSubscription?.planId === plan.id ? (
                                                <>
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Current Plan
                                                </>
                                            ) : (
                                                "Select Monthly"
                                            )}
                                        </Button>
                                        {plan.priceYearly > 0 && (
                                            <Button 
                                                variant="ghost"
                                                className="flex-1"
                                                onClick={() => handlePlanChange(plan.id, "YEARLY")}
                                                disabled={saving === plan.id || currentSubscription?.planId === plan.id}
                                            >
                                                Yearly
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="usage" className="space-y-6 pt-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <Card className="border-none bg-white dark:bg-slate-950 shadow-sm rounded-3xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-slate-600" />
                                    Employees
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center py-8">
                                    <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">
                                        {usage?.employeesCount || currentSubscription?.employeesCount || 0}
                                    </div>
                                    <p className="text-slate-500">of {(currentSubscription?.plan?.features as any)?.maxEmployees || "Unlimited"} limit</p>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 transition-all duration-500" 
                                        style={{ width: `${Math.min(100, ((usage?.employeesCount || currentSubscription?.employeesCount || 0) / ((currentSubscription?.plan?.features as any)?.maxEmployees || 1000)) * 100)}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-white dark:bg-slate-950 shadow-sm rounded-3xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Database className="h-5 w-5 text-slate-600" />
                                    Storage
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center py-8">
                                    <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">
                                        {usage?.storageUsedMB || currentSubscription?.storageUsedMB || 0} MB
                                    </div>
                                    <p className="text-slate-500">of {(currentSubscription?.plan?.features as any)?.maxStorageGB || "Unlimited"} GB limit</p>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 transition-all duration-500" 
                                        style={{ width: `${Math.min(100, ((usage?.storageUsedMB || currentSubscription?.storageUsedMB || 0) / (((currentSubscription?.plan?.features as any)?.maxStorageGB || 10) * 1024)) * 100)}%` }}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-white dark:bg-slate-950 shadow-sm rounded-3xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-slate-600" />
                                    API Calls
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center py-8">
                                    <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">
                                        {currentSubscription?.apiCallsThisMonth?.toLocaleString() || 0}
                                    </div>
                                    <p className="text-slate-500">This billing period</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="features" className="space-y-6 pt-6">
                    <Card className="border-none bg-white dark:bg-slate-950 shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <CardTitle>Feature Comparison Matrix</CardTitle>
                            <CardDescription>Compare features across all subscription plans</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800">
                                            <th className="text-left p-3 font-bold text-slate-900 dark:text-white">Feature</th>
                                            {plans.map(plan => (
                                                <th key={plan.id} className="text-center p-3 font-bold text-slate-900 dark:text-white">
                                                    {plan.displayName}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {MODULE_FEATURES.map(module => (
                                            <tr key={module.key} className="border-b border-slate-100 dark:border-slate-800/50">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
                                                        <module.icon className="h-4 w-4 text-slate-400" />
                                                        {module.label}
                                                    </div>
                                                </td>
                                                {plans.map(plan => (
                                                    <td key={plan.id} className="text-center p-3">
                                                        {(() => {
                                                            const value = plan.features[module.key];
                                                            if (typeof value === "boolean") {
                                                                return value ? (
                                                                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                                                                ) : (
                                                                    <X className="h-5 w-5 text-red-500 mx-auto" />
                                                                );
                                                            }
                                                            if (typeof value === "number") {
                                                                return <span className="font-medium text-slate-900 dark:text-white">{value.toLocaleString()}</span>;
                                                            }
                                                            if (typeof value === "string") {
                                                                return <span className="text-xs text-slate-500">{value}</span>;
                                                            }
                                                            return <X className="h-5 w-5 text-red-500 mx-auto" />;
                                                        })()}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}