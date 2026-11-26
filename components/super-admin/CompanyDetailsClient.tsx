"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  MapPin,
  Users,
  Layers,
  Activity,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Shield,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CompanyDetailsClientProps {
  company: {
    id: string;
    name: string;
    slug: string;
    legalName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    logoUrl?: string | null;
    status: string;
    currency: string;
    primaryColor?: string | null;
    accentColor?: string | null;
    timezone: string;
    createdAt: Date | string;
    subscription?: {
      planTier: string;
      status: string;
      billingCycle?: string;
      maxEmployees: number;
      maxCompanies: number;
      maxLocations: number;
      hasPayroll: boolean;
      hasCompliance: boolean;
      hasRecruitment: boolean;
      hasCustomTheme: boolean;
      hasApiAccess: boolean;
    } | null;
    companies?: Array<{
      id: string;
      name: string;
      tradeLicenseNumber?: string | null;
      taxId?: string | null;
      currency: string;
      isDefault: boolean;
      locations?: Array<{ id: string; name: string; city?: string | null; country?: string | null }>;
      departments?: Array<{ id: string; name: string }>;
      _count?: { employees: number };
    }>;
    memberships?: Array<{
      id?: string;
      user: { id: string; name?: string | null; email: string; role: string; image?: string | null };
      role: string;
      status: string;
    }>;
    invoices?: Array<{
      id: string;
      invoiceNumber: string;
      totalAmount: number;
      currency: string;
      status: string;
      createdAt: Date | string;
    }>;
    _count?: {
      employees: number;
      locations: number;
      departments: number;
      memberships: number;
    };
    companyModules?: Array<{
      id: string;
      status?: string;
      isEnabled?: boolean;
      module?: { id: string; name: string; key?: string; category?: string } | null;
    }>;
    supportTickets?: Array<{
      id: string;
      subject: string;
      status: string;
      priority: string;
      createdAt: Date | string;
    }>;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: "Active", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle },
  TRIAL: { label: "Trial", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  SUSPENDED: { label: "Suspended", color: "bg-rose-500/10 text-rose-500 border-rose-500/20", icon: AlertCircle },
  ARCHIVED: { label: "Archived", color: "bg-slate-500/10 text-muted-foreground border-border", icon: Building2 },
  CANCELLED: { label: "Cancelled", color: "bg-rose-500/10 text-rose-500 border-rose-500/20", icon: AlertCircle },
};

const tierConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  TRIAL: { label: "Trial", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: Clock },
  STARTER: { label: "Starter", color: "bg-slate-500/10 text-muted-foreground border-border", icon: Building2 },
  GROWTH: { label: "Growth", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Users },
  PROFESSIONAL: { label: "Professional", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: Shield },
  ENTERPRISE: { label: "Enterprise", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Shield },
  CUSTOM: { label: "Custom", color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: Settings },
};

export function CompanyDetailsClient({ company }: CompanyDetailsClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const currentStatus = statusConfig[company.status] || {
    label: company.status,
    color: "bg-slate-500/10 text-muted-foreground border-border",
    icon: AlertCircle,
  };
  const currentTier = tierConfig[company.subscription?.planTier || "TRIAL"] || tierConfig.TRIAL;

  const entities = company.companies ?? [];
  const memberships = company.memberships ?? [];
  const modules = company.companyModules ?? [];
  const invoices = company.invoices ?? [];
  const tickets = company.supportTickets ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/companies">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shrink-0">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <span className="font-mono">{company.slug}.hrms-saas.com</span>
              <Badge className={cn("border", currentStatus.color)}>{currentStatus.label}</Badge>
              <Badge className={cn("border", currentTier.color)}>{currentTier.label}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="w-full flex-wrap h-auto rounded-2xl border border-border bg-muted/80 p-1 sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="branches">Entities ({entities.length})</TabsTrigger>
          <TabsTrigger value="users">Users ({memberships.length})</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="modules">Modules ({modules.length})</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="activity">Invoices & Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Company Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Company Name</p>
                    <p className="font-medium text-foreground mt-0.5">{company.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Legal Name</p>
                    <p className="font-medium text-foreground mt-0.5">{company.legalName || company.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Contact Email</p>
                    <p className="font-medium text-foreground mt-0.5">{company.contactEmail || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Currency / Timezone</p>
                    <p className="font-medium text-foreground mt-0.5">
                      {company.currency} • {company.timezone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Platform Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatItem label="Employees" value={company._count?.employees || 0} />
                <StatItem label="Active Users" value={company._count?.memberships || 0} />
                <StatItem label="Locations" value={company._count?.locations || 0} />
                <StatItem label="Departments" value={company._count?.departments || 0} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branches">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Legal Entities & Branches</CardTitle>
            </CardHeader>
            <CardContent>
              {entities.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mt-2">No entities or branches configured</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entities.map((entity) => (
                    <div key={entity.id} className="rounded-xl border border-border p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">{entity.name}</p>
                        {entity.isDefault && <Badge variant="secondary">Primary</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Trade License: {entity.tradeLicenseNumber || "—"} • Tax ID: {entity.taxId || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entity._count?.employees ?? 0} employees • {entity.locations?.length ?? 0} locations •{" "}
                        {entity.departments?.length ?? 0} departments
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Active Tenant Memberships</CardTitle>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mt-2">No active users found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {memberships.map((m) => (
                    <div key={m.user.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {m.user.name || m.user.email}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{m.role}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                <span className="text-lg font-semibold">{company.subscription?.planTier || "TRIAL"} Plan</span>
                <Badge variant="outline">{company.subscription?.status || "ACTIVE"}</Badge>
              </div>
              {company.subscription && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <StatItem label="Max Employees" value={company.subscription.maxEmployees} />
                  <StatItem label="Max Companies" value={company.subscription.maxCompanies} />
                  <StatItem label="Max Locations" value={company.subscription.maxLocations} />
                  <div className="text-sm">
                    <span className="text-muted-foreground">Payroll: </span>
                    <span className="font-medium">{company.subscription.hasPayroll ? "Yes" : "No"}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Add-on Modules</CardTitle>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mt-2">No add-on modules assigned</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {modules.map((cm) => {
                    const isEnabled = cm.isEnabled ?? (cm.status === "ENABLED");
                    return (
                      <div key={cm.id} className="rounded-xl border border-border p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {cm.module?.name || cm.id}
                          </p>
                          <p className="text-xs text-muted-foreground">{cm.module?.category || "MODULE"}</p>
                        </div>
                        <Badge variant={isEnabled ? "default" : "secondary"}>
                          {isEnabled ? "Enabled" : (cm.status || "Disabled")}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Usage Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatItem label="Employees" value={company._count?.employees || 0} />
              <StatItem label="Locations" value={company._count?.locations || 0} />
              <StatItem label="Departments" value={company._count?.departments || 0} />
              <StatItem label="Active Members" value={company._count?.memberships || 0} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">No invoices yet</p>
                ) : (
                  <div className="divide-y divide-border">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="py-2.5 flex items-center justify-between text-sm">
                        <span className="font-mono">{inv.invoiceNumber}</span>
                        <span className="font-medium">
                          {inv.totalAmount.toFixed(2)} {inv.currency}
                        </span>
                        <Badge variant="outline">{inv.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-6">
                    <Activity className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mt-2">No support tickets</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {tickets.map((t) => (
                      <div key={t.id} className="py-2.5 flex items-center justify-between text-sm">
                        <span className="truncate max-w-[220px]">{t.subject}</span>
                        <Badge variant="outline">{t.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono text-sm text-foreground">{value.toLocaleString()}</span>
    </div>
  );
}
