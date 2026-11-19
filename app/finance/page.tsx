import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    Building2, 
    CreditCard, 
    TrendingUp, 
    Receipt, 
    ShoppingBag, 
    Boxes, 
    ArrowUpRight, 
    Wallet, 
    CheckCircle2, 
    Clock, 
    AlertTriangle,
    DollarSign,
    Layers,
    FileSpreadsheet,
    ShieldCheck
} from "lucide-react";
import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function FinanceDashboardPage() {
    await requirePagePermission(PERMISSIONS.FINANCE_VIEW);

    const session = await auth();
    if (!session) redirect("/login");

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Monthly Payroll Sum (Real DB Query)
    let totalPayrollThisMonth = 0;
    try {
        const payrollAgg = await prisma.salaryRecord.aggregate({
            _sum: { netSalary: true },
            where: { month: currentMonth, year: currentYear }
        });
        totalPayrollThisMonth = payrollAgg._sum.netSalary || 0;
    } catch (e) {
        console.error("Payroll query error in finance dashboard:", e);
    }

    // 2. Pending Reimbursements (Real DB Query)
    let pendingReimbursementsCount = 0;
    let pendingReimbursementsTotal = 0;
    let pendingReimbursements: any[] = [];
    try {
        const reimbursements = await prisma.reimbursementRequest.findMany({
            where: { status: "PENDING" },
            include: { employee: true },
            orderBy: { createdAt: "desc" },
            take: 5
        });
        pendingReimbursements = reimbursements;
        pendingReimbursementsCount = reimbursements.length;
        pendingReimbursementsTotal = reimbursements.reduce((sum, item) => sum + item.amount, 0);
    } catch (e) {
        console.error("Reimbursements query error in finance dashboard:", e);
    }

    // 3. Petty Cash Total Balance (Real DB Query)
    let totalPettyCashFloat = 0;
    let pettyCashFundsCount = 0;
    try {
        const funds = await prisma.pettyCashFund.findMany({
            where: { isActive: true }
        });
        pettyCashFundsCount = funds.length;
        totalPettyCashFloat = funds.reduce((sum, f) => sum + Number(f.currentBalance), 0);
    } catch (e) {
        console.error("Petty cash query error in finance dashboard:", e);
    }

    // 4. Budget Totals & Utilization (Real DB Query)
    let totalAllocatedBudget = 0;
    let totalCommittedBudget = 0;
    let totalActualBudget = 0;
    try {
        const budgets = await prisma.budget.findMany({
            where: { fiscalYear: currentYear }
        });
        totalAllocatedBudget = budgets.reduce((sum, b) => sum + Number(b.allocatedAmount), 0);
        totalCommittedBudget = budgets.reduce((sum, b) => sum + Number(b.committedAmount), 0);
        totalActualBudget = budgets.reduce((sum, b) => sum + Number(b.actualSpent), 0);
    } catch (e) {
        console.error("Budget query error in finance dashboard:", e);
    }

    // 5. Open Purchase Orders & Accounts Payable (Real DB Query)
    let openPOCount = 0;
    let openPOTotal = 0;
    try {
        const pos = await prisma.purchaseOrder.findMany({
            where: { status: { in: ["DRAFT", "CONFIRMED", "SENT"] } }
        });
        openPOCount = pos.length;
        openPOTotal = pos.reduce((sum, po) => sum + Number(po.totalAmount), 0);
    } catch (e) {
        console.error("PO query error in finance dashboard:", e);
    }

    // 6. Outstanding Supplier Invoices (Real DB Query)
    let unpaidInvoicesTotal = 0;
    let unpaidInvoicesCount = 0;
    try {
        const invoices = await prisma.supplierInvoice.findMany({
            where: { status: { not: "PAID" } }
        });
        unpaidInvoicesCount = invoices.length;
        unpaidInvoicesTotal = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0);
    } catch (e) {
        console.error("Invoices query error in finance dashboard:", e);
    }

    const budgetUtilizationPercent = totalAllocatedBudget > 0
        ? Math.round(((totalCommittedBudget + totalActualBudget) / totalAllocatedBudget) * 100)
        : 0;

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white shadow-xl border border-indigo-900/40">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Enterprise Finance Engine
                            </span>
                            <span className="text-xs text-indigo-300">Fiscal Year {currentYear}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-emerald-400" />
                            Finance & Administration Center
                        </h1>
                        <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                            Consolidated corporate expenditure oversight, departmental budget management, petty cash custodianship, employee claims, procurement workflows, and accounts payable.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/finance/budget">
                            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                                <TrendingUp className="w-4 h-4 mr-2 text-indigo-400" />
                                Budgeting
                            </Button>
                        </Link>
                        <Link href="/finance/petty-cash">
                            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                                <Wallet className="w-4 h-4 mr-2 text-amber-400" />
                                Petty Cash
                            </Button>
                        </Link>
                        <Link href="/finance/expenses">
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-md">
                                <Receipt className="w-4 h-4 mr-2" />
                                Expense Claims
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Top Financial KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Monthly Payroll */}
                <Card className="border-border/60 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Monthly Payroll
                        </CardTitle>
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                            <CreditCard className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">AED {totalPayrollThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span>Month {currentMonth}/{currentYear} disbursement</span>
                        </p>
                    </CardContent>
                </Card>

                {/* Petty Cash Float */}
                <Card className="border-border/60 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Petty Cash Float
                        </CardTitle>
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">AED {totalPettyCashFloat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across {pettyCashFundsCount} active branch fund{pettyCashFundsCount !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                {/* Outstanding Invoices (AP) */}
                <Card className="border-border/60 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Accounts Payable
                        </CardTitle>
                        <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">AED {unpaidInvoicesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-xs text-rose-500 mt-1 font-medium">
                            {unpaidInvoicesCount} unpaid supplier invoice{unpaidInvoicesCount !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                {/* Budget Utilization */}
                <Card className="border-border/60 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Budget Utilization
                        </CardTitle>
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{budgetUtilizationPercent}%</div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all ${
                                    budgetUtilizationPercent > 90 ? 'bg-rose-500' : budgetUtilizationPercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${Math.min(budgetUtilizationPercent, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            AED {(totalCommittedBudget + totalActualBudget).toLocaleString()} of AED {totalAllocatedBudget.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Access Operational Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Link href="/finance/budget" className="group">
                    <div className="p-4 rounded-xl border border-border/60 bg-card hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-400/50 transition-all text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-card-foreground">Budgets</span>
                    </div>
                </Link>

                <Link href="/finance/petty-cash" className="group">
                    <div className="p-4 rounded-xl border border-border/60 bg-card hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:border-amber-400/50 transition-all text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-card-foreground">Petty Cash</span>
                    </div>
                </Link>

                <Link href="/finance/expenses" className="group">
                    <div className="p-4 rounded-xl border border-border/60 bg-card hover:bg-rose-50/50 dark:hover:bg-rose-950/20 hover:border-rose-400/50 transition-all text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-card-foreground">Expense Claims</span>
                    </div>
                </Link>

                <Link href="/finance/procurement" className="group">
                    <div className="p-4 rounded-xl border border-border/60 bg-card hover:bg-sky-50/50 dark:hover:bg-sky-950/20 hover:border-sky-400/50 transition-all text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-card-foreground">Procurement & PO</span>
                    </div>
                </Link>

                <Link href="/finance/inventory" className="group">
                    <div className="p-4 rounded-xl border border-border/60 bg-card hover:bg-teal-50/50 dark:hover:bg-teal-950/20 hover:border-teal-400/50 transition-all text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                            <Boxes className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-card-foreground">Office Supplies</span>
                    </div>
                </Link>

                <Link href="/finance/accounts-payable" className="group">
                    <div className="p-4 rounded-xl border border-border/60 bg-card hover:bg-violet-50/50 dark:hover:bg-violet-950/20 hover:border-violet-400/50 transition-all text-center flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-card-foreground">Accounts Payable</span>
                    </div>
                </Link>
            </div>

            {/* Split Section: Pending Claims & Procurement Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Reimbursements */}
                <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-emerald-500" />
                                Pending Reimbursement Claims
                            </CardTitle>
                            <CardDescription>
                                {pendingReimbursementsCount} claim{pendingReimbursementsCount !== 1 ? 's' : ''} awaiting financial clearance
                            </CardDescription>
                        </div>
                        <Link href="/finance/expenses">
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                                View All
                                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {pendingReimbursements.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                                No pending reimbursement claims at this time.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs">Employee</TableHead>
                                        <TableHead className="text-xs">Category</TableHead>
                                        <TableHead className="text-xs text-right">Amount</TableHead>
                                        <TableHead className="text-xs">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingReimbursements.map((claim) => (
                                        <TableRow key={claim.id}>
                                            <TableCell className="text-xs font-medium">
                                                {claim.employee?.firstName} {claim.employee?.lastName}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {claim.category}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold text-right">
                                                AED {claim.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">
                                                    {claim.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Procurement & Purchase Commitments */}
                <Card className="border-border/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4 text-sky-500" />
                                Active Purchase Commitments
                            </CardTitle>
                            <CardDescription>
                                Committed procurement and open vendor orders
                            </CardDescription>
                        </div>
                        <Link href="/finance/procurement">
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
                                Manage POs
                                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted/40 border border-border/40">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-sky-500/10 text-sky-500">
                                        <ShoppingBag className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium">Open Purchase Orders</p>
                                        <p className="text-[11px] text-muted-foreground">{openPOCount} active orders in progress</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold">AED {openPOTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    <span className="text-[10px] text-sky-500 font-medium">Committed</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted/40 border border-border/40">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-emerald-500/10 text-emerald-500">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium">Payroll Integration Status</p>
                                        <p className="text-[11px] text-muted-foreground">Approved reimbursements auto-synced to payslip</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]">
                                        Active Sync
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
