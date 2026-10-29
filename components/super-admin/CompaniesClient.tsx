"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  PauseCircle,
  PlayCircle,
  Archive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Columns,
  ExternalLink,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  getCompaniesAction,
  suspendCompanyAction,
  reactivateCompanyAction,
  archiveCompanyAction,
  deleteCompanyAction,
  createCompanyAction,
} from "@/app/super-admin/companies/companies-actions";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  slug: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  adminEmail: z.string().email("Valid email required"),
  adminName: z.string().min(1, "Admin name required"),
  planTier: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]),
  tradeLicenseNumber: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().default("AED"),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface Company {
  id: string;
  name: string;
  slug: string;
  status: string;
  contactEmail: string | null;
  currency: string;
  primaryColor: string | null;
  createdAt: Date;
  subscription: {
    planTier: string;
    status: string;
    maxEmployees: number;
    maxCompanies: number;
    maxLocations: number;
  } | null;
  _count: {
    companies: number;
    employees: number;
    locations: number;
    users: number;
  };
}

interface CompaniesClientProps {
  initialData: {
    companies: Company[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  initialParams: {
    page: number;
    search: string;
    status: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE: { label: "Active", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle },
  TRIAL: { label: "Trial", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: AlertTriangle },
  SUSPENDED: { label: "Suspended", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: PauseCircle },
  ARCHIVED: { label: "Archived", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: Archive },
  CANCELLED: { label: "Cancelled", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: XCircle },
};

export function CompaniesClient({ initialData, initialParams }: CompaniesClientProps) {
  const [data, setData] = useState(initialData);
  const [params, setParams] = useState(initialParams);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      slug: "",
      adminEmail: "",
      adminName: "",
      planTier: "STARTER",
      tradeLicenseNumber: "",
      taxId: "",
      currency: "AED",
    },
  });

  const fetchData = async (newParams: typeof params) => {
    setLoading(true);
    try {
      const result = await getCompaniesAction(newParams);
      startTransition(() => {
        setData(result);
        setParams(newParams);
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(params);
  }, []);

  const handleSearch = (search: string) => {
    fetchData({ ...params, search, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    fetchData({ ...params, status, page: 1 });
  };

  const handlePageChange = (page: number) => {
    fetchData({ ...params, page });
  };

  const handleAction = async (action: string, tenantId: string, companyName: string) => {
    setActionLoading(tenantId);
    try {
      let result;
      switch (action) {
        case "suspend":
          result = await suspendCompanyAction(tenantId);
          toast.success(`${companyName} suspended successfully`);
          break;
        case "reactivate":
          result = await reactivateCompanyAction(tenantId);
          toast.success(`${companyName} reactivated successfully`);
          break;
        case "archive":
          result = await archiveCompanyAction(tenantId);
          toast.success(`${companyName} archived successfully`);
          break;
        case "delete":
          if (!confirm(`Are you sure you want to permanently delete ${companyName}? This cannot be undone.`)) {
            return;
          }
          result = await deleteCompanyAction(tenantId);
          toast.success(`${companyName} deleted successfully`);
          break;
      }
      fetchData(params);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} company`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (formData: CompanyFormData) => {
    setCreateLoading(true);
    try {
      const result = await createCompanyAction(formData);
      toast.success(`Company ${formData.name} created successfully`);
      setCreateDialogOpen(false);
      form.reset();
      fetchData(params);
    } catch (error: any) {
      toast.error(error.message || "Failed to create company");
    } finally {
      setCreateLoading(false);
    }
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "ACTIVE", label: "Active" },
    { value: "TRIAL", label: "Trial" },
    { value: "SUSPENDED", label: "Suspended" },
    { value: "ARCHIVED", label: "Archived" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const planOptions = [
    { value: "STARTER", label: "Starter" },
    { value: "GROWTH", label: "Growth" },
    { value: "ENTERPRISE", label: "Enterprise" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage tenant organizations: view, create, suspend, reactivate, and archive companies.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={createLoading}>
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>
                Create a new tenant organization with an initial administrator account.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Company Details</DialogTitle>
                  <DialogDescription>Basic information about the organization</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomain</FormLabel>
                        <FormControl>
                          <Input placeholder="acme-corp" {...field} />
                        </FormControl>
                        <FormDescription>.hrms-saas.com</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="planTier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Tier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {planOptions.map((plan) => (
                              <SelectItem key={plan.value} value={plan.value}>{plan.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Administrator Account</DialogTitle>
                  <DialogDescription>Create the initial company administrator</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="admin@acme.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <FormField
                    control={form.control}
                    name="tradeLicenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trade License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="CN-1234567" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax / VAT ID</FormLabel>
                        <FormControl>
                          <Input placeholder="100123456700003" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Company
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between"
      >
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search companies..."
              value={params.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-700/50"
            />
          </div>
          <Select value={params.status} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-slate-900/50 border-slate-700/50">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>Showing {data.companies.length} of {data.total} companies</span>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur-xl overflow-hidden"
      >
        <Table>
          <TableHeader className="bg-slate-950/50">
            <TableRow>
              <TableHead className="w-8">Status</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="hidden md:table-cell">Admin</TableHead>
              <TableHead className="hidden lg:table-cell">Employees</TableHead>
              <TableHead className="hidden lg:table-cell">Locations</TableHead>
              <TableHead className="hidden xl:table-cell">Created</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Building2 className="h-12 w-12 opacity-50" />
                    <p className="text-lg font-medium">No companies found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.companies.map((company, index) => (
                <motion.tr
                  key={company.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <TableCell className="flex items-center justify-center">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      statusConfig[company.status]?.color || "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    )}>
                      {(() => {
                        const Icon = statusConfig[company.status]?.icon;
                        return Icon ? <Icon className="h-3 w-3" /> : null;
                      })()}
                      {statusConfig[company.status]?.label || company.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white truncate max-w-[200px]">{company.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{company.slug}.hrms-saas.com</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <Layers className="h-3 w-3" />
                      {company.subscription?.planTier || "TRIAL"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {company.subscription && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="font-mono text-white">{company._count.employees}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="font-mono text-white">{company._count.locations}</span>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-slate-400">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4 text-slate-400 hover:text-white" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => handleAction("view", company.id, company.name)} className="flex items-center gap-2">
                          <Eye className="h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction("edit", company.id, company.name)} className="flex items-center gap-2">
                          <Edit className="h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {company.status === "ACTIVE" && (
                          <DropdownMenuItem onClick={() => handleAction("suspend", company.id, company.name)} className="flex items-center gap-2 text-amber-400" disabled={actionLoading === company.id}>
                            <PauseCircle className="h-4 w-4" /> Suspend
                          </DropdownMenuItem>
                        )}
                        {company.status === "SUSPENDED" && (
                          <DropdownMenuItem onClick={() => handleAction("reactivate", company.id, company.name)} className="flex items-center gap-2 text-emerald-400" disabled={actionLoading === company.id}>
                            <PlayCircle className="h-4 w-4" /> Reactivate
                          </DropdownMenuItem>
                        )}
                        {company.status !== "ARCHIVED" && company.status !== "CANCELLED" && (
                          <DropdownMenuItem onClick={() => handleAction("archive", company.id, company.name)} className="flex items-center gap-2 text-slate-400" disabled={actionLoading === company.id}>
                            <Archive className="h-4 w-4" /> Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleAction("delete", company.id, company.name)} className="flex items-center gap-2 text-rose-400 focus:text-rose-400" disabled={actionLoading === company.id}>
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-800/50">
            <div className="text-sm text-slate-400">
              Page {data.page} of {data.totalPages} ({data.total} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page === data.totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}