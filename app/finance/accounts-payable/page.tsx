import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    FileSpreadsheet, 
    Plus, 
    ArrowLeft, 
    Building2, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    DollarSign,
    CreditCard,
    Calendar
} from "lucide-react";
import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createSupplierInvoice, recordInvoicePayment } from "@/app/lib/actions/finance";

export default async function AccountsPayablePage() {
    await requirePagePermission(PERMISSIONS.ACCOUNTS_PAYABLE_VIEW);

    const session = await auth();
    if (!session) redirect("/login");

    let invoices: any[] = [];
    let suppliers: any[] = [];

    try {
        invoices = await prisma.supplierInvoice.findMany({
            include: { supplier: true },
            orderBy: { dueDate: "asc" },
            take: 40,
        });

        suppliers = await prisma.supplier.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" }
        });
    } catch (e) {
        console.error("Error fetching accounts payable data:", e);
    }

    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
    const totalOutstanding = totalInvoiced - totalPaid;
    const unpaidCount = invoices.filter(inv => inv.status !== "PAID").length;

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
                            <FileSpreadsheet className="w-6 h-6 text-violet-500" />
                            Accounts Payable & Vendor Invoicing
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Supplier invoice processing, aging ledger, payment disbursement tracking, and liability schedules
                        </p>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Outstanding Payables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-500">AED {totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">{unpaidCount} unpaid/partial vendor invoice{unpaidCount !== 1 ? 's' : ''}</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Invoiced</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">AED {totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Across all registered vendor claims</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Disbursed / Paid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">AED {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Verified bank transfers & payments</p>
                    </CardContent>
                </Card>
            </div>

            {/* Split Action: Log Invoice & Record Payment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Log Invoice Form */}
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Plus className="w-4 h-4 text-violet-500" />
                            Log Supplier Invoice
                        </CardTitle>
                        <CardDescription>Enter a new bill received from an authorized vendor</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createSupplierInvoice} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Supplier / Vendor</label>
                                <select 
                                    name="supplierId" 
                                    required 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="">Select vendor...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Vendor Invoice #</label>
                                    <input 
                                        name="invoiceNumber" 
                                        required 
                                        placeholder="INV-2026-9041" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Total Amount (AED)</label>
                                    <input 
                                        name="totalAmount" 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        placeholder="4800.00" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Due Date</label>
                                <input 
                                    name="dueDate" 
                                    type="date" 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>

                            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white size-sm mt-2">
                                Register Vendor Invoice
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Record Payment Form */}
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-500" />
                            Record Invoice Payment
                        </CardTitle>
                        <CardDescription>Register a bank transfer or cheque clearance against a bill</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={recordInvoicePayment} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Pending Invoice</label>
                                <select 
                                    name="invoiceId" 
                                    required 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="">Select invoice to pay...</option>
                                    {invoices.filter(i => i.status !== "PAID").map(inv => {
                                        const due = Number(inv.totalAmount) - Number(inv.paidAmount);
                                        return (
                                            <option key={inv.id} value={inv.id}>
                                                {inv.invoiceNumber} - {inv.supplier?.name} (Due: AED {due.toFixed(2)})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Amount (AED)</label>
                                    <input 
                                        name="paymentAmount" 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        placeholder="2400.00" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Method</label>
                                    <select 
                                        name="paymentMethod" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="BANK_TRANSFER">Corporate Bank Transfer (FT)</option>
                                        <option value="CHEQUE">Corporate Cheque</option>
                                        <option value="CREDIT_CARD">Corporate Card</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Reference / Transaction ID</label>
                                <input 
                                    name="paymentReference" 
                                    placeholder="e.g. ENBD-FT-893019" 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>

                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white size-sm mt-2">
                                Clear Payment & Update Ledger
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Invoices Ledger Table */}
            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Vendor Invoices Ledger</CardTitle>
                    <CardDescription>Complete payment status and liability schedule</CardDescription>
                </CardHeader>
                <CardContent>
                    {invoices.length === 0 ? (
                        <div className="text-center py-10 text-sm text-muted-foreground border border-dashed rounded-lg">
                            No supplier invoices logged yet.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Invoice #</TableHead>
                                    <TableHead className="text-xs">Supplier</TableHead>
                                    <TableHead className="text-xs">Due Date</TableHead>
                                    <TableHead className="text-xs text-right">Invoice Amount</TableHead>
                                    <TableHead className="text-xs text-right">Paid</TableHead>
                                    <TableHead className="text-xs text-right">Balance Due</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((inv) => {
                                    const balance = Number(inv.totalAmount) - Number(inv.paidAmount);
                                    const isOverdue = new Date(inv.dueDate) < new Date() && inv.status !== "PAID";

                                    return (
                                        <TableRow key={inv.id}>
                                            <TableCell className="text-xs font-mono font-medium">{inv.invoiceNumber}</TableCell>
                                            <TableCell className="text-xs font-semibold">{inv.supplier?.name}</TableCell>
                                            <TableCell className={`text-xs ${isOverdue ? 'text-rose-500 font-semibold' : 'text-muted-foreground'}`}>
                                                {new Date(inv.dueDate).toLocaleDateString()}
                                                {isOverdue && <span className="ml-1 text-[10px]">(Overdue)</span>}
                                            </TableCell>
                                            <TableCell className="text-xs text-right font-medium">AED {Number(inv.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-xs text-right text-emerald-500 font-medium">AED {Number(inv.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-xs text-right font-bold text-rose-500">AED {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell>
                                                <Badge className={`text-[10px] ${
                                                    inv.status === "PAID" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                                                    inv.status === "PARTIALLY_PAID" ? "bg-amber-500/10 text-amber-500 border-amber-500/30" :
                                                    "bg-rose-500/10 text-rose-500 border-rose-500/30"
                                                }`}>
                                                    {inv.status}
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
        </div>
    );
}
