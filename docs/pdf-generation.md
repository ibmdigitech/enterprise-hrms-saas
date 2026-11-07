# Enterprise PDF Generation Suite (Module 4: Operations)

## Overview

The Enterprise PDF Generation Suite generates high-fidelity, standardized corporate documents for:
1. **Training Completion Certificates** (A4 Landscape, double-bordered, authorized stamp & signature, verification code, score/grade).
2. **Promotion & Compensation Revision Letters** (A4 Portrait, corporate letterhead, structured terms, signature & stamp).
3. **Monthly Pay Slips** (A4 Portrait, itemized earnings & deductions, net pay highlight, official payroll authorization).

Generation is powered by `pdf-lib` (pure JavaScript, zero headless browser dependencies, fast and container/serverless-friendly).

---

## Architecture & Storage

- **Storage Location**: Defaults to `./public/generated/pdfs` configured via `PDF_OUTPUT_DIR`.
  - Files generated in `./public/generated/pdfs` are directly servable by Next.js as static assets at `/generated/pdfs/<filename>.pdf`.
  - For secured/authenticated streaming access, use the `/api/pdf/download` route.
- **Audit Logging**: Every PDF generation action triggers `logSecurityEvent` with `SECURITY_ACTION.PDF_GENERATED` recording the actor, target path, and metadata.

---

## API Endpoints

### 1. Training Certificate
- **Route**: `POST /api/pdf/certificate`
- **Permission**: `training.manage` (`PERMISSIONS.TRAINING_MANAGE`)
- **Request Body**:
  ```json
  {
    "employeeId": "cuid...",
    "certificateId": "cuid..." // optional
  }
  ```
- **Response**:
  ```json
  {
    "pdfUrl": "/generated/pdfs/certificate-emp123-1762491234567.pdf"
  }
  ```
- **Side Effect**: Updates `documentUrl` and `pdfUrl` on the corresponding `TrainingCertificate` record.

---

### 2. Promotion & Increment Letter
- **Route**: `POST /api/pdf/promotion`
- **Permission**: `employees.promotion.create` (`PERMISSIONS.EMPLOYEE_PROMOTION_CREATE`)
- **Request Body**:
  ```json
  {
    "promotionId": "cuid..."
  }
  ```
- **Response**:
  ```json
  {
    "pdfUrl": "/generated/pdfs/promotion-Fatima_Al_Mansoori-1762491234567.pdf"
  }
  ```
- **Side Effect**: Updates `pdfUrl` on the corresponding `EmployeePromotion` record.

---

### 3. Monthly Pay Slip
- **Route**: `POST /api/pdf/payslip`
- **Permission**: `payroll.payslip.view.all` (`PERMISSIONS.PAYROLL_PAYSLIP_VIEW_ALL`)
- **Request Body**:
  ```json
  {
    "salaryRecordId": "cuid..."
  }
  ```
- **Response**:
  ```json
  {
    "pdfUrl": "/generated/pdfs/payslip-emp123-10_2026-1762491234567.pdf"
  }
  ```
- **Side Effect**: Updates `pdfUrl` on the corresponding `SalaryRecord` record.

---

### 4. Authenticated PDF Stream / Download
- **Route**: `GET /api/pdf/download?file=<filename>&download=false`
- **Authentication**: Requires valid active session.
- **Security**: Built-in path traversal protection. Only allows `.pdf` files.
- **Headers**:
  - `Content-Type: application/pdf`
  - `Content-Disposition: inline; filename="<filename>"` (or `attachment` if `download=true`)

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PDF_OUTPUT_DIR` | `./public/generated/pdfs` | Directory where generated PDF files are stored on disk. |
| `PDF_PROVIDER` | `local` | Storage provider driver (`local` disk; ready for S3 extension). |

---

## Automated Verification

Run unit tests via Vitest:
```bash
npx vitest run tests/pdf-generation.test.ts
```

