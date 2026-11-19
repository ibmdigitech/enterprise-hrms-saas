import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    TrendingUp, 
    Plus, 
    ArrowLeft, 
    Building2, 
    AlertTriangle, 
    FileText, 
    CheckCircle2, 
    Clock, 
    Percent, 
    BarChart3 
} from "lucide-react";
import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createBudget, createBudgetRevision, approveBudgetRevision } from "@/app/lib/actions/finance";

export default async function BudgetManagementPage() {
    await requirePagePermission(PERMISSIONS.BUDGET_VIEW);

    const session = await auth();
    if (!session) redirect("/login");

    const currentYear = new Date().getFullYear();

    let budgets: any[] = [];
    let revisions: any[] = [];
    let departments: any[] = [];

    try {
        budgets = await prisma.budget.findMany({
            where: { fiscalYear: currentYear },
            orderBy: { createdAt: "desc" },
        });

        revisions = await prisma.budgetRevision.findMany({
            include: { budget: true },
            orderBy: { createdAt: "desc" },
            take: 10,
        });

        departments = await prisma.department.findMany({
            orderBy: { name: "asc" }
        });
    } catch (e) {
        console.error("Error fetching budget data:", e);
    }

    const totalAllocated = budgets.reduce((sum, b) => sum + Number(b.allocatedAmount), 0);
    const totalCommitted = budgets.reduce((sum, b) => sum + Number(b.committedAmount), 0);
    const totalActual = budgets.reduce((sum, b) => sum + Number(b.actualSpent), 0);
    const totalAvailable = totalAllocated - totalCommitted - totalActual;
    const overallUtilization = totalAllocated > 0 ? Math.round(((totalCommitted + totalActual) / totalAllocated) * 100) : 0;

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
                <div className="flex items-center gap-3">
                    <Link href="/finance">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-indigo-500" />
                            Corporate & Departmental Budgets
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Fiscal Year {currentYear} • Controlled expenditure allocations, revision audit trails and variance analysis
                        </p>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Approved Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">AED {totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Total allocation for {currentYear}</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Committed (POs)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-sky-500">AED {totalCommitted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Pending purchase commitments</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Actual Expended</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">AED {totalActual.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Invoiced and disbursed expenses</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Available Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">AED {totalAvailable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(overallUtilization, 100)}%` }} />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{overallUtilization}% overall utilization</p>
                    </CardContent>
                </Card>
            </div>

            {/* Create Budget Allocation Form */}
            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-500" />
                        Allocate New Budget Line
                    </CardTitle>
                    <CardDescription>Allocate approved funds to a corporate department or expenditure category</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={createBudget} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Budget Name</label>
                            <input 
                                name="name" 
                                required 
                                placeholder="e.g. Q1 IT Infrastructure" 
                                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
                            <select 
                                name="departmentId" 
                                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">Corporate-wide (General)</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                            <select 
                                name="budgetCategory" 
                                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="OPERATIONAL">Operational (OPEX)</option>
                                <option value="CAPITAL">Capital (CAPEX)</option>
                                <option value="PAYROLL">Payroll & Benefits</option>
                                <option value="MARKETING">Marketing & Sales</option>
                                <option value="FACILITIES">Facilities & Admin</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Allocated Amount (AED)</label>
                            <div className="flex gap-2">
                                <input 
                                    name="allocatedAmount" 
                                    type="number" 
                                    step="0.01" 
                                    required 
                                    placeholder="50000" 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shrink-0">
                                    Create
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Budget Allocations Table */}
            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Active Budget Allocations ({currentYear})</CardTitle>
                    <CardDescription>Available balance = Approved budget - Committed purchase orders - Actual expenditure</CardDescription>
                </CardHeader>
                <CardContent>
                    {budgets.length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-lg">
                            No budget lines have been created for {currentYear}. Allocate your first line above.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Budget Line</TableHead>
                                    <TableHead className="text-xs">Category</TableHead>
                                    <TableHead className="text-xs text-right">Allocated</TableHead>
                                    <TableHead className="text-xs text-right">Committed</TableHead>
                                    <TableHead className="text-xs text-right">Actual</TableHead>
                                    <TableHead className="text-xs text-right">Available</TableHead>
                                    <TableHead className="text-xs text-center">Utilization</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {budgets.map((b) => {
                                    const util = Number(b.allocatedAmount) > 0 
                                        ? Math.round(((Number(b.committedAmount) + Number(b.actualSpent)) / Number(b.allocatedAmount)) * 100) 
                                        : 0;
                                    const available = Number(b.allocatedAmount) - Number(b.committedAmount) - Number(b.actualSpent);

                                    return (
                                        <TableRow key={b.id}>
                                            <TableCell className="text-xs font-semibold text-foreground">
                                                {b.name}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <Badge variant="outline" className="text-[10px]">
                                                    General
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-right font-medium">
                                                AED {Number(b.allocatedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-xs text-right text-sky-500">
                                                AED {Number(b.committedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-xs text-right text-amber-500">
                                                AED {Number(b.actualSpent).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-xs text-right font-bold text-emerald-500">
                                                AED {available.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-xs text-center font-medium">
                                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                                    util > 90 ? 'bg-rose-500/10 text-rose-500' : util > 70 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                                                }`}>
                                                    {util}%
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                                    {b.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Budget Revisions Section */}
            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        Budget Revisions & Audit Log
                    </CardTitle>
                    <CardDescription>All adjustments to approved allocations require an audit trail</CardDescription>
                </CardHeader>
                <CardContent>
                    {revisions.length === 0 ? (
                        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                            No budget revision requests recorded yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Budget</TableHead>
                                    <TableHead className="text-xs">Type</TableHead>
                                    <TableHead className="text-xs text-right">Previous</TableHead>
                                    <TableHead className="text-xs text-right">Revised Amount</TableHead>
                                    <TableHead className="text-xs">Reason</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {revisions.map((rev) => (
                                    <TableRow key={rev.id}>
                                        <TableCell className="text-xs font-medium">{rev.budget?.name}</TableCell>
                                        <TableCell className="text-xs">
                                            <Badge variant="outline" className="text-[10px]">{rev.revisionType}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-right">AED {Number(rev.previousAmount).toLocaleString()}</TableCell>
                                        <TableCell className="text-xs text-right font-bold text-indigo-500">AED {Number(rev.newAmount).toLocaleString()}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{rev.reason}</TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] ${
                                                rev.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-500" :
                                                rev.status === "REJECTED" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                                            }`}>
                                                {rev.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
