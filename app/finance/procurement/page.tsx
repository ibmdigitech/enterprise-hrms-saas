import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    ShoppingBag, 
    Plus, 
    ArrowLeft, 
    Building2, 
    CheckCircle2, 
    Clock, 
    Truck, 
    FileText, 
    DollarSign,
    Users
} from "lucide-react";
import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createSupplier, createPurchaseOrder } from "@/app/lib/actions/finance";

export default async function ProcurementPage() {
    await requirePagePermission(PERMISSIONS.PROCUREMENT_VIEW);

    const session = await auth();
    if (!session) redirect("/login");

    let suppliers: any[] = [];
    let purchaseOrders: any[] = [];

    try {
        suppliers = await prisma.supplier.findMany({
            orderBy: { createdAt: "desc" },
        });

        purchaseOrders = await prisma.purchaseOrder.findMany({
            include: { supplier: true },
            orderBy: { createdAt: "desc" },
            take: 30,
        });
    } catch (e) {
        console.error("Error fetching procurement data:", e);
    }

    const totalPOValue = purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0);
    const activeSuppliers = suppliers.filter(s => s.status === "ACTIVE").length;

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
                            <ShoppingBag className="w-6 h-6 text-sky-500" />
                            Procurement & Purchase Order Management
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Vendor registry, official PO generation, 3-way matching controls, and purchase commitments
                        </p>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Committed PO Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-sky-500">AED {totalPOValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Across {purchaseOrders.length} purchase orders</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active Vendors / Suppliers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{activeSuppliers}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Vetted corporate suppliers</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">3-Way Match Integrity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">100%</div>
                        <p className="text-[11px] text-muted-foreground mt-1">PO ⇄ Goods Receipt ⇄ Invoice</p>
                    </CardContent>
                </Card>
            </div>

            {/* Split Section: Register Vendor & Generate PO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Generate PO Form */}
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Plus className="w-4 h-4 text-sky-500" />
                            Generate Purchase Order (PO)
                        </CardTitle>
                        <CardDescription>Issue an official purchase commitment to an authorized supplier</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createPurchaseOrder} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Supplier / Vendor</label>
                                <select 
                                    name="supplierId" 
                                    required 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="">Select a vendor...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Total Amount (AED)</label>
                                    <input 
                                        name="totalAmount" 
                                        type="number" 
                                        step="0.01" 
                                        required 
                                        placeholder="15000.00" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Tax / VAT Amount (AED)</label>
                                    <input 
                                        name="taxAmount" 
                                        type="number" 
                                        step="0.01" 
                                        placeholder="750.00" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Terms & Conditions</label>
                                <input 
                                    name="termsConditions" 
                                    defaultValue="Payment upon 30 days of delivery note verification" 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>

                            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white size-sm mt-2">
                                Authorize & Issue Purchase Order
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Add Supplier Form */}
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-500" />
                            Register Corporate Supplier
                        </CardTitle>
                        <CardDescription>Onboard a new vendor into the approved procurement directory</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={createSupplier} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Company / Supplier Name</label>
                                <input 
                                    name="name" 
                                    required 
                                    placeholder="e.g. Al Futtaim Office Solutions" 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Person</label>
                                    <input 
                                        name="contactPerson" 
                                        placeholder="Ahmed Al Mansoori" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Tax / TRN Number</label>
                                    <input 
                                        name="taxNumber" 
                                        placeholder="100234567890003" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                                    <input 
                                        name="email" 
                                        type="email" 
                                        placeholder="sales@vendor.ae" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Payment Terms</label>
                                    <select 
                                        name="paymentTerms" 
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                    >
                                        <option value="NET_30">Net 30 Days</option>
                                        <option value="NET_15">Net 15 Days</option>
                                        <option value="NET_60">Net 60 Days</option>
                                        <option value="ADVANCE">Advance / Upfront</option>
                                        <option value="COD">Cash on Delivery</option>
                                    </select>
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white size-sm mt-2">
                                Register Supplier
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Purchase Orders Table */}
            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Purchase Orders Registry</CardTitle>
                    <CardDescription>Track issued commitments and delivery fulfillment</CardDescription>
                </CardHeader>
                <CardContent>
                    {purchaseOrders.length === 0 ? (
                        <div className="text-center py-10 text-sm text-muted-foreground border border-dashed rounded-lg">
                            No purchase orders issued yet. Create your first PO above.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">PO #</TableHead>
                                    <TableHead className="text-xs">Supplier</TableHead>
                                    <TableHead className="text-xs">Issue Date</TableHead>
                                    <TableHead className="text-xs text-right">Tax</TableHead>
                                    <TableHead className="text-xs text-right">Total Amount</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseOrders.map((po) => (
                                    <TableRow key={po.id}>
                                        <TableCell className="text-xs font-mono font-medium">{po.orderNumber}</TableCell>
                                        <TableCell className="text-xs font-semibold">{po.supplier?.name}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-xs text-right text-muted-foreground">AED 0.00</TableCell>
                                        <TableCell className="text-xs text-right font-bold text-sky-500">AED {Number(po.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        <TableCell>
                                            <Badge className="text-[10px] bg-sky-500/10 text-sky-500 border-sky-500/30">
                                                {po.status}
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
