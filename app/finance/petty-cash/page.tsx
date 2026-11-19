import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    Wallet, 
    Plus, 
    ArrowLeft, 
    AlertTriangle, 
    Receipt, 
    CheckCircle2, 
    Clock, 
    DollarSign,
    RefreshCw,
    UserCheck
} from "lucide-react";
import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { 
    createPettyCashFund, 
    recordPettyCashTransaction, 
    requestReplenishment, 
    approveReplenishment 
} from "@/app/lib/actions/finance";

export default async function PettyCashPage() {
    await requirePagePermission(PERMISSIONS.PETTY_CASH_VIEW);

    const session = await auth();
    if (!session) redirect("/login");

    let funds: any[] = [];
    let transactions: any[] = [];
    let replenishments: any[] = [];

    try {
        funds = await prisma.pettyCashFund.findMany({
            orderBy: { createdAt: "desc" },
        });

        transactions = await prisma.pettyCashTransaction.findMany({
            include: { fund: true },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        replenishments = await prisma.pettyCashReplenishment.findMany({
            include: { fund: true },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
    } catch (e) {
        console.error("Error fetching petty cash data:", e);
    }

    const totalFloat = funds.reduce((sum, f) => sum + Number(f.currentBalance), 0);
    const lowFunds = funds.filter(f => Number(f.currentBalance) <= 500);

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
                            <Wallet className="w-6 h-6 text-amber-500" />
                            Petty Cash Custodianship & Float Management
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Branch cash floats, digital voucher disbursements, threshold monitoring, and automated replenishment workflows
                        </p>
                    </div>
                </div>
            </div>

            {/* Threshold Alert if any fund is low */}
            {lowFunds.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <div>
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                Low Float Warning ({lowFunds.length} fund{lowFunds.length > 1 ? 's' : ''})
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {lowFunds.map(f => `${f.name} (Balance: AED ${Number(f.currentBalance).toFixed(2)})`).join(", ")} below minimum threshold.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Petty Cash on Hand</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">AED {totalFloat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Across {funds.length} authorized branch funds</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active Custodian Funds</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{funds.length}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Registered cash holding points</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Pending Replenishments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-500">
                            {replenishments.filter(r => r.status === "PENDING").length}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">Awaiting financial clearance</p>
                    </CardContent>
                </Card>
            </div>

            {/* Split Action Forms: Create Fund & Record Voucher */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Record Voucher / Expense */}
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-emerald-500" />
                            Issue Petty Cash Voucher (Disbursement)
                        </CardTitle>
                        <CardDescription>Record an urgent cash expenditure against an active float</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={recordPettyCashTransaction} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Petty Cash Fund</label>
                                <select 
                                    name="fundId" 
                                    required 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    {funds.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} (Balance: AED {Number(f.currentBalance).toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount (AED)</label>
                                    <input 
                                        name="amount" 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        placeholder="120.00" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Expense Category</label>
                                    <select 
                                        name="expenseCategory" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="OFFICE_SUPPLIES">Office Supplies</option>
                                        <option value="LOCAL_TRANSPORT">Local Taxi / Transport</option>
                                        <option value="HOSPITALITY">Refreshments / Meeting</option>
                                        <option value="POSTAGE_COURIER">Courier / Postage</option>
                                        <option value="MINOR_REPAIRS">Minor Repairs</option>
                                        <option value="MISCELLANEOUS">Miscellaneous</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Paid To (Payee)</label>
                                    <input 
                                        name="paidTo" 
                                        required 
                                        placeholder="e.g. DHL Express / Store" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                                    <input 
                                        name="description" 
                                        required 
                                        placeholder="e.g. Urgent client package courier" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white size-sm mt-2">
                                Record Voucher & Deduct Float
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Create Fund or Replenish */}
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Plus className="w-4 h-4 text-amber-500" />
                            Create New Petty Cash Fund
                        </CardTitle>
                        <CardDescription>Assign an opening float to a branch or department custodian</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createPettyCashFund} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Fund Name</label>
                                <input 
                                    name="name" 
                                    required 
                                    placeholder="e.g. Dubai HQ - Admin Cash Float" 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Opening Float (AED)</label>
                                    <input 
                                        name="openingFloat" 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        placeholder="2000.00" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Min. Alert Threshold (AED)</label>
                                    <input 
                                        name="minimumThreshold" 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        placeholder="500.00" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white size-sm mt-2">
                                Register Cash Fund
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions Log */}
            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        Voucher Transaction History
                    </CardTitle>
                    <CardDescription>Audit record of all disbursements and replenish float receipts</CardDescription>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center py-10 text-sm text-muted-foreground border border-dashed rounded-lg">
                            No petty cash vouchers logged yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Voucher #</TableHead>
                                    <TableHead className="text-xs">Fund</TableHead>
                                    <TableHead className="text-xs">Type</TableHead>
                                    <TableHead className="text-xs">Category</TableHead>
                                    <TableHead className="text-xs">Paid To / Description</TableHead>
                                    <TableHead className="text-xs text-right">Amount</TableHead>
                                    <TableHead className="text-xs">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-xs font-mono font-medium">PCV-{tx.id.slice(-6).toUpperCase()}</TableCell>
                                        <TableCell className="text-xs">{tx.fund?.name}</TableCell>
                                        <TableCell className="text-xs">
                                            <Badge variant="outline" className={`text-[10px] ${
                                                tx.transactionType === "RECEIPT" ? "text-emerald-500 border-emerald-500/30" : "text-amber-500 border-amber-500/30"
                                            }`}>
                                                {tx.transactionType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{tx.category}</TableCell>
                                        <TableCell className="text-xs">
                                            {tx.description}
                                        </TableCell>
                                        <TableCell className={`text-xs text-right font-bold ${
                                            tx.transactionType === "RECEIPT" ? "text-emerald-500" : "text-rose-500"
                                        }`}>
                                            {tx.transactionType === "RECEIPT" ? "+" : "-"} AED {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(tx.createdAt).toLocaleDateString()}
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
