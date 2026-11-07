/**
 * PDF generation utilities for the HRMS.
 *
 * Uses `pdf-lib` (pure JavaScript, serverless & container friendly).
 * Each function generates an enterprise-grade document and returns the absolute path of the saved PDF file.
 *
 * All PDFs are written under the folder configured by `PDF_OUTPUT_DIR`
 * (defaults to `./public/generated/pdfs` so they can be statically served or streamed).
 */
import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, PDFImage } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";

/** Read env vars – fallback to sensible defaults for dev. */
export const OUTPUT_DIR = process.env.PDF_OUTPUT_DIR ?? "./public/generated/pdfs";

/** Helper: safely converts a disk path to a forward-slash web URL */
export function getPdfRelativeUrl(absolutePath: string): string {
  const publicDir = path.resolve(process.cwd(), "public");
  let relative = absolutePath;
  if (relative.startsWith(publicDir)) {
    relative = relative.slice(publicDir.length);
  } else if (relative.startsWith(process.cwd())) {
    relative = relative.slice(process.cwd().length);
  }
  return "/" + relative.replace(/^[\\/]+/, "").replace(/\\/g, "/");
}

/** Helper: writes a PDFDocument to disk and returns the full file path. */
async function writePdf(doc: PDFDocument, filename: string): Promise<string> {
  const targetDir = path.resolve(process.cwd(), OUTPUT_DIR);
  await fs.promises.mkdir(targetDir, { recursive: true });
  const filePath = path.resolve(targetDir, filename);
  const pdfBytes = await doc.save();
  await fs.promises.writeFile(filePath, pdfBytes);
  return filePath;
}

/** Try to load and embed an image from public assets safely */
async function tryEmbedPng(doc: PDFDocument, relativeAssetPath: string) {
  try {
    const fullPath = path.resolve(process.cwd(), relativeAssetPath);
    if (fs.existsSync(fullPath)) {
      const bytes = await fs.promises.readFile(fullPath);
      return await doc.embedPng(bytes);
    }
  } catch {
    // Ignore asset embedding errors gracefully
  }
  return null;
}

/** 1. Training Completion Certificate */
export async function generateCertificate(data: {
  employeeName: string;
  employeeId: string;
  courseTitle?: string;
  grade?: string | null;
  score?: number | null;
  verificationCode?: string;
  tenantName?: string;
  tenantLogoUrl?: string;
  issueDate?: Date;
}): Promise<string> {
  const doc = await PDFDocument.create();
  // Landscape A4: 842 x 595
  const page = doc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Outer Border (Navy Blue)
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.08, 0.22, 0.45),
    borderWidth: 4,
  });

  // Inner Border (Gold Accent)
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: rgb(0.85, 0.65, 0.13),
    borderWidth: 1.5,
  });

  // Header - Organization Name
  const orgName = (data.tenantName || "ENTERPRISE HRMS ACADEMY").toUpperCase();
  const orgWidth = regularFont.widthOfTextAtSize(orgName, 13);
  page.drawText(orgName, {
    x: (width - orgWidth) / 2,
    y: height - 75,
    size: 13,
    font: regularFont,
    color: rgb(0.35, 0.4, 0.48),
  });

  // Main Certificate Title
  const certTitle = "CERTIFICATE OF COMPLETION";
  const titleWidth = titleFont.widthOfTextAtSize(certTitle, 26);
  page.drawText(certTitle, {
    x: (width - titleWidth) / 2,
    y: height - 120,
    size: 26,
    font: titleFont,
    color: rgb(0.08, 0.22, 0.45),
  });

  // Presentation Subtext
  const subtext = "PROUDLY PRESENTED TO";
  const subWidth = regularFont.widthOfTextAtSize(subtext, 11);
  page.drawText(subtext, {
    x: (width - subWidth) / 2,
    y: height - 165,
    size: 11,
    font: regularFont,
    color: rgb(0.5, 0.55, 0.6),
  });

  // Employee Name
  const name = data.employeeName.toUpperCase();
  const nameWidth = titleFont.widthOfTextAtSize(name, 24);
  page.drawText(name, {
    x: (width - nameWidth) / 2,
    y: height - 210,
    size: 24,
    font: titleFont,
    color: rgb(0.12, 0.15, 0.22),
  });

  // Underline beneath name
  page.drawLine({
    start: { x: (width - nameWidth) / 2 - 20, y: height - 218 },
    end: { x: (width + nameWidth) / 2 + 20, y: height - 218 },
    thickness: 1.5,
    color: rgb(0.85, 0.65, 0.13),
  });

  // Course Description
  const course = data.courseTitle || "Professional Workforce Development Training";
  const courseText = `for successfully completing the curriculum and professional assessments in`;
  const cWidth = italicFont.widthOfTextAtSize(courseText, 12);
  page.drawText(courseText, {
    x: (width - cWidth) / 2,
    y: height - 260,
    size: 12,
    font: italicFont,
    color: rgb(0.25, 0.3, 0.35),
  });

  const courseTitleWidth = titleFont.widthOfTextAtSize(course, 16);
  page.drawText(course, {
    x: (width - courseTitleWidth) / 2,
    y: height - 290,
    size: 16,
    font: titleFont,
    color: rgb(0.08, 0.22, 0.45),
  });

  // Score / Grade if available
  if (data.score !== undefined && data.score !== null) {
    const scoreStr = `Final Score: ${data.score}% ${data.grade ? `(Grade: ${data.grade})` : ""}`;
    const scoreW = regularFont.widthOfTextAtSize(scoreStr, 11);
    page.drawText(scoreStr, {
      x: (width - scoreW) / 2,
      y: height - 320,
      size: 11,
      font: regularFont,
      color: rgb(0.15, 0.55, 0.35),
    });
  }

  // Stamp and Signature
  const stampImage = await tryEmbedPng(doc, "public/assets/stamp.png");
  if (stampImage) {
    page.drawImage(stampImage, { x: 130, y: 70, width: 75, height: 75 });
  }

  const sigImage = await tryEmbedPng(doc, "public/assets/signature.png");
  if (sigImage) {
    page.drawImage(sigImage, { x: width - 260, y: 90, width: 130, height: 45 });
  }

  // Signature line
  page.drawLine({
    start: { x: width - 270, y: 85 },
    end: { x: width - 110, y: 85 },
    thickness: 1,
    color: rgb(0.4, 0.45, 0.5),
  });
  const sigLabel = "Authorized Signature & Stamp";
  const sigLabelW = regularFont.widthOfTextAtSize(sigLabel, 10);
  page.drawText(sigLabel, {
    x: width - 190 - sigLabelW / 2,
    y: 70,
    size: 10,
    font: regularFont,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Date and Verification Code block
  const issueDateStr = (data.issueDate ?? new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  page.drawText(`Date of Issuance: ${issueDateStr}`, {
    x: 60,
    y: 85,
    size: 10,
    font: regularFont,
    color: rgb(0.35, 0.4, 0.45),
  });

  const vCode = data.verificationCode || `CERT-${data.employeeId.slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  page.drawText(`Verification Code: ${vCode}`, {
    x: 60,
    y: 68,
    size: 10,
    font: regularFont,
    color: rgb(0.35, 0.4, 0.45),
  });

  const fileName = `certificate-${data.employeeId}-${Date.now()}.pdf`;
  return writePdf(doc, fileName);
}

/** 2. Promotion & Increment Letter */
export async function generatePromotionLetter(data: {
  employeeName: string;
  employeeCode?: string;
  department?: string;
  currentDesignation?: string;
  newDesignation: string;
  effectiveDate: Date;
  incrementAmount?: number;
  newSalary?: number;
  tenantName?: string;
  tenantLetterheadUrl?: string;
}): Promise<string> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 Portrait
  const { width, height } = page.getSize();

  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  // Top header banner
  page.drawRectangle({
    x: 0,
    y: height - 8,
    width,
    height: 8,
    color: rgb(0.08, 0.22, 0.45),
  });

  // Header Title
  const compName = data.tenantName || "HUMAN RESOURCES MANAGEMENT GROUP";
  page.drawText(compName, {
    x: 50,
    y: height - 60,
    size: 14,
    font: titleFont,
    color: rgb(0.08, 0.22, 0.45),
  });

  page.drawText("CONFIDENTIAL - EMPLOYEE ADVANCEMENT NOTIFICATION", {
    x: 50,
    y: height - 76,
    size: 9,
    font: regularFont,
    color: rgb(0.45, 0.5, 0.55),
  });

  page.drawLine({
    start: { x: 50, y: height - 86 },
    end: { x: width - 50, y: height - 86 },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  // Date and Recipient Info
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  page.drawText(`Date: ${dateStr}`, {
    x: 50,
    y: height - 120,
    size: 10,
    font: regularFont,
  });

  page.drawText(`To: ${data.employeeName}`, {
    x: 50,
    y: height - 145,
    size: 12,
    font: titleFont,
  });
  if (data.employeeCode) {
    page.drawText(`Employee Code: ${data.employeeCode}`, {
      x: 50,
      y: height - 162,
      size: 10,
      font: regularFont,
      color: rgb(0.3, 0.35, 0.4),
    });
  }
  if (data.department) {
    page.drawText(`Department: ${data.department}`, {
      x: 50,
      y: height - 177,
      size: 10,
      font: regularFont,
      color: rgb(0.3, 0.35, 0.4),
    });
  }

  // Subject
  const subjectY = height - 210;
  page.drawText(`Subject: Official Letter of Promotion & Compensation Revision`, {
    x: 50,
    y: subjectY,
    size: 12,
    font: titleFont,
    color: rgb(0.08, 0.22, 0.45),
  });

  // Body text
  const effDateStr = data.effectiveDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const bodyParagraphs = [
    `Dear ${data.employeeName},`,
    `On behalf of the leadership team, we are delighted to inform you that in recognition of your outstanding performance, dedication, and impactful contributions to our organization, you have been promoted to the position of:`,
    `${data.newDesignation}`,
    `This appointment is effective as of ${effDateStr}. In your new capacity, you will assume expanded leadership and operational responsibilities aligned with the strategic objectives of the department.`,
    data.newSalary
      ? `In tandem with this promotion, your compensation has been revised to AED ${data.newSalary.toLocaleString("en-US", { minimumFractionDigits: 2 })} per month${data.incrementAmount ? ` (reflecting an increment of AED ${data.incrementAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })})` : ""}. All other terms of employment remain in accordance with your employment contract and company policies.`
      : `All other terms and conditions of your employment contract remain intact. Detailed compensation updates and benefits adjustments will be communicated by the payroll team.`,
    `We commend your professionalism and commitment to excellence, and we look forward to your continued success and leadership.`,
  ];

  let currentY = subjectY - 30;
  for (const para of bodyParagraphs) {
    if (para === data.newDesignation) {
      // Highlight new title in box
      page.drawRectangle({
        x: 50,
        y: currentY - 8,
        width: width - 100,
        height: 28,
        color: rgb(0.93, 0.95, 0.99),
        borderColor: rgb(0.18, 0.35, 0.65),
        borderWidth: 1,
      });
      page.drawText(para, {
        x: 65,
        y: currentY + 1,
        size: 13,
        font: titleFont,
        color: rgb(0.08, 0.22, 0.45),
      });
      currentY -= 40;
    } else {
      page.drawText(para, {
        x: 50,
        y: currentY,
        size: 10,
        font: regularFont,
        color: rgb(0.18, 0.22, 0.28),
        lineHeight: 15,
        maxWidth: width - 100,
      });
      currentY -= 45;
    }
  }

  // Closing Signatures & Stamp
  const stampImage = await tryEmbedPng(doc, "public/assets/stamp.png");
  if (stampImage) {
    page.drawImage(stampImage, { x: 70, y: 90, width: 70, height: 70 });
  }

  const sigImage = await tryEmbedPng(doc, "public/assets/signature.png");
  if (sigImage) {
    page.drawImage(sigImage, { x: width - 230, y: 110, width: 120, height: 40 });
  }

  page.drawLine({
    start: { x: width - 240, y: 105 },
    end: { x: width - 60, y: 105 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });

  page.drawText("Head of People & Culture", {
    x: width - 220,
    y: 90,
    size: 10,
    font: titleFont,
    color: rgb(0.2, 0.25, 0.3),
  });

  page.drawText("Enterprise Human Resources Division", {
    x: width - 220,
    y: 76,
    size: 9,
    font: regularFont,
    color: rgb(0.45, 0.5, 0.55),
  });

  const fileName = `promotion-${data.employeeName.replace(/\s+/g, "_")}-${Date.now()}.pdf`;
  return writePdf(doc, fileName);
}

/** Interface for single payslip rendering */
export interface PaySlipData {
  employeeName: string;
  employeeId: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  period: string; // e.g. "10/2026"
  basic?: number;
  housing?: number;
  transport?: number;
  otherAllowances?: number;
  overtime?: number;
  bonus?: number;
  gross: number;
  latePenalty?: number;
  leaveDeductions?: number;
  loanDeduction?: number;
  otherDeductions?: number;
  deductions: number;
  net: number;
  tenantName?: string;
  tenantLogoUrl?: string;
}

/** Renders a single-page payslip strictly within one A4 portrait page */
export function renderPaySlipOnPage(
  page: PDFPage,
  data: PaySlipData,
  fonts: { titleFont: PDFFont; regularFont: PDFFont },
  images?: { stampImage?: PDFImage | null; sigImage?: PDFImage | null }
) {
  const { width, height } = page.getSize();
  const { titleFont, regularFont } = fonts;

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 10,
    width,
    height: 10,
    color: rgb(0.08, 0.22, 0.45),
  });

  // Company / Payslip Header
  const orgName = data.tenantName || "ENTERPRISE PAYROLL SERVICES";
  page.drawText(orgName, {
    x: 50,
    y: height - 55,
    size: 15,
    font: titleFont,
    color: rgb(0.08, 0.22, 0.45),
  });

  page.drawText("CONFIDENTIAL SALARY PAYSLIP", {
    x: 50,
    y: height - 72,
    size: 10,
    font: titleFont,
    color: rgb(0.45, 0.5, 0.55),
  });

  page.drawText(`Pay Period: ${data.period}`, {
    x: width - 180,
    y: height - 55,
    size: 11,
    font: titleFont,
    color: rgb(0.08, 0.22, 0.45),
  });

  page.drawLine({
    start: { x: 50, y: height - 85 },
    end: { x: width - 50, y: height - 85 },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  // Employee Information Box
  const infoBoxY = height - 155;
  page.drawRectangle({
    x: 50,
    y: infoBoxY,
    width: width - 100,
    height: 60,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawText(`Employee Name: ${data.employeeName}`, {
    x: 65,
    y: infoBoxY + 40,
    size: 10,
    font: titleFont,
  });
  page.drawText(`Employee ID: ${data.employeeCode || data.employeeId}`, {
    x: 65,
    y: infoBoxY + 20,
    size: 10,
    font: regularFont,
  });

  if (data.designation) {
    page.drawText(`Designation: ${data.designation}`, {
      x: width / 2 + 10,
      y: infoBoxY + 40,
      size: 10,
      font: regularFont,
    });
  }
  if (data.department) {
    page.drawText(`Department: ${data.department}`, {
      x: width / 2 + 10,
      y: infoBoxY + 20,
      size: 10,
      font: regularFont,
    });
  }

  // Earnings & Deductions Tables Header
  const tableTop = infoBoxY - 25;
  const colWidth = (width - 110) / 2;

  // Earnings Header Box
  page.drawRectangle({
    x: 50,
    y: tableTop - 20,
    width: colWidth,
    height: 20,
    color: rgb(0.08, 0.22, 0.45),
  });
  page.drawText("EARNINGS", {
    x: 60,
    y: tableTop - 15,
    size: 9,
    font: titleFont,
    color: rgb(1, 1, 1),
  });
  page.drawText("AMOUNT (AED)", {
    x: 50 + colWidth - 85,
    y: tableTop - 15,
    size: 9,
    font: titleFont,
    color: rgb(1, 1, 1),
  });

  // Deductions Header Box
  page.drawRectangle({
    x: 60 + colWidth,
    y: tableTop - 20,
    width: colWidth,
    height: 20,
    color: rgb(0.7, 0.2, 0.2),
  });
  page.drawText("DEDUCTIONS", {
    x: 70 + colWidth,
    y: tableTop - 15,
    size: 9,
    font: titleFont,
    color: rgb(1, 1, 1),
  });
  page.drawText("AMOUNT (AED)", {
    x: width - 135,
    y: tableTop - 15,
    size: 9,
    font: titleFont,
    color: rgb(1, 1, 1),
  });

  // Earnings Lines
  const earningsItems = [
    { label: "Basic Salary", amount: data.basic ?? (data.gross * 0.6) },
    { label: "Housing Allowance", amount: data.housing ?? (data.gross * 0.25) },
    { label: "Transport Allowance", amount: data.transport ?? (data.gross * 0.15) },
    { label: "Overtime / Bonus", amount: (data.overtime ?? 0) + (data.bonus ?? 0) },
    { label: "Other Allowances", amount: data.otherAllowances ?? 0 },
  ];

  // Deductions Lines
  const deductionsItems = [
    { label: "Absence / Leave Deductions", amount: data.leaveDeductions ?? (data.deductions * 0.5) },
    { label: "Late Penalty", amount: data.latePenalty ?? 0 },
    { label: "Loan Repayment", amount: data.loanDeduction ?? (data.deductions * 0.5) },
    { label: "Other Deductions", amount: data.otherDeductions ?? 0 },
  ];

  let rowY = tableTop - 40;
  const maxRows = Math.max(earningsItems.length, deductionsItems.length);

  for (let i = 0; i < maxRows; i++) {
    const earn = earningsItems[i];
    const ded = deductionsItems[i];

    // Background zebra striping
    if (i % 2 === 1) {
      page.drawRectangle({
        x: 50,
        y: rowY - 5,
        width: width - 100,
        height: 18,
        color: rgb(0.97, 0.97, 0.98),
      });
    }

    if (earn) {
      page.drawText(earn.label, { x: 60, y: rowY, size: 9, font: regularFont });
      const amtStr = earn.amount.toFixed(2);
      const amtW = regularFont.widthOfTextAtSize(amtStr, 9);
      page.drawText(amtStr, { x: 50 + colWidth - 20 - amtW, y: rowY, size: 9, font: regularFont });
    }

    if (ded) {
      page.drawText(ded.label, { x: 70 + colWidth, y: rowY, size: 9, font: regularFont });
      const dedStr = ded.amount.toFixed(2);
      const dedW = regularFont.widthOfTextAtSize(dedStr, 9);
      page.drawText(dedStr, { x: width - 70 - dedW, y: rowY, size: 9, font: regularFont });
    }

    rowY -= 20;
  }

  // Totals Row
  const totalRowY = rowY - 5;
  page.drawLine({
    start: { x: 50, y: totalRowY + 15 },
    end: { x: width - 50, y: totalRowY + 15 },
    thickness: 1,
    color: rgb(0.7, 0.75, 0.8),
  });

  page.drawText("Total Gross Earnings:", { x: 60, y: totalRowY, size: 10, font: titleFont });
  const grossStr = `AED ${data.gross.toFixed(2)}`;
  const grossW = titleFont.widthOfTextAtSize(grossStr, 10);
  page.drawText(grossStr, { x: 50 + colWidth - 20 - grossW, y: totalRowY, size: 10, font: titleFont });

  page.drawText("Total Deductions:", { x: 70 + colWidth, y: totalRowY, size: 10, font: titleFont });
  const dedStr = `AED ${data.deductions.toFixed(2)}`;
  const dedW = titleFont.widthOfTextAtSize(dedStr, 10);
  page.drawText(dedStr, { x: width - 70 - dedW, y: totalRowY, size: 10, font: titleFont });

  // NET SALARY HIGHLIGHT BOX
  const netBoxY = totalRowY - 65;
  page.drawRectangle({
    x: 50,
    y: netBoxY,
    width: width - 100,
    height: 45,
    color: rgb(0.93, 0.98, 0.95),
    borderColor: rgb(0.18, 0.65, 0.35),
    borderWidth: 1.5,
  });

  page.drawText("NET PAYABLE SALARY:", {
    x: 70,
    y: netBoxY + 16,
    size: 13,
    font: titleFont,
    color: rgb(0.1, 0.45, 0.2),
  });

  const netFormatted = `AED ${data.net.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const netW = titleFont.widthOfTextAtSize(netFormatted, 15);
  page.drawText(netFormatted, {
    x: width - 70 - netW,
    y: netBoxY + 15,
    size: 15,
    font: titleFont,
    color: rgb(0.1, 0.45, 0.2),
  });

  // Stamp and Signature
  if (images?.stampImage) {
    page.drawImage(images.stampImage, { x: 70, y: 100, width: 65, height: 65 });
  }

  if (images?.sigImage) {
    page.drawImage(images.sigImage, { x: width - 210, y: 120, width: 110, height: 35 });
  }

  page.drawLine({
    start: { x: width - 220, y: 115 },
    end: { x: width - 60, y: 115 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });

  page.drawText("Finance & Payroll Authority", {
    x: width - 200,
    y: 100,
    size: 9,
    font: regularFont,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Footer Note
  page.drawText("This is a system generated document. For inquiries regarding deductions or allowances, contact payroll.", {
    x: 50,
    y: 40,
    size: 8,
    font: regularFont,
    color: rgb(0.5, 0.55, 0.6),
  });
}

/** 3. Monthly Pay Slip */
export async function generatePaySlip(data: PaySlipData): Promise<string> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 Portrait

  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const stampImage = await tryEmbedPng(doc, "public/assets/stamp.png");
  const sigImage = await tryEmbedPng(doc, "public/assets/signature.png");

  renderPaySlipOnPage(page, data, { titleFont, regularFont }, { stampImage, sigImage });

  const fileName = `payslip-${data.employeeId}-${data.period.replace(/[\/\\]/g, "_")}-${Date.now()}.pdf`;
  return writePdf(doc, fileName);
}

/** Generates a combined multi-page PDF where each employee gets strictly one individual A4 page */
export async function generateBatchPaySlipsBuffer(records: PaySlipData[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const stampImage = await tryEmbedPng(doc, "public/assets/stamp.png");
  const sigImage = await tryEmbedPng(doc, "public/assets/signature.png");

  for (const item of records) {
    const page = doc.addPage([595, 842]); // Distinct A4 page for each employee
    renderPaySlipOnPage(page, item, { titleFont, regularFont }, { stampImage, sigImage });
  }

  return await doc.save();
}
