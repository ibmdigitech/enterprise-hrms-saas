import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import {
  generateCertificate,
  generatePromotionLetter,
  generatePaySlip,
  generateBatchPaySlipsBuffer,
  getPdfRelativeUrl,
} from "@/lib/pdf/generate";

describe("Enterprise PDF Generation Suite", () => {
  const generatedFiles: string[] = [];

  afterAll(async () => {
    // Clean up test PDFs
    for (const file of generatedFiles) {
      try {
        if (fs.existsSync(file)) {
          await fs.promises.unlink(file);
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe("URL helper: getPdfRelativeUrl", () => {
    it("converts public disk path to a web-accessible relative URL", () => {
      const publicPath = path.resolve(process.cwd(), "public", "generated", "pdfs", "test.pdf");
      const url = getPdfRelativeUrl(publicPath);
      expect(url).toBe("/generated/pdfs/test.pdf");
    });

    it("ensures forward slashes regardless of OS backslashes", () => {
      const mockWinPath = "C:\\projects\\saas-repo\\public\\generated\\pdfs\\cert-123.pdf";
      const url = getPdfRelativeUrl(mockWinPath);
      expect(url.includes("\\")).toBe(false);
      expect(url.startsWith("/")).toBe(true);
    });
  });

  describe("Training Certificate Generation", () => {
    it("generates a valid, non-empty A4 landscape certificate PDF", async () => {
      const pdfPath = await generateCertificate({
        employeeName: "Fatima Al Mansoori",
        employeeId: "emp-test-001",
        courseTitle: "Enterprise Compliance & UAE Labor Law Mastery",
        grade: "Distinction",
        score: 98,
        verificationCode: "CERT-UAE-2026-9912",
        tenantName: "Emirates Corporate Holdings",
        issueDate: new Date("2026-05-15"),
      });

      generatedFiles.push(pdfPath);

      expect(fs.existsSync(pdfPath)).toBe(true);
      const stat = await fs.promises.stat(pdfPath);
      expect(stat.size).toBeGreaterThan(1000);

      const buffer = await fs.promises.readFile(pdfPath);
      const header = buffer.subarray(0, 5).toString("utf-8");
      expect(header).toBe("%PDF-");
    });
  });

  describe("Promotion & Increment Letter Generation", () => {
    it("generates an official promotion letter PDF with designation and compensation", async () => {
      const pdfPath = await generatePromotionLetter({
        employeeName: "Rashid bin Tariq",
        employeeCode: "EMP-DXB-408",
        department: "Enterprise Engineering",
        currentDesignation: "Senior Software Engineer",
        newDesignation: "Principal Platform Architect",
        effectiveDate: new Date("2026-06-01"),
        newSalary: 38500,
        incrementAmount: 6500,
        tenantName: "Global Solutions MENA",
      });

      generatedFiles.push(pdfPath);

      expect(fs.existsSync(pdfPath)).toBe(true);
      const stat = await fs.promises.stat(pdfPath);
      expect(stat.size).toBeGreaterThan(1000);

      const buffer = await fs.promises.readFile(pdfPath);
      expect(buffer.subarray(0, 5).toString("utf-8")).toBe("%PDF-");
    });
  });

  describe("Monthly Pay Slip Generation", () => {
    it("generates a detailed itemized payroll payslip PDF strictly on 1 page", async () => {
      const pdfPath = await generatePaySlip({
        employeeName: "Zayed Al Nahyan",
        employeeId: "emp-pay-882",
        employeeCode: "EMP-AUH-104",
        designation: "Financial Controller",
        department: "Finance & Accounts",
        period: "05/2026",
        basic: 18000,
        housing: 7500,
        transport: 3000,
        otherAllowances: 1500,
        overtime: 1200,
        bonus: 2000,
        gross: 33200,
        latePenalty: 0,
        leaveDeductions: 500,
        loanDeduction: 1200,
        otherDeductions: 0,
        deductions: 1700,
        net: 31500,
        tenantName: "Emirates Sovereign Corp",
      });

      generatedFiles.push(pdfPath);

      expect(fs.existsSync(pdfPath)).toBe(true);
      const stat = await fs.promises.stat(pdfPath);
      expect(stat.size).toBeGreaterThan(1000);

      const buffer = await fs.promises.readFile(pdfPath);
      expect(buffer.subarray(0, 5).toString("utf-8")).toBe("%PDF-");

      // Verify that individual payslip has exactly 1 page
      const doc = await PDFDocument.load(buffer);
      expect(doc.getPageCount()).toBe(1);
    });

    it("generates a batch multi-page PDF where each employee gets strictly one separate page", async () => {
      const employees = [
        { name: "Employee One", code: "EMP-001", net: 15000 },
        { name: "Employee Two", code: "EMP-002", net: 22000 },
        { name: "Employee Three", code: "EMP-003", net: 18500 },
      ];

      const batchData = employees.map((e, idx) => ({
        employeeName: e.name,
        employeeId: `emp-${idx + 1}`,
        employeeCode: e.code,
        designation: "Software Specialist",
        department: "Information Technology",
        period: "05/2026",
        basic: e.net * 0.6,
        housing: e.net * 0.25,
        transport: e.net * 0.15,
        gross: e.net,
        deductions: 0,
        net: e.net,
        tenantName: "Emirates Sovereign Corp",
      }));

      const pdfBytes = await generateBatchPaySlipsBuffer(batchData);
      expect(pdfBytes.length).toBeGreaterThan(2000);

      // Verify page count strictly equals employee count - never combined together on one page
      const doc = await PDFDocument.load(pdfBytes);
      expect(doc.getPageCount()).toBe(3);
    });
  });
});
