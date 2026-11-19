# MultiSaaS HRMS – Finance, Payroll, Petty Cash, Expenses, Procurement and Office Administration
## Comprehensive Structure & Implementation Audit

**Audit Date**: November 18, 2026  
**Repository**: `C:\Users\lenovo\Desktop\mutisass_hrms\saas-repo`  
**Application Stack**: Next.js 16 (App Router), NextAuth v5, Prisma ORM 6.19, PostgreSQL (Docker port 5434), Tailwind CSS  
**Tenant Architecture**: Multi-Tenant with Tenant & Company scopes (`tenantId`, `companyId`, `departmentId`)

---

## 1. Executive Summary & Component Matrix

| Module / Capability | Status | Existing Location | Analysis & Audit Finding |
|---|:---:|---|---|
| **Payroll Processing Engine** | ✅ COMPLETE | `app/lib/actions/payroll.ts`, `app/payroll/` | Central `generatePayroll(month, year)` creates/updates `SalaryRecord` instances for all active employees. Calculates basic, housing, transport, medical, food, travel allowance, commission, late penalties (Attendance), unpaid leaves, approved overtime, loan installments, advance recoveries, and newly added travel reimbursements and expense claims. |
| **Salary Structure Master** | ✅ COMPLETE | `app/payroll/structure/`, `model SalaryStructure` | Contractual compensation components (CTC, basic, housing, transport, medical, food, travel allowance, commission, other allowances, payment method). Upsert action with audit log. |
| **Overtime Tracking & Approval** | 🔶 PARTIAL | `app/payroll/overtime/`, `components/payroll/NewOvertimeForm.tsx`, `model Overtime` | Model contains `hours`, `ratePerHour`, `totalPay`, `status` (`PENDING`, `APPROVED`, `PAID`, `REJECTED`). Form logs overtime directly; auto-approval needs manager/finance approval workflow step. |
| **Employee Loans & Advances** | ✅ COMPLETE | `app/payroll/loans/`, `model LoanApplication`, `model LoanInstallment`, `model SalaryAdvanceRequest` | Full lifecycle present: Application, approval, disbursement schedule, monthly installment deduction during payroll, and status transition to `DEDUCTED`. |
| **Expense & Reimbursement Claims** | 🔶 PARTIAL | `model ReimbursementRequest`, `app/staff-services/` | Model has `category` (Fuel, Travel, Mobile, Accommodation, Medical, Misc), `amount`, `details`, `status`. Now wired into `generatePayroll` as `reimbursementTotal`. Dedicated submission UI and finance verification queue needed. |
| **Travel & Business Trips** | 🔶 PARTIAL | `app/travel/`, `components/travel/TravelReimbursementForm.tsx`, `model BusinessTravelRequest` | Comprehensive travel request & document upload (boarding pass, receipts, tickets). Linked into travel allowance request and advance settlements. |
| **Petty Cash Management** | ❌ MISSING | Conceptual | No database models or UI currently in place. Requires `PettyCashFund`, `PettyCashTransaction`, `PettyCashReplenishment`, custodian workflows, receipt attachments, balance tracking, and reconciliation. |
| **Budget & Cost Centre Management** | ❌ MISSING | Conceptual | No formal cost centre or company/department budget models. Requires `CostCentre`, `Budget`, `BudgetRevision`, `BudgetAlert`, commitment vs. actual expenditure tracking, and variance reporting. |
| **Procurement & Purchase Orders** | ❌ MISSING | Conceptual | Requires `Supplier`, `PurchaseRequisition`, `PurchaseOrder`, `GoodsReceipt`, `SupplierInvoice`, with multi-level approval hierarchies. |
| **Office Supplies & Inventory** | ❌ MISSING | Conceptual | Asset tracking exists (`model Asset`), but office consumable inventory (SKUs, minimum stock, stock movements, department supply requests) is missing. |
| **Accounts Payable & Invoices** | ❌ MISSING | Conceptual | Missing supplier invoice verification, 3-way matching (PO, Goods Receipt, Invoice), payment approval, and AP aging. |
| **Financial Approval & Permissions** | 🔶 PARTIAL | `lib/auth/permissions.ts` | Role catalog includes `FINANCE` and `ADMIN`, but fine-grained capabilities (`BUDGET_MANAGE`, `PETTY_CASH_APPROVE`, `PURCHASE_APPROVE`, `INVENTORY_MANAGE`) need explicit declaration in the RBAC matrix. |
| **Finance Executive Dashboard** | ❌ MISSING | Conceptual | Missing unified finance cockpit showing consolidated budget utilization, cash float, outstanding payables, pending reimbursements, and operational expenditure trends. |

---

## 2. Detailed Technical Audit by Functional Domain

### 2.1 Payroll, Allowances & Deductions
- **Engine File**: `app/lib/actions/payroll.ts`
- **Calculation Formula**:
  $$\text{Net Salary} = \text{Basic} + \sum \text{Allowances} + \text{OvertimePay} + \text{TravelReimbursement} + \text{ReimbursementTotal} + \text{Bonus} - \text{TotalDeductions}$$
- **Deductions Enforced**:
  - Unpaid leave day calculation based on daily basic rate ($\text{basic} / 30$).
  - Late attendance penalties computed against configurable thresholds.
  - Automatic deduction of pending `LoanInstallment` records for disbursed loans.
  - Recovery of approved `SalaryAdvanceRequest` amounts.
- **Duplicate Protection**:
  - Database constraint `@@unique([employeeId, year, month])` on `SalaryRecord` guarantees idempotent execution of monthly runs.
  - Payslip generation exports to PDF (`app/lib/utils/payslip-generator.ts`) with individual breakdown tables.

### 2.2 Department & Cost Centre Structure
- **Existing**: `model Department` has `tenantId`, `companyId`, `locationId`, hierarchical parent-child relationships, and employee foreign keys.
- **Gap**: Missing `CostCentre` entity to link departments, projects, and expenditure budgets.

### 2.3 Petty Cash Float & Disbursements
- **Gap**: No existing schema support. Needs fund entity tied to a specific company/tenant, managed by an assigned employee (custodian), recording cash float additions, approved voucher payouts with receipt attachments, and reconciliation cycles.

### 2.4 Procurement, Office Inventory & Supplies
- **Existing**: `model Asset` and `model AssetAssignment` track serialized capital assets (hardware, laptops, monitors) assigned to employees.
- **Gap**: Does not cover consumable items (office stationery, toner, pantry supplies, cleaning items) which require consumable inventory movement tracking (receipts, department disbursements, reorder alerts).

---

## 3. Architecture & Integration Plan

### 3.1 New Prisma Schema Entities
1. **Financial Dimensions**:
   - `CostCentre`
   - `Budget`
   - `BudgetRevision`
   - `BudgetAlert`
2. **Petty Cash**:
   - `PettyCashFund`
   - `PettyCashTransaction`
   - `PettyCashReplenishment`
3. **Procurement & Payables**:
   - `Supplier`
   - `PurchaseRequisition` & `PurchaseRequisitionItem`
   - `PurchaseOrder` & `PurchaseOrderItem`
   - `GoodsReceipt` & `GoodsReceiptItem`
   - `SupplierInvoice`
4. **Office Consumables & Stock**:
   - `InventoryItem`
   - `StockMovement`
   - `DepartmentSupplyRequest` & `DepartmentSupplyRequestItem`

### 3.2 Non-Destructive Principles
- All existing models, relations, and database tables remain 100% intact.
- Multi-tenant isolation is preserved via `tenantId` and `companyId` indexing on all new financial models.
- The UI adheres strictly to the existing design language (slate-950/indigo hero gradients, white/slate card containers, and active tabs).
