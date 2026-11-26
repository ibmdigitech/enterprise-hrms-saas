"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  Search,
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
  Layers,
  Wand2,
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
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
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
  updateCompanyAction,
} from "@/app/super-admin/companies/companies-actions";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  slug: z
    .string()
    .min(1, "Subdomain is required")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  adminEmail: z.string().email("Valid email required"),
  adminName: z.string().min(1, "Admin name required"),
  planTier: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]),
  tradeLicenseNumber: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string(),
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
  createdAt: Date | string;
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
    memberships?: number;
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

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  ACTIVE: {
    label: "Active",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: CheckCircle,
  },
  TRIAL: {
    label: "Trial",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: AlertTriangle,
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    icon: PauseCircle,
  },
  ARCHIVED: {
    label: "Archived",
    color: "bg-slate-500/10 text-muted-foreground border-border",
    icon: Archive,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    icon: XCircle,
  },
};

export function CompaniesClient({ initialData, initialParams }: CompaniesClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [params, setParams] = useState(initialParams);
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<Company | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCurrency, setEditCurrency] = useState("AED");
  const [editSaving, setEditSaving] = useState(false);

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
      toast.error(error?.message || "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }));
    fetchData({ ...params, search, page: 1 });
  };

  const handleStatusFilter = (statusValue: string) => {
    const normalizedStatus = statusValue === "ALL" ? "" : statusValue;
    fetchData({ ...params, status: normalizedStatus, page: 1 });
  };

  const handlePageChange = (page: number) => {
    fetchData({ ...params, page });
  };

  const openEditModal = (company: Company) => {
    setEditTarget(company);
    setEditName(company.name);
    setEditEmail(company.contactEmail || "");
    setEditCurrency(company.currency || "AED");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    try {
      await updateCompanyAction(editTarget.id, {
        name: editName,
        contactEmail: editEmail,
        currency: editCurrency,
      });
      toast.success(`${editName} updated successfully`);
      setEditTarget(null);
      fetchData(params);
    } catch (error: any) {
      toast.error(error?.message || "Failed to update company");
    } finally {
      setEditSaving(false);
    }
  };

  const handleAction = async (
    action: "view" | "edit" | "suspend" | "reactivate" | "archive" | "delete",
    company: Company
  ) => {
    if (action === "view") {
      router.push(`/super-admin/companies/${company.id}`);
      return;
    }
    if (action === "edit") {
      openEditModal(company);
      return;
    }

    if (
      action === "delete" &&
      !confirm(`Are you sure you want to permanently delete ${company.name}? This cannot be undone.`)
    ) {
      return;
    }

    setActionLoading(company.id);
    try {
      switch (action) {
        case "suspend":
          await suspendCompanyAction(company.id);
          toast.success(`${company.name} suspended successfully`);
          break;
        case "reactivate":
          await reactivateCompanyAction(company.id);
          toast.success(`${company.name} reactivated successfully`);
          break;
        case "archive":
          await archiveCompanyAction(company.id);
          toast.success(`${company.name} archived successfully`);
          break;
        case "delete":
          await deleteCompanyAction(company.id);
          toast.success(`${company.name} deleted successfully`);
          break;
      }
      fetchData(params);
    } catch (error: any) {
      toast.error(error?.message || `Failed to ${action} company`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (formData: CompanyFormData) => {
    setCreateLoading(true);
    try {
      await createCompanyAction(formData);
      toast.success(`Company ${formData.name} created successfully`);
      setCreateDialogOpen(false);
      form.reset();
      fetchData(params);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create company");
    } finally {
      setCreateLoading(false);
    }
  };

  const statusOptions = [
    { value: "ALL", label: "All Statuses" },
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
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tenant organizations: view, create, suspend, reactivate, and archive companies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/super-admin/companies/new">
            <Button variant="outline" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Onboarding Wizard
            </Button>
          </Link>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={createLoading}>
                <Plus className="h-4 w-4" />
                Quick Add Company
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
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
                    <Controller
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
                    <Controller
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
                    <Controller
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
                                <SelectItem key={plan.value} value={plan.value}>
                                  {plan.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-semibold mb-3">Administrator Account</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
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
                      <Controller
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
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 md:grid-cols-2">
                    <Controller
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
                    <Controller
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      disabled={createLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createLoading}>
                      {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Create Company
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update organization profile settings</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-company-name">Company Name</Label>
              <Input
                id="edit-company-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-company-email">Contact Email</Label>
              <Input
                id="edit-company-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={editCurrency} onValueChange={setEditCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
                disabled={editSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies by name, subdomain, trade license..."
              value={params.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="border-border bg-card pl-10"
            />
          </div>
          <Select
            value={params.status || "ALL"}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-full border-border bg-card sm:w-48">
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>
            Showing {data.companies.length} of {data.total} companies
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card/95 backdrop-blur-xl">
        <Table>
          <TableHeader className="bg-muted/80">
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead className="hidden md:table-cell">Contact / Users</TableHead>
              <TableHead className="hidden lg:table-cell">Employees</TableHead>
              <TableHead className="hidden lg:table-cell">Locations</TableHead>
              <TableHead className="hidden xl:table-cell">Created</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Building2 className="h-12 w-12 opacity-50" />
                    <p className="text-lg font-medium">No companies found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.companies.map((company) => {
                const StatusIcon = statusConfig[company.status]?.icon;
                return (
                  <TableRow
                    key={company.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                          statusConfig[company.status]?.color ||
                            "bg-slate-500/10 text-muted-foreground border-border"
                        )}
                      >
                        {StatusIcon && <StatusIcon className="h-3 w-3" />}
                        {statusConfig[company.status]?.label || company.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/super-admin/companies/${company.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[200px] group-hover:text-indigo-500 transition-colors">
                            {company.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {company.slug}.hrms-saas.com
                          </p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-500 border border-violet-500/20">
                        <Layers className="h-3 w-3" />
                        {company.subscription?.planTier || "TRIAL"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-xs">
                        <p className="text-foreground truncate max-w-[180px]">
                          {company.contactEmail || "—"}
                        </p>
                        <p className="text-muted-foreground">
                          {company._count?.memberships ?? 0} users •{" "}
                          {company._count?.companies ?? 0} entities
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-foreground">
                        {company._count?.employees ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="font-mono text-foreground">
                        {company._count?.locations ?? 0}
                      </span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={actionLoading === company.id}
                          >
                            {actionLoading === company.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem
                            onClick={() => handleAction("view", company)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction("edit", company)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {company.status === "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={() => handleAction("suspend", company)}
                              className="flex items-center gap-2 text-amber-500"
                            >
                              <PauseCircle className="h-4 w-4" /> Suspend
                            </DropdownMenuItem>
                          )}
                          {company.status === "SUSPENDED" && (
                            <DropdownMenuItem
                              onClick={() => handleAction("reactivate", company)}
                              className="flex items-center gap-2 text-emerald-500"
                            >
                              <PlayCircle className="h-4 w-4" /> Reactivate
                            </DropdownMenuItem>
                          )}
                          {company.status !== "ARCHIVED" && company.status !== "CANCELLED" && (
                            <DropdownMenuItem
                              onClick={() => handleAction("archive", company)}
                              className="flex items-center gap-2 text-muted-foreground"
                            >
                              <Archive className="h-4 w-4" /> Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleAction("delete", company)}
                            className="flex items-center gap-2 text-rose-500 focus:text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border/50">
            <div className="text-sm text-muted-foreground">
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
      </div>
    </div>
  );
}
