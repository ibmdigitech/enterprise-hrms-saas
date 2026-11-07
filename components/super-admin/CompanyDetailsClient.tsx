"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Users,
  CreditCard,
  Layers,
  Activity,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Shield,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
    createdAt: Date;
    subscription?: {
      planTier: string;
      status: string;
      maxEmployees: number;
      maxCompanies: number;
      maxLocations: number;
      hasPayroll: boolean;
      hasCompliance: boolean;
      hasRecruitment: boolean;
      hasCustomTheme: boolean;
      hasApiAccess: boolean;
    } | null;
    companies?: any[];
    memberships?: Array<{
      user: { id: string; name?: string | null; email: string; role: string; image?: string | null };
      role: string;
      status: string;
    }>;
    invoices?: any[];
    _count?: {
      employees: number;
      locations: number;
      departments: number;
      memberships: number;
    };
    companyModules?: any[];
    supportTickets?: any[];
    applicationErrors?: any[];
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: "Active", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
  TRIAL: { label: "Trial", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  SUSPENDED: { label: "Suspended", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: AlertCircle },
  ARCHIVED: { label: "Archived", color: "bg-slate-500/10 text-muted-foreground border-border", icon: Building2 },
  CANCELLED: { label: "Cancelled", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: AlertCircle },
};

const tierConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  TRIAL: { label: "Trial", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  STARTER: { label: "Starter", color: "bg-slate-500/10 text-muted-foreground border-border", icon: Building2 },
  GROWTH: { label: "Growth", color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: Users },
  ENTERPRISE: { label: "Enterprise", color: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: Shield },
  CUSTOM: { label: "Custom", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: Settings },
};

export function CompanyDetailsClient({ company }: CompanyDetailsClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const currentStatus = statusConfig[company.status] || { label: company.status, color: "bg-slate-500/10 text-muted-foreground border-border", icon: AlertCircle };
  const currentTier = tierConfig[company.subscription?.planTier || "TRIAL"] || tierConfig.TRIAL;
  const activeAdminCount = company.memberships?.filter((m) => m.role === "ADMIN").length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-primary-foreground">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{company.slug}.hrms-saas.com</span>
              <Badge className={cn("border", currentStatus.color)}>{currentStatus.label}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full rounded-2xl border border-border bg-muted/80 p-1 sm:w-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">
            Overview
          </TabsTrigger>
          <TabsTrigger value="branches" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">
            Branches
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">
            Users
          </TabsTrigger>
          <TabsTrigger value="subscription" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">
            Subscription
          </TabsTrigger>
          <TabsTrigger value="modules" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">
            Modules
          </TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">
            Usage
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-indigo-500/10 data-[state=active]:text-indigo-400">
            Settings
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <TabsContent value="overview" key="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Company Name</p>
                        <p className="font-medium text-foreground">{company.name}</p>
                      </div>
                      {company.legalName && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Legal Name</p>
                          <p className="font-medium text-foreground">{company.legalName}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Currency</p>
                        <p className="font-medium text-foreground">{company.currency}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Timezone</p>
                        <p className="font-medium text-foreground">{company.timezone}</p>
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
                    <StatItem label="Users" value={company._count?.memberships || 0} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {activeTab === "branches" && (
            <TabsContent value="branches" key="branches">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mt-2">No branches configured</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {activeTab === "users" && (
            <TabsContent value="users" key="users">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mt-2">No users found</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {activeTab === "subscription" && (
            <TabsContent value="subscription" key="subscription">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Current Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{company.subscription?.planTier || 'TRIAL'} Plan</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {activeTab === "modules" && (
            <TabsContent value="modules" key="modules">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Layers className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mt-2">No modules configured</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {activeTab === "usage" && (
            <TabsContent value="usage" key="usage">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Usage Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatItem label="Employees" value={company._count?.employees || 0} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {activeTab === "activity" && (
            <TabsContent value="activity" key="activity">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mt-2">No recent activity</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {activeTab === "settings" && (
            <TabsContent value="settings" key="settings">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mt-2">Settings coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </AnimatePresence>
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
