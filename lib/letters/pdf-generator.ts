import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
import { CompanySettings } from "@/app/lib/actions/company-settings";

export const LETTERS_OUTPUT_DIR = process.env.PDF_OUTPUT_DIR ?? "./public/generated/pdfs";

export interface GenerateLetterPdfParams {
  referenceNumber: string;
  letterType: string;
  content_en: string;
  content_ar?: string | null;
  branding?: CompanySettings | null;
  employeeName: string;
  employeeId?: string;
  designation?: string;
  department?: string;
}

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

/** Embed an image from base64 or fallback to public disk asset safely */
async function embedImageSafely(doc: PDFDocument, base64OrPath?: string | null) {
  if (!base64OrPath) return null;

  try {
    if (base64OrPath.startsWith("data:image/")) {
      const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(base64OrPath);
      if (match) {
        const bytes = Buffer.from(match[2], "base64");
        if (match[1].toLowerCase() === "png") {
          return await doc.embedPng(bytes);
        } else {
          return await doc.embedJpg(bytes);
        }
      }
    } else {
      const fullPath = path.resolve(process.cwd(), base64OrPath);
      if (fs.existsSync(fullPath)) {
        const bytes = await fs.promises.readFile(fullPath);
        if (fullPath.toLowerCase().endsWith(".png")) {
          return await doc.embedPng(bytes);
        } else if (fullPath.toLowerCase().endsWith(".jpg") || fullPath.toLowerCase().endsWith(".jpeg")) {
          return await doc.embedJpg(bytes);
        }
      }
    }
  } catch {
    // Return null gracefully if image decoding fails
  }
  return null;
}

/**
 * Enterprise PDF Generator for official HR letters.
 * Incorporates tenant letterhead, company header, reference number, body, and authorized signature & stamp.
 */
export async function generateOfficialLetterPDF(params: GenerateLetterPdfParams): Promise<string> {
  const doc = await PDFDocument.create();
  // Standard Portrait A4: 595.28 x 841.89 points
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);

  // 1. Tenant Letterhead background if available
  const letterheadImg = await embedImageSafely(doc, params.branding?.letterhead);
  if (letterheadImg) {
    page.drawImage(letterheadImg, {
      x: 0,
      y: 0,
      width,
      height,
    });
  } else {
    // Default crisp corporate header band
    page.drawRectangle({
      x: 0,
      y: height - 12,
      width,
      height: 12,
      color: rgb(0.12, 0.23, 0.54),
    });

    // Company logo or brand title
    const logoImg = await embedImageSafely(doc, params.branding?.logo);
    if (logoImg) {
      page.drawImage(logoImg, {
        x: 45,
        y: height - 85,
        width: 120,
        height: 45,
      });
    } else {
      const companyName = params.branding?.name || "AL BARAKAH GROUP LLC";
      page.drawText(companyName.toUpperCase(), {
        x: 45,
        y: height - 60,
        size: 16,
        font: titleFont,
        color: rgb(0.08, 0.15, 0.35),
      });
    }

    // Company metadata right-aligned in header
    const address = params.branding?.address || "Dubai Silicon Oasis, UAE";
    const contact = `${params.branding?.email || "hr@company.com"} | ${params.branding?.phone || "+971 4 000 0000"}`;
    page.drawText(address, {
      x: width - 240,
      y: height - 55,
      size: 8.5,
      font: regularFont,
      color: rgb(0.35, 0.4, 0.45),
    });
    page.drawText(contact, {
      x: width - 240,
      y: height - 68,
      size: 8.5,
      font: regularFont,
      color: rgb(0.35, 0.4, 0.45),
    });

    // Divider line
    page.drawLine({
      start: { x: 45, y: height - 95 },
      end: { x: width - 45, y: height - 95 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });
  }

  // 2. Reference Number & Issue Date Block
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  page.drawText(`Ref: ${params.referenceNumber}`, {
    x: 45,
    y: height - 120,
    size: 9.5,
    font: titleFont,
    color: rgb(0.2, 0.25, 0.3),
  });

  page.drawText(`Date: ${dateStr}`, {
    x: width - 160,
    y: height - 120,
    size: 9.5,
    font: regularFont,
    color: rgb(0.2, 0.25, 0.3),
  });

  // 3. Document Title (Centered)
  const titleText = (params.letterType || "OFFICIAL HR CERTIFICATE").replace(/_/g, " ").toUpperCase();
  const titleWidth = titleFont.widthOfTextAtSize(titleText, 14);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: height - 160,
    size: 14,
    font: titleFont,
    color: rgb(0.08, 0.15, 0.35),
  });

  // Subtitle decoration
  page.drawLine({
    start: { x: (width - titleWidth) / 2 - 10, y: height - 168 },
    end: { x: (width + titleWidth) / 2 + 10, y: height - 168 },
    thickness: 1.5,
    color: rgb(0.12, 0.23, 0.54),
  });

  // 4. Letter Body Content Wrapping
  let cursorY = height - 210;
  const content = params.content_en || "This is an official communication.";

  // Strip raw HTML tags if any exist in the content
  const cleanContent = content.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ");
  const paragraphs = cleanContent.split("\n");

  const maxWidth = width - 90; // 45pt left and right margins

  for (const para of paragraphs) {
    if (!para.trim()) {
      cursorY -= 12;
      continue;
    }

    const words = para.split(" ");
    let currentLine = "";

    for (const word of words) {
      const candidateLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = regularFont.widthOfTextAtSize(candidateLine, 10);

      if (textWidth > maxWidth) {
        page.drawText(currentLine, {
          x: 45,
          y: cursorY,
          size: 10,
          font: regularFont,
          color: rgb(0.15, 0.18, 0.22),
          lineHeight: 15,
        });
        currentLine = word;
        cursorY -= 16;
      } else {
        currentLine = candidateLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, {
        x: 45,
        y: cursorY,
        size: 10,
        font: regularFont,
        color: rgb(0.15, 0.18, 0.22),
        lineHeight: 15,
      });
      cursorY -= 18;
    }
  }

  // 5. Sign-off and Authorized Signatory
  const signBlockY = 160;

  page.drawText("Sincerely,", {
    x: 45,
    y: signBlockY + 30,
    size: 10,
    font: regularFont,
    color: rgb(0.15, 0.18, 0.22),
  });

  page.drawText("Human Resources Department", {
    x: 45,
    y: signBlockY + 15,
    size: 10,
    font: titleFont,
    color: rgb(0.08, 0.15, 0.35),
  });

  page.drawText(params.branding?.name || "Corporate Operations", {
    x: 45,
    y: signBlockY,
    size: 9,
    font: regularFont,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Stamp and Signature
  const stampImg = await embedImageSafely(doc, params.branding?.stamp || "public/assets/stamp.png");
  if (stampImg) {
    page.drawImage(stampImg, {
      x: 170,
      y: signBlockY - 45,
      width: 75,
      height: 75,
    });
  }

  const sigImg = await embedImageSafely(doc, params.branding?.signature || "public/assets/signature.png");
  if (sigImg) {
    page.drawImage(sigImg, {
      x: 45,
      y: signBlockY - 35,
      width: 90,
      height: 40,
    });
  }

  // Verification disclaimer footer
  page.drawText("This document is system-generated and verified under electronic records governance.", {
    x: 45,
    y: 35,
    size: 7.5,
    font: italicFont,
    color: rgb(0.5, 0.55, 0.6),
  });

  // Write to disk
  const targetDir = path.resolve(process.cwd(), LETTERS_OUTPUT_DIR);
  await fs.promises.mkdir(targetDir, { recursive: true });
  const filename = `letter_${params.referenceNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
  const filePath = path.resolve(targetDir, filename);
  const pdfBytes = await doc.save();
  await fs.promises.writeFile(filePath, pdfBytes);

  return filePath;
}

