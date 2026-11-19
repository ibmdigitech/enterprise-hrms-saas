-- Create finance, budget, petty cash, procurement, inventory tables

CREATE TABLE IF NOT EXISTS "CostCentre" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT,
  "companyId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "departmentId" TEXT,
  "managerId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Budget" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT,
  "companyId" TEXT,
  "departmentId" TEXT,
  "costCentreId" TEXT REFERENCES "CostCentre"("id") ON DELETE SET NULL,
  "name" TEXT NOT NULL,
  "fiscalYear" INTEGER NOT NULL,
  "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "allocatedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "committedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "actualSpent" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BudgetRevision" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "budgetId" TEXT NOT NULL REFERENCES "Budget"("id") ON DELETE CASCADE,
  "previousAmount" DECIMAL(14,2) NOT NULL,
  "newAmount" DECIMAL(14,2) NOT NULL,
  "reason" TEXT NOT NULL,
  "requestedBy" TEXT NOT NULL,
  "approvedBy" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "BudgetAlert" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "budgetId" TEXT NOT NULL REFERENCES "Budget"("id") ON DELETE CASCADE,
  "alertType" TEXT NOT NULL,
  "threshold" INTEGER NOT NULL DEFAULT 80,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sentAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PettyCashFund" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT,
  "companyId" TEXT,
  "name" TEXT NOT NULL,
  "custodianId" TEXT,
  "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "currentBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'AED',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PettyCashTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fundId" TEXT NOT NULL REFERENCES "PettyCashFund"("id") ON DELETE CASCADE,
  "employeeId" TEXT,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "transactionType" TEXT NOT NULL DEFAULT 'PAYMENT',
  "receiptUrl" TEXT,
  "supplierId" TEXT,
  "costCentreId" TEXT REFERENCES "CostCentre"("id") ON DELETE SET NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP,
  "postedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PettyCashReplenishment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fundId" TEXT NOT NULL REFERENCES "PettyCashFund"("id") ON DELETE CASCADE,
  "requestedAmount" DECIMAL(14,2) NOT NULL,
  "approvedAmount" DECIMAL(14,2),
  "requestedBy" TEXT NOT NULL,
  "approvedBy" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT,
  "companyId" TEXT,
  "name" TEXT NOT NULL,
  "contactPerson" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "taxRegistration" TEXT,
  "bankName" TEXT,
  "bankAccount" TEXT,
  "iban" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'AED',
  "paymentTerms" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PurchaseRequisition" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT,
  "companyId" TEXT,
  "departmentId" TEXT,
  "requestedBy" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "estimatedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "budgetId" TEXT REFERENCES "Budget"("id") ON DELETE SET NULL,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PurchaseRequisitionItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requisitionId" TEXT NOT NULL REFERENCES "PurchaseRequisition"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit" TEXT NOT NULL DEFAULT 'PCS',
  "estimatedUnitCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "category" TEXT NOT NULL DEFAULT 'GENERAL',
  "notes" TEXT
);

CREATE TABLE IF NOT EXISTS "PurchaseOrder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT,
  "companyId" TEXT,
  "requisitionId" TEXT REFERENCES "PurchaseRequisition"("id") ON DELETE SET NULL,
  "supplierId" TEXT NOT NULL REFERENCES "Supplier"("id"),
  "orderNumber" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'AED',
  "orderDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expectedDelivery" TIMESTAMP,
  "notes" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PurchaseOrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "purchaseOrderId" TEXT NOT NULL REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit" TEXT NOT NULL DEFAULT 'PCS',
  "unitCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "receivedQty" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "GoodsReceipt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "purchaseOrderId" TEXT NOT NULL REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE,
  "receivedBy" TEXT NOT NULL,
  "receivedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'COMPLETE',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "GoodsReceiptItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "goodsReceiptId" TEXT NOT NULL REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE,
  "purchaseOrderItemId" TEXT NOT NULL REFERENCES "PurchaseOrderItem"("id") ON DELETE CASCADE,
  "receivedQty" INTEGER NOT NULL DEFAULT 1,
  "condition" TEXT NOT NULL DEFAULT 'GOOD',
  "notes" TEXT
);

CREATE TABLE IF NOT EXISTS "SupplierInvoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT,
  "companyId" TEXT,
  "supplierId" TEXT NOT NULL REFERENCES "Supplier"("id"),
  "purchaseOrderId" TEXT REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL,
  "invoiceNumber" TEXT NOT NULL,
  "invoiceDate" TIMESTAMP NOT NULL,
  "dueDate" TIMESTAMP NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "vatAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'AED',
  "status" TEXT NOT NULL DEFAULT 'RECEIVED',
  "paidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "paidAt" TIMESTAMP,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "InventoryItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT,
  "companyId" TEXT,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "unitOfMeasure" TEXT NOT NULL DEFAULT 'PCS',
  "supplierId" TEXT REFERENCES "Supplier"("id") ON DELETE SET NULL,
  "unitCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "currentStock" INTEGER NOT NULL DEFAULT 0,
  "minimumStock" INTEGER NOT NULL DEFAULT 5,
  "reorderPoint" INTEGER NOT NULL DEFAULT 10,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StockMovement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "inventoryItemId" TEXT NOT NULL REFERENCES "InventoryItem"("id") ON DELETE CASCADE,
  "movementType" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitCost" DECIMAL(14,2),
  "referenceType" TEXT,
  "referenceId" TEXT,
  "departmentId" TEXT,
  "employeeId" TEXT,
  "notes" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "DepartmentSupplyRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT,
  "companyId" TEXT,
  "departmentId" TEXT,
  "requestedBy" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "DepartmentSupplyRequestItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestId" TEXT NOT NULL REFERENCES "DepartmentSupplyRequest"("id") ON DELETE CASCADE,
  "inventoryItemId" TEXT NOT NULL REFERENCES "InventoryItem"("id") ON DELETE CASCADE,
  "requestedQty" INTEGER NOT NULL DEFAULT 1,
  "issuedQty" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT
);
