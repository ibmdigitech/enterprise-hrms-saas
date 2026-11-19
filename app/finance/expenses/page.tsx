import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    Receipt, 
    ArrowLeft, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    CreditCard, 
    Filter,
    ShieldCheck,
    Coins
} from "lucide-react";
import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { approveReimbursement, rejectReimbursement } from "@/app/lib/actions/finance";

export default async function ExpenseClaimsPage() {
    await requirePagePermission(PERMISSIONS.EXPENSE_VIEW);

    const session = await auth();
    if (!session) redirect("/login");

    let claims: any[] = [];
    try {
        claims = await prisma.reimbursementRequest.findMany({
            include: { employee: true },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
    } catch (e) {
        console.error("Error fetching expense claims:", e);
    }

    const pendingClaims = claims.filter(c => c.status === "PENDING");
    const approvedClaims = claims.filter(c => c.status === "APPROVED");
    const totalPendingAmount = pendingClaims.reduce((sum, c) => sum + c.amount, 0);
    const totalApprovedAmount = approvedClaims.reduce((sum, c) => sum + c.amount, 0);

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
                            <Receipt className="w-6 h-6 text-rose-500" />
                            Employee Expense Claims & Reimbursements
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Claim verification, multi-tier approvals, receipt verification, and automated payroll settlement integration
                        </p>
                    </div>
                </div>
            </div>

            {/* Payroll Sync Notice */}
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400">Automated Payroll Integration Active</p>
                    <p className="text-muted-foreground mt-0.5">
                        Approved expense claims are automatically accumulated into the employee's monthly <span className="font-mono text-indigo-400">reimbursementTotal</span> and disbursed with their regular payroll run.
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Pending Claims</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">AED {totalPendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">{pendingClaims.length} awaiting financial review</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Approved for Payroll</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">AED {totalApprovedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">{approvedClaims.length} cleared for next cycle</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{claims.length}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">All-time employee claims</p>
                    </CardContent>
                </Card>
            </div>

            {/* Claims Table */}
            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Expense Claims Registry</CardTitle>
                    <CardDescription>Review and clear employee claims submitted across all departments</CardDescription>
                </CardHeader>
                <CardContent>
                    {claims.length === 0 ? (
                        <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-lg">
                            No employee expense claims found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Employee</TableHead>
                                    <TableHead className="text-xs">Category</TableHead>
                                    <TableHead className="text-xs">Description / Details</TableHead>
                                    <TableHead className="text-xs text-right">Amount</TableHead>
                                    <TableHead className="text-xs">Date</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {claims.map((claim) => (
                                    <TableRow key={claim.id}>
                                        <TableCell className="text-xs font-medium">
                                            {claim.employee?.firstName} {claim.employee?.lastName}
                                            <span className="block text-[10px] text-muted-foreground">{claim.employee?.employeeCode}</span>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            <Badge variant="outline" className="text-[10px]">
                                                {claim.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs max-w-xs truncate text-muted-foreground">
                                            {claim.details || "No details provided"}
                                        </TableCell>
                                        <TableCell className="text-xs text-right font-bold">
                                            AED {claim.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(claim.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] ${
                                                claim.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                                                claim.status === "REJECTED" ? "bg-rose-500/10 text-rose-500 border-rose-500/30" :
                                                "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                            }`}>
                                                {claim.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-right">
                                            {claim.status === "PENDING" && (
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <form action={approveReimbursement.bind(null, claim.id)}>
                                                        <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                                            Approve
                                                        </Button>
                                                    </form>
                                                    <form action={rejectReimbursement.bind(null, claim.id, "Rejected by Finance")}>
                                                        <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                                                            <XCircle className="w-3.5 h-3.5 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </form>
                                                </div>
                                            )}
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
