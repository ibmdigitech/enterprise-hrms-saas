"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// ─── HELPER: AUTH CHECK ─────────────────────────────────────────────────────────
async function getAuthContext() {
    const session = await auth();
    if (!session || !session.user?.email) {
        throw new Error("Unauthorized: Authentication required");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { employee: true },
    });

    if (!user) {
        throw new Error("User record not found");
    }

    return { user, session };
}

// ─── BUDGET ACTIONS ─────────────────────────────────────────────────────────────
export async function createBudget(formData: FormData) {
    try {
        const { user } = await getAuthContext();
        const fiscalYear = parseInt(formData.get("fiscalYear") as string) || new Date().getFullYear();
        const name = formData.get("name") as string;
        const departmentId = (formData.get("departmentId") as string) || null;
        const costCentreId = (formData.get("costCentreId") as string) || null;
        const allocatedAmount = parseFloat(formData.get("allocatedAmount") as string) || 0;

        if (!name || allocatedAmount <= 0) {
            return;
        }

        await prisma.budget.create({
            data: {
                fiscalYear,
                name,
                departmentId,
                costCentreId,
                totalAmount: allocatedAmount,
                allocatedAmount,
                committedAmount: 0,
                actualSpent: 0,
                status: "APPROVED",
                approvedBy: user.id,
                approvedAt: new Date(),
            },
        });

        revalidatePath("/finance");
        revalidatePath("/finance/budget");
    } catch (error: any) {
        console.error("createBudget error:", error);
    }
}

export async function createBudgetRevision(formData: FormData) {
    try {
        const { user } = await getAuthContext();
        const budgetId = formData.get("budgetId") as string;
        const newAmount = parseFloat(formData.get("newAmount") as string);
        const reason = formData.get("reason") as string;

        if (!budgetId || isNaN(newAmount) || !reason) {
            return;
        }

        const currentBudget = await prisma.budget.findUnique({ where: { id: budgetId } });
        if (!currentBudget) return;

        await prisma.budgetRevision.create({
            data: {
                budgetId,
                previousAmount: currentBudget.allocatedAmount,
                newAmount,
                reason,
                requestedBy: user.id,
                status: "PENDING",
            },
        });

        revalidatePath("/finance/budget");
    } catch (error: any) {
        console.error("createBudgetRevision error:", error);
    }
}

export async function approveBudgetRevision(revisionId: string, approve: boolean, notes?: string) {
    try {
        const { user } = await getAuthContext();
        const revision = await prisma.budgetRevision.findUnique({
            where: { id: revisionId },
            include: { budget: true },
        });

        if (!revision) return;

        if (!approve) {
            await prisma.budgetRevision.update({
                where: { id: revisionId },
                data: {
                    status: "REJECTED",
                    approvedBy: user.id,
                },
            });
            revalidatePath("/finance/budget");
            return;
        }

        await prisma.$transaction([
            prisma.budgetRevision.update({
                where: { id: revisionId },
                data: {
                    status: "APPROVED",
                    approvedBy: user.id,
                },
            }),
            prisma.budget.update({
                where: { id: revision.budgetId },
                data: {
                    allocatedAmount: revision.newAmount,
                    totalAmount: revision.newAmount,
                },
            }),
        ]);

        revalidatePath("/finance");
        revalidatePath("/finance/budget");
    } catch (error: any) {
        console.error("approveBudgetRevision error:", error);
    }
}

// ─── PETTY CASH ACTIONS ─────────────────────────────────────────────────────────
export async function createPettyCashFund(formData: FormData) {
    try {
        const { user } = await getAuthContext();
        const name = formData.get("name") as string;
        const openingBalance = parseFloat(formData.get("openingFloat") as string) || 0;
        const custodianId = (formData.get("custodianId") as string) || user.employee?.id || null;
        const currency = (formData.get("currency") as string) || "AED";

        if (!name || openingBalance <= 0) {
            return;
        }

        await prisma.pettyCashFund.create({
            data: {
                name,
                openingBalance,
                currentBalance: openingBalance,
                custodianId,
                currency,
                isActive: true,
            },
        });

        revalidatePath("/finance");
        revalidatePath("/finance/petty-cash");
    } catch (error: any) {
        console.error("createPettyCashFund error:", error);
    }
}

export async function recordPettyCashTransaction(formData: FormData) {
    try {
        const { user } = await getAuthContext();
        const fundId = formData.get("fundId") as string;
        const amount = parseFloat(formData.get("amount") as string) || 0;
        const category = (formData.get("expenseCategory") as string) || "OFFICE_SUPPLIES";
        const description = formData.get("description") as string;
        const paidTo = (formData.get("paidTo") as string) || "Vendor";

        if (!fundId || amount <= 0 || !description) {
            return;
        }

        const fund = await prisma.pettyCashFund.findUnique({ where: { id: fundId } });
        if (!fund) return;

        if (Number(fund.currentBalance) < amount) {
            return;
        }

        await prisma.$transaction([
            prisma.pettyCashTransaction.create({
                data: {
                    fundId,
                    description: `${description} (${paidTo})`,
                    category,
                    amount,
                    transactionType: "PAYMENT",
                    status: "APPROVED",
                    approvedBy: user.id,
                    approvedAt: new Date(),
                },
            }),
            prisma.pettyCashFund.update({
                where: { id: fundId },
                data: {
                    currentBalance: Number(fund.currentBalance) - amount,
                },
            }),
        ]);

        revalidatePath("/finance");
        revalidatePath("/finance/petty-cash");
    } catch (error: any) {
        console.error("recordPettyCashTransaction error:", error);
    }
}

export async function requestReplenishment(formData: FormData) {
    try {
        const { user } = await getAuthContext();
        const fundId = formData.get("fundId") as string;
        const requestedAmount = parseFloat(formData.get("requestedAmount") as string) || 0;

        if (!fundId || requestedAmount <= 0) {
            return;
        }

        await prisma.pettyCashReplenishment.create({
            data: {
                fundId,
                requestedAmount,
                requestedBy: user.id,
                status: "PENDING",
            },
        });

        revalidatePath("/finance/petty-cash");
    } catch (error: any) {
        console.error("requestReplenishment error:", error);
    }
}

export async function approveReplenishment(replenishmentId: string, approve: boolean) {
    try {
        const { user } = await getAuthContext();
        const item = await prisma.pettyCashReplenishment.findUnique({
            where: { id: replenishmentId },
            include: { fund: true },
        });

        if (!item) return;

        if (!approve) {
            await prisma.pettyCashReplenishment.update({
                where: { id: replenishmentId },
                data: {
                    status: "REJECTED",
                    approvedBy: user.id,
                },
            });
            revalidatePath("/finance/petty-cash");
            return;
        }

        await prisma.$transaction([
            prisma.pettyCashReplenishment.update({
                where: { id: replenishmentId },
                data: {
                    status: "PAID",
                    approvedAmount: item.requestedAmount,
                    approvedBy: user.id,
                },
            }),
            prisma.pettyCashFund.update({
                where: { id: item.fundId },
                data: {
                    currentBalance: Number(item.fund.currentBalance) + Number(item.requestedAmount),
                },
            }),
            prisma.pettyCashTransaction.create({
                data: {
                    fundId: item.fundId,
                    description: `Float replenishment approved`,
                    category: "REPLENISHMENT",
                    amount: item.requestedAmount,
                    transactionType: "RECEIPT",
                    status: "APPROVED",
                    approvedBy: user.id,
                    approvedAt: new Date(),
                },
            }),
        ]);

        revalidatePath("/finance");
        revalidatePath("/finance/petty-cash");
    } catch (error: any) {
        console.error("approveReplenishment error:", error);
    }
}

// ─── REIMBURSEMENT / EXPENSE ACTIONS ────────────────────────────────────────────
export async function approveReimbursement(id: string) {
    try {
        await getAuthContext();
        await prisma.reimbursementRequest.update({
            where: { id },
            data: { status: "APPROVED" },
        });

        revalidatePath("/finance");
        revalidatePath("/finance/expenses");
        revalidatePath("/payroll");
    } catch (error: any) {
        console.error("approveReimbursement error:", error);
    }
}

export async function rejectReimbursement(id: string, reason?: string) {
    try {
        await getAuthContext();
        await prisma.reimbursementRequest.update({
            where: { id },
            data: { status: "REJECTED" },
        });

        revalidatePath("/finance");
        revalidatePath("/finance/expenses");
    } catch (error: any) {
        console.error("rejectReimbursement error:", error);
    }
}

// ─── PROCUREMENT / SUPPLIER ACTIONS ─────────────────────────────────────────────
export async function createSupplier(formData: FormData) {
    try {
        await getAuthContext();
        const name = formData.get("name") as string;
        const contactPerson = (formData.get("contactPerson") as string) || null;
        const email = (formData.get("email") as string) || null;
        const phone = (formData.get("phone") as string) || null;
        const paymentTerms = (formData.get("paymentTerms") as string) || "NET_30";
        const taxRegistration = (formData.get("taxNumber") as string) || null;

        if (!name) return;

        await prisma.supplier.create({
            data: {
                name,
                contactPerson,
                email,
                phone,
                paymentTerms,
                taxRegistration,
                isActive: true,
            },
        });

        revalidatePath("/finance/procurement");
    } catch (error: any) {
        console.error("createSupplier error:", error);
    }
}

export async function createPurchaseOrder(formData: FormData) {
    try {
        const { user } = await getAuthContext();
        const supplierId = formData.get("supplierId") as string;
        const totalAmount = parseFloat(formData.get("totalAmount") as string) || 0;
        const termsConditions = (formData.get("termsConditions") as string) || "Standard purchase agreement";
        const orderNumber = `PO-${Date.now().toString().slice(-6)}`;

        if (!supplierId || totalAmount <= 0) {
            return;
        }

        await prisma.purchaseOrder.create({
            data: {
                orderNumber,
                title: `Procurement Order ${orderNumber}`,
                supplierId,
                totalAmount,
                status: "CONFIRMED",
                notes: termsConditions,
                approvedBy: user.id,
                approvedAt: new Date(),
            },
        });

        revalidatePath("/finance");
        revalidatePath("/finance/procurement");
    } catch (error: any) {
        console.error("createPurchaseOrder error:", error);
    }
}

// ─── INVENTORY / OFFICE SUPPLIES ACTIONS ────────────────────────────────────────
export async function createInventoryItem(formData: FormData) {
    try {
        await getAuthContext();
        const name = formData.get("name") as string;
        const sku = (formData.get("itemCode") as string) || `ITM-${Date.now().toString().slice(-5)}`;
        const category = (formData.get("category") as string) || "STATIONERY";
        const unitOfMeasure = (formData.get("unitOfMeasure") as string) || "PIECE";
        const currentStock = parseInt(formData.get("currentStockQuantity") as string) || 0;
        const minimumStock = parseInt(formData.get("minimumStockLevel") as string) || 10;
        const unitCost = parseFloat(formData.get("averageCostPrice") as string) || 0;

        if (!name) return;

        await prisma.inventoryItem.create({
            data: {
                name,
                sku,
                category,
                unitOfMeasure,
                currentStock,
                minimumStock,
                unitCost,
                isActive: true,
            },
        });

        revalidatePath("/finance/inventory");
    } catch (error: any) {
        console.error("createInventoryItem error:", error);
    }
}

// ─── ACCOUNTS PAYABLE / INVOICE ACTIONS ──────────────────────────────────────────
export async function createSupplierInvoice(formData: FormData) {
    try {
        await getAuthContext();
        const supplierId = formData.get("supplierId") as string;
        const invoiceNumber = formData.get("invoiceNumber") as string;
        const totalAmount = parseFloat(formData.get("totalAmount") as string) || 0;
        const dueDateStr = formData.get("dueDate") as string;
        const dueDate = dueDateStr ? new Date(dueDateStr) : new Date(Date.now() + 30 * 24 * 3600 * 1000);
        const purchaseOrderId = (formData.get("poId") as string) || null;

        if (!supplierId || !invoiceNumber || totalAmount <= 0) {
            return;
        }

        await prisma.supplierInvoice.create({
            data: {
                supplierId,
                invoiceNumber,
                invoiceDate: new Date(),
                totalAmount,
                amount: totalAmount,
                paidAmount: 0,
                dueDate,
                status: "RECEIVED",
                purchaseOrderId,
            },
        });

        revalidatePath("/finance");
        revalidatePath("/finance/accounts-payable");
    } catch (error: any) {
        console.error("createSupplierInvoice error:", error);
    }
}

export async function recordInvoicePayment(formData: FormData) {
    try {
        await getAuthContext();
        const invoiceId = formData.get("invoiceId") as string;
        const paymentAmount = parseFloat(formData.get("paymentAmount") as string) || 0;

        if (!invoiceId || paymentAmount <= 0) {
            return;
        }

        const invoice = await prisma.supplierInvoice.findUnique({ where: { id: invoiceId } });
        if (!invoice) return;

        const newPaidAmount = Number(invoice.paidAmount) + paymentAmount;
        const isFullyPaid = newPaidAmount >= Number(invoice.totalAmount);

        await prisma.supplierInvoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: newPaidAmount,
                status: isFullyPaid ? "PAID" : "VERIFIED",
                paidAt: new Date(),
            },
        });

        revalidatePath("/finance");
        revalidatePath("/finance/accounts-payable");
    } catch (error: any) {
        console.error("recordInvoicePayment error:", error);
    }
}
