# HRMS API and Route Inventory

## 1. REST / HTTP API Endpoints (`app/api/`)

| Method | Endpoint | Purpose | Access Control |
|---|---|---|---|
| `POST` | `/api/auth/[...nextauth]` | NextAuth authentication & session callback | Public |
| `POST` | `/api/ai/chat` | AI conversational streaming endpoint | Authenticated |
| `GET` | `/api/attendance/download` | Export biometric attendance logs | `attendance.view` |
| `POST` | `/api/attendance/import` | Bulk attendance upload | `attendance.mark` |
| `POST` | `/api/attendance/device-import` | Biometric hardware log ingestion | Device API Key |
| `GET` | `/api/company/documents/[id]/file` | Stream corporate documents | `settings.view` |
| `POST` | `/api/compliance/scan` | UAE visa and ID expiration audit run | `visa.view` |
| `GET`, `POST` | `/api/configs` | System configuration service | Admin |
| `GET` | `/api/cron/health` | Automated system health check | Cron Secret |
| `GET` | `/api/cron/invoice-notifications` | Subscription overdue warnings | Cron Secret |
| `GET` | `/api/cron/maintenance` | System maintenance & token expiry sweep | Cron Secret |
| `GET`, `POST` | `/api/employees` | Employee master list & create | `employees.view` / `employees.create` |
| `GET`, `PATCH`, `DELETE` | `/api/employees/[id]` | Employee record retrieval & update | `employees.view` + Scope IDOR check |
| `POST` | `/api/employees/upload` | Bulk CSV employee import | `employees.create` |
| `GET` | `/api/exits/[id]/resignation-letter` | Download resignation letter artifact | `resignation.create` |
| `GET` | `/api/health` | Public service uptime indicator | Public |
| `GET` | `/api/leaves/balance` | Retrieve active leave balance quotas | `leave.view` |
| `POST` | `/api/leaves/update` | Adjust or deduct leave balances | `leave.approve` |
| `GET`, `POST` | `/api/letters` | Letter archive & letter creation | `letter.view` / `letter.generate` |
| `POST` | `/api/letters/[id]/approve` | Letter approval route | `letter.approve` |
| `GET` | `/api/payroll/export` | Export payroll WPS SIF file or CSV | `payroll.export` |
| `GET` | `/api/pdf/payslip` | Generate & download payslip PDF | Authenticated Self / Admin |
| `GET` | `/api/pdf/certificate` | Generate training certificate PDF | `training.view` |
| `GET` | `/api/pdf/promotion` | Generate promotion letter PDF | `employee.promotion.view` |
| `GET` | `/api/recruitment/candidates/[id]/resume` | Retrieve candidate CV file | `recruitment.view` |
| `GET` | `/api/search` | Global omnibox search | Authenticated |
| `GET`, `POST` | `/api/super-admin/companies` | Platform tenant provisioning | Super Admin |
| `GET`, `POST` | `/api/super-admin/role-requests` | Role elevation review | Super Admin |
| `GET` | `/api/training/verify/[code]` | Public QR certificate validation | Public |

---

## 2. Server Action Modules (`app/lib/actions/` & `app/super-admin/`)

| Action Module | Key Functions | Role & Guard |
|---|---|---|
| `app/lib/actions/employees.ts` | `createEmployee`, `updateEmployee`, `archiveEmployee` | `requirePermission(PERMISSIONS.EMPLOYEES_MANAGE)` |
| `app/lib/actions/payroll.ts` | `generatePayrollRun`, `lockPayroll`, `settlePayroll` | `requirePermission(PERMISSIONS.PAYROLL_GENERATE)` |
| `app/lib/actions/letter-requests.ts` | `submitLetterRequestAction`, `managerDecisionAction`, `hrDecisionAction` | Multi-tier (`STAFF`, `MANAGER`, `HR`) |
| `app/lib/actions/tenant-tickets.ts` | `submitTenantTicketAction`, `replyTenantTicketAction`, `getTenantTicketsAction` | `requirePermission(PERMISSIONS.SUPPORT_TICKETS_VIEW)` |
| `app/lib/actions/company-settings.ts` | `getCompanySettings`, `updateCompanySettings` | Admin / HR |
| `app/super-admin/companies-actions.ts` | `getTenantsAction`, `createTenantAction`, `updateTenantStatusAction` | `requireSuperAdmin("platform.companies.manage")` |
| `app/super-admin/modules-actions.ts` | `getModulesAction`, `toggleCompanyModuleAction` | `requireSuperAdmin("platform.modules.manage")` |
| `app/super-admin/tickets-actions.ts` | `getTicketsAction`, `getTicketDetailAction`, `updateTicketStatusAction` | `requireSuperAdmin("platform.tickets.manage")` |
| `app/super-admin/plans-actions.ts` | `getPlansAction`, `createPlanAction`, `updatePlanAction` | `requireSuperAdmin("platform.plans.manage")` |

