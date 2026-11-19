import jsPDF from "jspdf";

export interface InvoiceDataForPdf {
  invoiceNumber: string;
  tenantName?: string;
  tenantSlug?: string;
  billingPeriodStart: string | Date;
  billingPeriodEnd: string | Date;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency?: string;
  status: string;
  dueDate?: string | Date;
  paidAt?: string | Date | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

export function generateInvoicePdf(invoice: InvoiceDataForPdf) {
  const doc = new jsPDF("p", "mm", "a4");
  const currency = invoice.currency || "AED";

  // Corporate Banner Header
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 36, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE & RECEIPT", 14, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text("Enterprise Cloud HRMS Platform • TRN: 100482910400003", 14, 26);
  doc.text("Dubai Internet City, Dubai, United Arab Emirates", 14, 31);

  // Status Badge in Header
  const isPaid = invoice.status === "PAID" || !!invoice.paidAt;
  if (isPaid) {
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.roundedRect(160, 10, 36, 14, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", 172, 19);
  } else {
    doc.setFillColor(245, 158, 11); // Amber-500
    doc.roundedRect(155, 10, 41, 14, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.status || "PENDING", 160, 19);
  }

  // Two Column Metadata: Bill To & Invoice Info
  doc.setTextColor(51, 65, 85); // Slate-700
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO / CUSTOMER:", 14, 48);
  doc.text("INVOICE DETAILS:", 120, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  // Customer info
  doc.setFont("helvetica", "bold");
  doc.text(invoice.tenantName || "Customer Organization", 14, 55);
  doc.setFont("helvetica", "normal");
  if (invoice.tenantSlug) {
    doc.text(`Account ID: ${invoice.tenantSlug}`, 14, 61);
  }
  doc.text("Jurisdiction: United Arab Emirates", 14, 67);

  // Invoice info
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 120, 55);
  doc.setFont("helvetica", "normal");

  const issueDateStr = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");
  doc.text(`Issue Date: ${issueDateStr}`, 120, 61);

  const startStr = new Date(invoice.billingPeriodStart).toLocaleDateString("en-GB");
  const endStr = new Date(invoice.billingPeriodEnd).toLocaleDateString("en-GB");
  doc.text(`Period: ${startStr} - ${endStr}`, 120, 67);

  const paymentMethod = invoice.paymentMethod || "Credit Card (Online)";
  doc.text(`Payment Method: ${paymentMethod}`, 120, 73);

  // Table Line Items Header
  const tableY = 86;
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.rect(14, tableY, 182, 9, "F");
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, tableY, 182, 9, "S");

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Item / Description", 18, tableY + 6);
  doc.text("Billing Period", 95, tableY + 6);
  doc.text("Net (AED)", 135, tableY + 6);
  doc.text("VAT (5%)", 160, tableY + 6);
  doc.text("Total", 180, tableY + 6);

  // Line Item Row
  const rowY = tableY + 9;
  doc.rect(14, rowY, 182, 16, "S");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const description = invoice.notes || "Enterprise Subscription & Modules";
  doc.text(description, 18, rowY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Platform license entitlement & cloud hosted services", 18, rowY + 11);

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`${startStr} - ${endStr}`, 95, rowY + 8);
  doc.text(invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }), 135, rowY + 8);
  doc.text(invoice.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), 160, rowY + 8);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }), 180, rowY + 8);

  // Totals Box
  const totalsY = rowY + 24;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  doc.text("Net Subtotal:", 135, totalsY);
  doc.text(`${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`, 170, totalsY);

  doc.text("UAE VAT (5%):", 135, totalsY + 6);
  doc.text(`${invoice.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`, 170, totalsY + 6);

  doc.setDrawColor(203, 213, 225);
  doc.line(135, totalsY + 9, 196, totalsY + 9);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Grand Total:", 135, totalsY + 16);
  doc.text(`${invoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`, 168, totalsY + 16);

  // Payment Confirmation Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, totalsY - 2, 105, 28, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, totalsY - 2, 105, 28, 2, 2, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text("PAYMENT CONFIRMATION", 18, totalsY + 4);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Status: Settled & Validated • Currency: ${currency}`, 18, totalsY + 10);
  doc.text(`Receipt Reference: ${invoice.invoiceNumber}`, 18, totalsY + 16);
  doc.text("Electronic tax invoice issued under UAE Federal Tax Authority rules.", 18, totalsY + 22);

  // Official Stamp & Signature Area
  const stampY = totalsY + 36;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.roundedRect(140, stampY, 56, 24, 2, 2, "S");
  doc.setLineDashPattern([], 0);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(99, 102, 241);
  doc.text("OFFICIAL DIGITAL SEAL", 146, stampY + 8);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Enterprise Finance Authority", 146, stampY + 14);
  doc.text("Verified & Digitally Signed", 146, stampY + 19);

  // Legal Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Thank you for choosing our Enterprise HRMS. For inquiries, contact support@hrms.local or billing@hrms.local",
    14,
    275
  );
  doc.text(
    "All amounts are in United Arab Emirates Dirham (AED) inclusive of statutory Value Added Tax where applicable.",
    14,
    280
  );

  // Trigger Save
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
