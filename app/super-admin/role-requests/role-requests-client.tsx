"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  UserPlus,
  ShieldCheck,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Loader2,
  MessageSquare,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { updateRoleRequestStatusAction } from "./role-requests-actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RoleRequestsClientProps {
  initialData: {
    requests: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  initialParams: {
    page: number;
    status: string;
    role: string;
    search: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: Clock },
  APPROVED: { label: "Approved", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", icon: XCircle },
};

const roleConfig: Record<string, { label: string; color: string }> = {
  MANAGER: { label: "Manager", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  HR: { label: "HR Specialist", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

export function RoleRequestsClient({ initialData, initialParams }: RoleRequestsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [params, setParams] = useState(initialParams);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = async (newParams: typeof params) => {
    const searchParams = new URLSearchParams();
    if (newParams.page > 1) searchParams.set("page", String(newParams.page));
    if (newParams.status) searchParams.set("status", newParams.status);
    if (newParams.role) searchParams.set("role", newParams.role);
    if (newParams.search) searchParams.set("search", newParams.search);

    const res = await fetch(`/api/super-admin/role-requests?${searchParams.toString()}`);
    if (res.ok) {
      const result = await res.json();
      startTransition(() => {
        setData(result);
        setParams(newParams);
      });
    } else {
      toast.error("Failed to fetch role requests");
    }
  };

  const handleSearch = (search: string) => {
    fetchData({ ...params, search, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    fetchData({ ...params, status: status === "ALL" ? "" : status, page: 1 });
  };

  const handleRoleFilter = (role: string) => {
    fetchData({ ...params, role: role === "ALL" ? "" : role, page: 1 });
  };

  const handlePageChange = (page: number) => {
    fetchData({ ...params, page });
  };

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const res = await fetch("/api/super-admin/role-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "approve" }),
      });
      if (res.ok) {
        toast.success("Role request approved");
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to approve request");
      }
    } catch {
      toast.error("Failed to approve request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectOpen = (requestId: string) => {
    setRejectRequestId(requestId);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectRequestId) return;
    setActionLoading(rejectRequestId);
    try {
      const res = await fetch("/api/super-admin/role-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: rejectRequestId, action: "reject", reason: rejectReason }),
      });
      if (res.ok) {
        toast.success("Role request rejected");
        setRejectDialogOpen(false);
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to reject request");
      }
    } catch {
      toast.error("Failed to reject request");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-indigo-400" />
            Role Access Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage user requests for elevated role permissions (Manager, HR).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {data.total} total requests
          </span>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <div className="rounded-xl p-4 bg-white/5 bg-card/50 backdrop-blur-xl border border-white/10 border-border/50">
          <p className="text-sm font-medium text-muted-foreground text-muted-foreground">Total Requests</p>
          <p className="text-2xl font-bold text-foreground mt-1">{data.total}</p>
        </div>
        <div className="rounded-xl p-4 bg-white/5 bg-card/50 backdrop-blur-xl border border-white/10 border-border/50">
          <p className="text-sm font-medium text-muted-foreground text-muted-foreground">Pending Review</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {data.requests.filter((r) => r.status === "PENDING").length}
          </p>
        </div>
        <div className="rounded-xl p-4 bg-white/5 bg-card/50 backdrop-blur-xl border border-white/10 border-border/50">
          <p className="text-sm font-medium text-muted-foreground text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {data.requests.filter((r) => r.status === "APPROVED").length}
          </p>
        </div>
        <div className="rounded-xl p-4 bg-white/5 bg-card/50 backdrop-blur-xl border border-white/10 border-border/50">
          <p className="text-sm font-medium text-muted-foreground text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">
            {data.requests.filter((r) => r.status === "REJECTED").length}
          </p>
        </div>
      </motion.div>

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between"
      >
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={params.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-card border-border/50"
            />
          </div>
          <Select value={params.status || "ALL"} onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card border-border/50">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={params.role || "ALL"} onValueChange={handleRoleFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card border-border/50">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="HR">HR Specialist</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border/50 bg-card backdrop-blur-xl overflow-hidden"
      >
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow>
              <TableHead className="w-8">Status</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="hidden sm:table-cell">Company</TableHead>
              <TableHead>Requested Role</TableHead>
              <TableHead className="hidden md:table-cell">Current Role</TableHead>
              <TableHead className="hidden lg:table-cell">Requested</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ShieldCheck className="h-12 w-12 opacity-50" />
                    <p className="text-lg font-medium">No role requests found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.requests.map((request, index) => (
                <motion.tr
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="flex items-center justify-center">
                    <Badge variant="outline" className={cn(statusConfig[request.status]?.color, "gap-1.5")}>
                      {(() => {
                        const Icon = statusConfig[request.status]?.icon;
                        return Icon ? <Icon className="h-3 w-3" /> : null;
                      })()}
                      {statusConfig[request.status]?.label || request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                        <User className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground truncate max-w-[200px]">{request.user?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{request.user?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {request.tenant ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{request.tenant.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{request.tenant.slug}.hrms-saas.com</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Global / Platform</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(roleConfig[request.requestedRole]?.color, "gap-1.5")}>
                      <ShieldCheck className="h-3 w-3" />
                      {roleConfig[request.requestedRole]?.label || request.requestedRole}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                      <User className="h-3 w-3" />
                      {request.user?.role || "STAFF"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground font-mono">
                    {format(new Date(request.createdAt), "yyyy-MM-dd HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.status === "PENDING" ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(request.id)}
                          disabled={actionLoading === request.id}
                          className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectOpen(request.id)}
                          disabled={actionLoading === request.id}
                          className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="outline" className={cn(statusConfig[request.status]?.color, "gap-1")}>
                        {(() => {
                          const Icon = statusConfig[request.status]?.icon;
                          return Icon ? <Icon className="h-3 w-3" /> : null;
                        })()}
                        {statusConfig[request.status]?.label || request.status}
                      </Badge>
                    )}
                  </TableCell>
                </motion.tr>
              ))
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
                disabled={data.page === 1 || isPending}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page === data.totalPages || isPending}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Role Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this request. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleRejectSubmit(); }} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="rejectReason" className="text-sm font-medium text-muted-foreground">
                Reason for Rejection
              </label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Optional: Explain why this request is being rejected..."
                className="bg-background border-border"
                rows={3}
              />
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading === rejectRequestId}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={actionLoading === rejectRequestId}>
                {actionLoading === rejectRequestId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Reject Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}