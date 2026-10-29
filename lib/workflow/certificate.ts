import prisma from "@/lib/prisma";

export interface CertificateData {
    certificateNumber: string;
    title: string;
    employeeName: string;
    employeeCode: string;
    employeePhoto: string | null;
    courseTitle: string;
    courseCode: string;
    courseCategory: string;
    companyName: string;
    companyLogo: string | null;
    instructorName: string;
    sessionLocation: string;
    completionDate: string;
    score: number | null;
    grade: string | null;
    issuedBy: string;
    issuedAt: Date;
    verificationCode: string;
}

export function generateCertificateHTML(data: CertificateData): string {
    const photoSection = data.employeePhoto
        ? `<div class="photo-container">
               <img src="${data.employeePhoto}" alt="${data.employeeName}" class="employee-photo" />
           </div>`
        : `<div class="photo-placeholder">
               <span>${data.employeeName.split(" ").map(n => n[0]).join("")}</span>
           </div>`;

    const scoreSection = data.score
        ? `<div class="score-badge">
               <span class="score-label">Score</span>
               <span class="score-value">${data.score}%</span>
               <span class="grade">Grade: ${data.grade}</span>
           </div>`
        : "";

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 40px;
        }
        .certificate {
            background: white;
            max-width: 900px;
            margin: 0 auto;
            padding: 60px;
            border: 10px solid #1e40af;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            position: relative;
        }
        .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 2px solid #c3cfe2;
            pointer-events: none;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .company-name {
            font-size: 24px;
            color: #1e40af;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .certificate-title {
            font-size: 36px;
            color: #1e293b;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .certificate-subtitle {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .content {
            display: flex;
            align-items: center;
            gap: 40px;
            margin: 40px 0;
        }
        .photo-container, .photo-placeholder {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            overflow: hidden;
            border: 4px solid #1e40af;
            flex-shrink: 0;
        }
        .employee-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .photo-placeholder {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 48px;
            font-weight: bold;
        }
        .details {
            flex: 1;
        }
        .awarded-to {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 10px;
        }
        .employee-name {
            font-size: 32px;
            color: #1e293b;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .employee-code {
            font-size: 14px;
            color: #64748b;
        }
        .course-info {
            margin: 30px 0;
            padding: 20px;
            background: #f8fafc;
            border-left: 4px solid #1e40af;
        }
        .course-title {
            font-size: 24px;
            color: #1e40af;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .course-details {
            font-size: 14px;
            color: #64748b;
        }
        .score-badge {
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            text-align: center;
            margin: 20px 0;
        }
        .score-label {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            opacity: 0.9;
        }
        .score-value {
            display: block;
            font-size: 28px;
            font-weight: bold;
        }
        .grade {
            display: block;
            font-size: 12px;
            margin-top: 5px;
        }
        .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .signature {
            text-align: center;
        }
        .signature-line {
            border-top: 1px solid #94a3b8;
            width: 200px;
            margin: 40px 0 5px 0;
        }
        .signature-name {
            font-size: 14px;
            color: #1e293b;
            font-weight: bold;
        }
        .signature-title {
            font-size: 12px;
            color: #64748b;
        }
        .verification {
            text-align: center;
            font-size: 12px;
            color: #64748b;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
        }
        .cert-number {
            font-family: monospace;
            font-size: 14px;
            color: #1e40af;
            font-weight: bold;
        }
        .verification-code {
            font-family: monospace;
            font-size: 10px;
            color: #94a3b8;
        }
        .date {
            font-size: 14px;
            color: #64748b;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">
            ${data.companyLogo ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-height: 60px; margin-bottom: 10px;" />` : ""}
            <div class="company-name">${data.companyName}</div>
            <h1 class="certificate-title">Certificate of Completion</h1>
            <p class="certificate-subtitle">This is to certify that</p>
        </div>

        <div class="content">
            ${photoSection}
            <div class="details">
                <p class="awarded-to">Awarded to</p>
                <h2 class="employee-name">${data.employeeName}</h2>
                <p class="employee-code">Employee ID: ${data.employeeCode}</p>
            </div>
        </div>

        <div class="course-info">
            <div class="course-title">${data.courseTitle}</div>
            <p class="course-details">
                Course Code: ${data.courseCode} | Category: ${data.courseCategory}<br>
                Location: ${data.sessionLocation} | Instructor: ${data.instructorName}
            </p>
        </div>

        ${scoreSection}

        <div class="date">
            Completed on: ${new Date(data.completionDate).toLocaleDateString("en-US", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
            })}
        </div>

        <div class="footer">
            <div class="signature">
                <div class="signature-line"></div>
                <p class="signature-name">${data.issuedBy}</p>
                <p class="signature-title">Authorized Signatory</p>
            </div>
        </div>

        <div class="verification">
            <p>Certificate Number: <span class="cert-number">${data.certificateNumber}</span></p>
            <p>Verification Code: <span class="verification-code">${data.verificationCode}</span></p>
            <p>Verify this certificate at: /verify-certificate/${data.verificationCode}</p>
        </div>
    </div>
</body>
</html>`;
}

export async function getCertificateData(certificateId: string): Promise<CertificateData | null> {
    const certificate = await prisma.trainingCertificate.findUnique({
        where: { id: certificateId },
        include: {
            employee: true,
            course: true,
            tenant: true,
            issuedBy: true,
            enrollment: { include: { session: { include: { instructor: true } } } },
        },
    });

    if (!certificate) return null;

    const metadata = certificate.metadata as any;

    return {
        certificateNumber: certificate.certificateNumber,
        title: certificate.title,
        employeeName: `${certificate.employee.firstName} ${certificate.employee.lastName}`,
        employeeCode: certificate.employee.employeeCode || "N/A",
        employeePhoto: certificate.employeePhoto || certificate.employee.photo,
        courseTitle: certificate.course.title,
        courseCode: certificate.course.code,
        courseCategory: certificate.course.category,
        companyName: certificate.tenant.name,
        companyLogo: certificate.tenant.logoUrl,
        instructorName: metadata?.instructorName || "N/A",
        sessionLocation: metadata?.sessionLocation || "N/A",
        completionDate: metadata?.completionDate || certificate.issuedAt.toISOString(),
        score: certificate.score,
        grade: certificate.grade,
        issuedBy: certificate.issuedBy.name || "HR Department",
        issuedAt: certificate.issuedAt,
        verificationCode: certificate.verificationCode,
    };
}