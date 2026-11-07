# Implementation Plan: Merge PDF System into Letter System (Option B)

## Executive Summary

Merge the standalone PDF generation (`lib/pdf/generate.ts` + `/api/pdf/*`) into the existing Letter System (`/api/letters`, `LetterTemplate`, `lib/letters/variables.ts`) to eliminate duplication and provide unified document generation with PDF storage.

**Principle:** No deletion. Extend existing infrastructure. The Letter System already has templates, variables, permissions, audit trail. PDF System adds the missing piece: actual PDF generation + storage.

---

## Current State Audit

### Letter System (`/api/letters`, `LetterTemplate`, `lib/letters/variables.ts`)
| Component | Status |
|-----------|--------|
| Template storage | ✅ `LetterTemplate` model (HTML + placeholders) |
| Variable resolution | ✅ `lib/letters/variables.ts` (snake_case + dotted) |
| Letter generation | ✅ `POST /api/letters` → HTML content |
| PDF generation | ❌ **Missing** - returns HTML only |
| PDF storage | ❌ `Letter.pdfUrl` column exists but **always NULL** |
| Download endpoint | ❌ Doesn't exist |
| Template types | Employment, Offer, Appointment, Relieving, NOC, Payroll, **SALARY_CERTIFICATE** |
| Permissions | `LETTER_GENERATE`, `LETTER_VIEW`, `LETTER_TEMPLATE_MANAGE` |
| Audit trail | ✅ `LETTER_GENERATED` security events |

### PDF System (`lib/pdf/generate.ts`, `/api/pdf/*`)
| Component | Status |
|-----------|--------|
| PDF generation | ✅ `pdf-lib` based generators |
| PDF storage | ✅ Writes to `./generated/pdfs/`, stores path in model (`pdfUrl`/`documentUrl`) |
| Download endpoint | ✅ `/api/pdf/download` |
| Template types | Training Certificate, Promotion Letter, Payslip |
| Permissions | Uses `TRAINING_MANAGE`, `EMPLOYEE_PROMOTION_CREATE`, `PAYROLL_PAYSLIP_VIEW_ALL` |
| Audit trail | ✅ `PDF_GENERATED` security events |

### Overlap / Conflict
| Area | Letter System | PDF System | Conflict |
|------|---------------|------------|----------|
| Salary Certificate | `SALARY_CERTIFICATE` template type | ❌ Not in PDF system | None (different) |
| Payslip | `PAYROLL` template type | `generatePaySlip()` | **Duplicate** |
| Promotion | ❌ No template | `generatePromotionLetter()` | None (different) |
| Training Certificate | ❌ No template | `generateCertificate()` | None (different) |

---

## Implementation Plan

### Phase 1: Extend Letter System with PDF Generation (Week 1)

#### 1.1 Add PDF Generation to Letter Creation
**File:** `app/api/letters/route.ts`

```typescript
// After creating Letter record (line ~203), generate PDF and store path
const pdfPath = await generateLetterPDF({
  letterId: created.id,
  template: template,
  content_en: content_en,
  content_ar: content_ar,
  subject: subject, // employee or candidate
  variables: variables,
});
await tx.letter.update({
  where: { id: created.id },
  data: { pdfUrl: relativePath(pdfPath) },
});
```

#### 1.2 Create Shared PDF Generator
**File:** `lib/letters/pdf-generator.ts` (NEW)

```typescript
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { renderTemplate } from "./variables";

export async function generateLetterPDF(params: {
  letterId: string;
  template: LetterTemplate;
  content_en: string;
  content_ar?: string | null;
  subject: LetterEmployee | LetterCandidate;
  variables: Record<string, string>;
}): Promise<string>
```

- Convert HTML template → PDF using `pdf-lib`
- Handle RTL for Arabic content
- Support tenant branding (logo, colors from `Tenant` model)
- Return file path

#### 1.3 Add Download Endpoint
**File:** `app/api/letters/[id]/download/route.ts` (NEW)

```typescript
// GET /api/letters/[id]/download?download=true
// Checks permissions (LETTER_VIEW + scope), streams PDF from Letter.pdfUrl
```

#### 1.4 Update Letter Model Usage
No schema changes needed - `Letter.pdfUrl` already exists.

---

### Phase 2: Migrate PDF System Types to Letter Templates (Week 2)

#### 2.1 Create Letter Templates for PDF System Types
**Action:** Add `LetterTemplate` records (via seed or migration)

| Template Type | Source | Target LetterTemplate |
|---------------|--------|----------------------|
| Payslip | `generatePaySlip()` | `PAYSLIP` (new type) |
| Promotion Letter | `generatePromotionLetter()` | `PROMOTION_LETTER` (new type) |
| Training Certificate | `generateCertificate()` | `TRAINING_CERTIFICATE` (new type) |

**Template content:** Move hard-coded layouts from `lib/pdf/generate.ts` into `LetterTemplate.htmlTemplate` + `cssStyles` fields.

#### 2.2 Add Template Types to Validation
**File:** `lib/letters/variables.ts`

```typescript
// Add to requiredByType and sanitizeCustomFields
PAYSLIP: ['employee.name', 'employee.rollNumber', 'salary.basic', ...],
PROMOTION_LETTER: ['employee.name', 'employee.rollNumber', 'promotion.newDesignation', ...],
TRAINING_CERTIFICATE: ['employee.name', 'course.title', 'certificate.issueDate', ...],
```

#### 2.3 Update PDF API Routes to Use Letter System
**Files:** `app/api/pdf/payslip/route.ts`, `app/api/pdf/promotion/route.ts`, `app/api/pdf/certificate/route.ts`

Change from:
```typescript
const pdfPath = await generatePaySlip(data);
await prisma.salaryRecord.update({ where: { id }, data: { pdfUrl: path } });
```

To:
```typescript
const letter = await prisma.letter.create({
  data: {
    employeeId,
    templateId: payslipTemplateId,
    referenceNumber: `PAYSLIP-${employeeId}-${period}`,
    content_en: renderedHTML,
    status: 'GENERATED',
    pdfUrl: pdfPath, // generated by shared function
  }
});
```

---

### Phase 3: Employee Self-Service Access (Week 3)

#### 3.1 Add Letter Download to Staff Portal
**File:** `app/staff-services/page.tsx` (or new `/staff-services/letters`)

```tsx
// Tab for "My Letters" - lists Letters where employeeId = current user
// Download button calls /api/letters/[id]/download
```

#### 3.2 Scope Letter Access
**File:** `app/api/letters/route.ts` (GET already has scoping via `scopeEmployeeWhere`)

Ensure `GET /api/letters` returns `pdfUrl` for download.

---

### Phase 4: Deprecate Standalone PDF System (Week 4)

#### 4.1 Mark Old Routes Deprecated
Keep `/api/pdf/*` working but add deprecation headers.

#### 4.2 Update UI Components
**File:** `components/payroll/DownloadPDFButton.tsx`

Change from calling `/api/pdf/payslip` → `/api/letters/[id]/download` (need letter ID on salary record).

#### 4.3 Migration Script (Optional)
Backfill `Letter` records for existing `SalaryRecord.pdfUrl`, `EmployeePromotion.pdfUrl`, `TrainingCertificate.documentUrl`.

---

## Data Model Changes

### LetterTemplate - Add Fields (if not present)
```prisma
model LetterTemplate {
  // ... existing fields
  htmlTemplate  String  // Already exists
  cssStyles     String? // Already exists
  // No changes needed - existing fields sufficient
}
```

### Letter - Already Has
```prisma
model Letter {
  pdfUrl String? // Already exists, currently unused
  // Perfect for storing generated PDF path
}
```

### SalaryRecord / EmployeePromotion / TrainingCertificate
Keep `pdfUrl`/`documentUrl` for backward compatibility. Can reference `Letter.id` later if needed.

---

## Permissions Mapping

| Action | Current Permission | New Permission |
|--------|-------------------|----------------|
| Generate payslip | `PAYROLL_PAYSLIP_VIEW_ALL` | `LETTER_GENERATE` + PAYSLIP template |
| Generate promotion | `EMPLOYEE_PROMOTION_CREATE` | `LETTER_GENERATE` + PROMOTION_LETTER template |
| Generate training cert | `TRAINING_MANAGE` | `LETTER_GENERATE` + TRAINING_CERTIFICATE template |
| Download own letters | ❌ | `LETTER_VIEW` (scoped) |

**Note:** Keep existing permissions for backward compat. Add template-level restrictions if needed.

---

## API Contract Changes

### POST /api/letters (Extended)
**Request:**
```json
{
  "templateId": "uuid",
  "employeeId": "uuid",
  "customFields": { "request.purpose": "Visa application" }
}
```

**Response (NEW):**
```json
{
  "id": "uuid",
  "referenceNumber": "LTR-UAE-2026-001",
  "pdfUrl": "/generated/pdfs/letter-uuid-timestamp.pdf",
  "status": "GENERATED"
}
```

### GET /api/letters/[id]/download (NEW)
**Query:** `?download=true|false`
**Response:** PDF file stream with `Content-Disposition`

---

## Testing Strategy

| Test | Description |
|------|-------------|
| Unit | `lib/letters/pdf-generator.ts` - HTML → PDF conversion |
| Unit | `lib/letters/variables.ts` - placeholder resolution for new types |
| Integration | `POST /api/letters` with each template type → PDF stored |
| Integration | `GET /api/letters/[id]/download` - permission scoping |
| E2E | Employee downloads payslip from `/staff-services` |
| E2E | HR generates promotion letter, employee downloads it |

---

## Rollout Checklist

- [ ] Phase 1: PDF generation in Letter creation
- [ ] Phase 1: Download endpoint
- [ ] Phase 2: Create 3 new LetterTemplates (seed data)
- [ ] Phase 2: Update validation for new template types
- [ ] Phase 2: Refactor PDF routes to use Letter system
- [ ] Phase 3: Staff portal letter download UI
- [ ] Phase 4: Deprecation headers on `/api/pdf/*`
- [ ] Phase 4: Update `DownloadPDFButton` component
- [ ] All tests pass
- [ ] TypeScript + ESLint clean

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| PDF generation fails silently | Wrap in try/catch, log error, don't block letter creation |
| Large PDFs memory issues | Stream generation, cleanup temp files |
| Template HTML not PDF-friendly | Add `cssStyles` field usage, test each template |
| Permission regression | Integration tests for each role/template combo |

---

## Files to Create

```
lib/letters/pdf-generator.ts          # NEW - shared PDF generation
app/api/letters/[id]/download/route.ts # NEW - download endpoint
prisma/seed-letter-templates.ts       # NEW - seed 3 templates
```

## Files to Modify

```
app/api/letters/route.ts              # Add PDF generation after create
lib/letters/variables.ts              # Add new template type validation
app/api/pdf/payslip/route.ts          # Refactor to use Letter system
app/api/pdf/promotion/route.ts        # Refactor to use Letter system
app/api/pdf/certificate/route.ts      # Refactor to use Letter system
components/payroll/DownloadPDFButton.tsx # Use letter download
app/staff-services/page.tsx           # Add "My Letters" tab
```

---

## Senior Developer Notes

1. **No breaking changes** - `/api/pdf/*` stays functional during transition
2. **Single source of truth** - `LetterTemplate` + `variables.ts` for all document types
3. **Audit trail preserved** - `LETTER_GENERATED` + `PDF_GENERATED` both logged
4. **Scalable** - New document types = new `LetterTemplate`, no code changes
5. **Tenant-aware** - PDF generator reads `Tenant.logoUrl`, `Tenant.primaryColor`

---

*Generated: 2026-11-07*
*Author: Senior Developer Audit*