import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePayslipPDF = (data: any) => {
    const doc = new jsPDF();
    const { 
        employee, 
        month, 
        year, 
        basic, 
        housingAllowance,
        transportAllowance,
        medicalAllowance,
        foodAllowance,
        travelAllowance,
        commission,
        otherAllowances,
        latePenalty,
        leaveDeduction,
        loanDeduction,
        otherDeductions,
        overtimePay,
        travelReimbursement,
        reimbursementTotal,
        bonus,
        net, 
        status,
        paymentMethod
    } = data;
    
    const name = `${employee?.firstName || ''} ${employee?.lastName || ''}`;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthLabel = monthNames[month - 1];

    // Header
    doc.setFontSize(24);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text("SALARY PAYSLIP", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("SMART-IT HRMS | Enterprise Payroll Services", 105, 28, { align: "center" });

    // Divider
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    // Employee & Company Details
    autoTable(doc, {
        startY: 45,
        margin: { left: 20, right: 20 },
        head: [['Employee Information', 'Employment Details']],
        body: [
            [
                `Name: ${name}\nEmployee ID: ${employee?.rollNumber || 'N/A'}\nEmail: ${employee?.email || 'N/A'}`,
                `Designation: ${employee?.designation || 'N/A'}\nPay Period: ${monthLabel} ${year}\nPayment Method: ${paymentMethod?.replace('_', ' ') || 'BANK TRANSFER'}`
            ]
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2, textColor: [71, 85, 105] },
        headStyles: { fontSize: 11, fontStyle: 'bold', textColor: [30, 41, 59] }
    });

    // Earnings & Deductions Tables
    const totalEarnings = basic + (housingAllowance||0) + (transportAllowance||0) + (medicalAllowance||0) + (foodAllowance||0) + (travelAllowance||0) + (commission||0) + (otherAllowances||0) + (overtimePay||0) + (travelReimbursement||0) + (reimbursementTotal||0) + (bonus||0);
    const totalDeductions = (latePenalty||0) + (leaveDeduction||0) + (loanDeduction||0) + (otherDeductions||0);

    autoTable(doc, {
        startY: (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 10,
        margin: { left: 20, right: 20 },
        head: [['Earnings Description', 'Amount (AED)', 'Deductions Description', 'Amount (AED)']],
        body: [
            ['Basic Salary',               (basic||0).toFixed(2),                     'Late Penalty',    (latePenalty||0).toFixed(2)],
            ['Housing Allowance',           (housingAllowance||0).toFixed(2),          'Leave Deduction', (leaveDeduction||0).toFixed(2)],
            ['Transport Allowance',         (transportAllowance||0).toFixed(2),        'Loan Deduction',  (loanDeduction||0).toFixed(2)],
            ['Medical Allowance',           (medicalAllowance||0).toFixed(2),          'Other Deductions',(otherDeductions||0).toFixed(2)],
            ['Food Allowance',              (foodAllowance||0).toFixed(2),             '', ''],
            ['Travel Allowance (Monthly)',  (travelAllowance||0).toFixed(2),           '', ''],
            ['Commission',                  (commission||0).toFixed(2),                '', ''],
            ['Other Allowances',            (otherAllowances||0).toFixed(2),           '', ''],
            ['Overtime Pay',                (overtimePay||0).toFixed(2),               '', ''],
            ['Travel Reimbursement',        (travelReimbursement||0).toFixed(2),       '', ''],
            ['Expense Reimbursement',       (reimbursementTotal||0).toFixed(2),        '', ''],
            ['Bonus / Incentives',          (bonus||0).toFixed(2),                     '', ''],
            [
                { content: 'Total Earnings',    styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }, 
                { content: totalEarnings.toFixed(2), styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
                { content: 'Total Deductions',  styles: { fontStyle: 'bold', fillColor: [254, 242, 242] } },
                { content: totalDeductions.toFixed(2), styles: { fontStyle: 'bold', fillColor: [254, 242, 242] } }
            ]
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        styles: { fontSize: 9 }
    });

    // Net Salary Box
    doc.setDrawColor(30, 41, 59);
    doc.setFillColor(30, 41, 59);
    doc.rect(130, (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 10, 60, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("NET SALARY (AED)", 160, (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 18, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(net.toFixed(2), 160, (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 26, { align: "center" });

    // Footer
    const finalY = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 60;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text("This is a computer-generated document and does not require a physical signature.", 105, finalY, { align: "center" });
    doc.text("For any discrepancies, please contact the HR department within 3 days of receipt.", 105, finalY + 5, { align: "center" });
    doc.text("© 2026 SMART-IT UAE | HR Management System", 105, finalY + 15, { align: "center" });

    // Save
    doc.save(`Payslip_${name.replace(/\s+/g, '_')}_${monthLabel}_${year}.pdf`);
};
