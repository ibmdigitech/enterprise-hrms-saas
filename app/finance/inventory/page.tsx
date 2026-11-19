import Link from "next/link";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    Boxes, 
    Plus, 
    ArrowLeft, 
    AlertTriangle, 
    Layers, 
    CheckCircle2, 
    PackageCheck, 
    TrendingDown,
    Archive
} from "lucide-react";
import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/page-guard";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { createInventoryItem } from "@/app/lib/actions/finance";

export default async function InventoryPage() {
    await requirePagePermission(PERMISSIONS.INVENTORY_VIEW);

    const session = await auth();
    if (!session) redirect("/login");

    let items: any[] = [];
    try {
        items = await prisma.inventoryItem.findMany({
            orderBy: { name: "asc" },
        });
    } catch (e) {
        console.error("Error fetching inventory data:", e);
    }

    const totalStockItems = items.reduce((sum, item) => sum + (item.currentStock ?? 0), 0);
    const totalInventoryValue = items.reduce((sum, item) => sum + ((item.currentStock ?? 0) * Number(item.unitCost ?? 0)), 0);
    const lowStockItems = items.filter(item => (item.currentStock ?? 0) <= (item.minimumStock ?? 5));

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
                            <Boxes className="w-6 h-6 text-teal-500" />
                            Office Supplies & Inventory Management
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Stock on hand, automated reorder thresholds, inventory valuation, and departmental supply logistics
                        </p>
                    </div>
                </div>
            </div>

            {/* Low stock warning */}
            {lowStockItems.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        <div>
                            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                                Low Stock Alert ({lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''})
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                                {lowStockItems.map(i => `${i.name} (${i.currentStockQuantity} ${i.unitOfMeasure})`).join(", ")} reached reorder point.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Inventory Valuation</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-teal-500">AED {totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Based on weighted average cost</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Stock Quantity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{totalStockItems.toLocaleString()} units</div>
                        <p className="text-[11px] text-muted-foreground mt-1">Across {items.length} registered SKUs</p>
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Reorder Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {lowStockItems.length}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">Items at or below safety threshold</p>
                    </CardContent>
                </Card>
            </div>

            {/* Add New Item Form */}
            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Plus className="w-4 h-4 text-teal-500" />
                        Register Supply or Inventory Item
                    </CardTitle>
                    <CardDescription>Add office supplies, consumables, or physical company assets</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={createInventoryItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Item Name</label>
                            <input 
                                name="name" 
                                required 
                                placeholder="e.g. A4 Copy Paper Box" 
                                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                            <select 
                                name="category" 
                                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="STATIONERY">Stationery & Paper</option>
                                <option value="IT_EQUIPMENT">IT Peripherals / Cables</option>
                                <option value="PANTRY">Pantry & Refreshments</option>
                                <option value="CLEANING">Cleaning & Sanitization</option>
                                <option value="UNIFORMS">Uniforms & PPE</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Initial Stock & Unit</label>
                            <div className="flex gap-2">
                                <input 
                                    name="currentStockQuantity" 
                                    type="number" 
                                    required 
                                    placeholder="50" 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                <select 
                                    name="unitOfMeasure" 
                                    className="w-24 h-9 px-2 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="BOX">Box</option>
                                    <option value="PIECE">Piece</option>
                                    <option value="PACK">Pack</option>
                                    <option value="REAM">Ream</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Unit Cost (AED)</label>
                            <div className="flex gap-2">
                                <input 
                                    name="averageCostPrice" 
                                    type="number" 
                                    step="0.01" 
                                    required 
                                    placeholder="85.00" 
                                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                                <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-500 text-white shrink-0">
                                    Register
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Inventory Items Catalog */}
            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Inventory Catalog & Stock Status</CardTitle>
                    <CardDescription>Real-time physical stock counts and storage allocations</CardDescription>
                </CardHeader>
                <CardContent>
                    {items.length === 0 ? (
                        <div className="text-center py-10 text-sm text-muted-foreground border border-dashed rounded-lg">
                            No inventory items cataloged yet. Register your first item above.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">SKU Code</TableHead>
                                    <TableHead className="text-xs">Item Name</TableHead>
                                    <TableHead className="text-xs">Category</TableHead>
                                    <TableHead className="text-xs text-center">Stock Level</TableHead>
                                    <TableHead className="text-xs text-right">Avg Cost</TableHead>
                                    <TableHead className="text-xs text-right">Asset Value</TableHead>
                                    <TableHead className="text-xs">Storage Location</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => {
                                    const isLow = (item.currentStock ?? 0) <= (item.minimumStock ?? 5);
                                    const value = (item.currentStock ?? 0) * Number(item.unitCost ?? 0);

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs font-mono font-medium">{item.sku}</TableCell>
                                            <TableCell className="text-xs font-semibold">{item.name}</TableCell>
                                            <TableCell className="text-xs">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {item.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-center">
                                                <span className={`font-bold ${isLow ? 'text-rose-500' : 'text-foreground'}`}>
                                                    {item.currentStock ?? 0} {item.unitOfMeasure}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-right text-muted-foreground">
                                                AED {Number(item.unitCost ?? 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-xs text-right font-bold text-teal-500">
                                                AED {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">Main Store</TableCell>
                                            <TableCell>
                                                <Badge className={`text-[10px] ${
                                                    isLow ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                                }`}>
                                                    {isLow ? 'Reorder Required' : 'Adequate'}
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
