-- AlterTable
ALTER TABLE "RoleRequest" ADD COLUMN     "tenantId" TEXT;

-- CreateTable
CREATE TABLE "TrainingCourse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'BEGINNER',
    "durationHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxParticipants" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issuesCertificate" BOOLEAN NOT NULL DEFAULT true,
    "certificateTemplateId" TEXT,
    "tags" TEXT[],
    "provider" TEXT,
    "costPerParticipant" DOUBLE PRECISION DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "TrainingCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Dubai',
    "instructorId" TEXT,
    "maxParticipants" INTEGER,
    "meetingLink" TEXT,
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEnrollment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "assessmentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "feedback" TEXT,
    "certificateId" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "enrolledById" TEXT NOT NULL,

    CONSTRAINT "TrainingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAttendance" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "markedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCertificate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "courseId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "grade" TEXT,
    "score" DOUBLE PRECISION,
    "verificationCode" TEXT NOT NULL,
    "signatureHash" TEXT,
    "templateId" TEXT,
    "documentUrl" TEXT,
    "employeePhoto" TEXT,
    "metadata" JSONB,
    "issuedById" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCertificateTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'COURSE_COMPLETION',
    "htmlTemplate" TEXT NOT NULL,
    "cssStyles" TEXT,
    "placeholders" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TrainingCertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAssessment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MCQ',
    "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "timeLimitMinutes" INTEGER,
    "questions" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "TrainingAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingAssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "answers" JSONB,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "gradedById" TEXT,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingAssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSkill" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isCertifiable" BOOLEAN NOT NULL DEFAULT false,
    "proficiencyLevels" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTrainingSkill" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'BEGINNER',
    "source" TEXT NOT NULL DEFAULT 'SELF_ASSESSED',
    "enrollmentId" TEXT,
    "certificateId" TEXT,
    "assessedById" TEXT,
    "assessedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeTrainingSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CoursePrerequisites" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CoursePrerequisites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "TrainingCourse_tenantId_status_idx" ON "TrainingCourse"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TrainingCourse_tenantId_category_idx" ON "TrainingCourse"("tenantId", "category");

-- CreateIndex
CREATE INDEX "TrainingCourse_companyId_status_idx" ON "TrainingCourse"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCourse_tenantId_code_key" ON "TrainingCourse"("tenantId", "code");

-- CreateIndex
CREATE INDEX "TrainingSession_courseId_status_idx" ON "TrainingSession"("courseId", "status");

-- CreateIndex
CREATE INDEX "TrainingSession_tenantId_startDate_idx" ON "TrainingSession"("tenantId", "startDate");

-- CreateIndex
CREATE INDEX "TrainingSession_companyId_startDate_idx" ON "TrainingSession"("companyId", "startDate");

-- CreateIndex
CREATE INDEX "TrainingSession_instructorId_idx" ON "TrainingSession"("instructorId");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_employeeId_status_idx" ON "TrainingEnrollment"("employeeId", "status");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_courseId_status_idx" ON "TrainingEnrollment"("courseId", "status");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_tenantId_status_idx" ON "TrainingEnrollment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_companyId_status_idx" ON "TrainingEnrollment"("companyId", "status");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_approvalStatus_idx" ON "TrainingEnrollment"("approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingEnrollment_sessionId_employeeId_key" ON "TrainingEnrollment"("sessionId", "employeeId");

-- CreateIndex
CREATE INDEX "TrainingAttendance_sessionId_date_idx" ON "TrainingAttendance"("sessionId", "date");

-- CreateIndex
CREATE INDEX "TrainingAttendance_employeeId_date_idx" ON "TrainingAttendance"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAttendance_enrollmentId_date_key" ON "TrainingAttendance"("enrollmentId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCertificate_enrollmentId_key" ON "TrainingCertificate"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCertificate_certificateNumber_key" ON "TrainingCertificate"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCertificate_verificationCode_key" ON "TrainingCertificate"("verificationCode");

-- CreateIndex
CREATE INDEX "TrainingCertificate_tenantId_status_idx" ON "TrainingCertificate"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TrainingCertificate_employeeId_status_idx" ON "TrainingCertificate"("employeeId", "status");

-- CreateIndex
CREATE INDEX "TrainingCertificate_courseId_issuedAt_idx" ON "TrainingCertificate"("courseId", "issuedAt");

-- CreateIndex
CREATE INDEX "TrainingCertificate_verificationCode_idx" ON "TrainingCertificate"("verificationCode");

-- CreateIndex
CREATE INDEX "TrainingCertificate_certificateNumber_idx" ON "TrainingCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "TrainingCertificateTemplate_tenantId_type_idx" ON "TrainingCertificateTemplate"("tenantId", "type");

-- CreateIndex
CREATE INDEX "TrainingCertificateTemplate_tenantId_isDefault_idx" ON "TrainingCertificateTemplate"("tenantId", "isDefault");

-- CreateIndex
CREATE INDEX "TrainingAssessment_courseId_status_idx" ON "TrainingAssessment"("courseId", "status");

-- CreateIndex
CREATE INDEX "TrainingAssessment_tenantId_status_idx" ON "TrainingAssessment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "TrainingAssessmentAttempt_assessmentId_status_idx" ON "TrainingAssessmentAttempt"("assessmentId", "status");

-- CreateIndex
CREATE INDEX "TrainingAssessmentAttempt_employeeId_status_idx" ON "TrainingAssessmentAttempt"("employeeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingAssessmentAttempt_enrollmentId_attemptNumber_key" ON "TrainingAssessmentAttempt"("enrollmentId", "attemptNumber");

-- CreateIndex
CREATE INDEX "TrainingSkill_tenantId_category_idx" ON "TrainingSkill"("tenantId", "category");

-- CreateIndex
CREATE INDEX "TrainingSkill_isActive_idx" ON "TrainingSkill"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSkill_tenantId_name_key" ON "TrainingSkill"("tenantId", "name");

-- CreateIndex
CREATE INDEX "EmployeeTrainingSkill_employeeId_level_idx" ON "EmployeeTrainingSkill"("employeeId", "level");

-- CreateIndex
CREATE INDEX "EmployeeTrainingSkill_tenantId_level_idx" ON "EmployeeTrainingSkill"("tenantId", "level");

-- CreateIndex
CREATE INDEX "EmployeeTrainingSkill_expiresAt_idx" ON "EmployeeTrainingSkill"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTrainingSkill_employeeId_skillId_key" ON "EmployeeTrainingSkill"("employeeId", "skillId");

-- CreateIndex
CREATE INDEX "TrainingCategory_tenantId_isActive_idx" ON "TrainingCategory"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCategory_tenantId_name_key" ON "TrainingCategory"("tenantId", "name");

-- CreateIndex
CREATE INDEX "_CoursePrerequisites_B_index" ON "_CoursePrerequisites"("B");

-- CreateIndex
CREATE INDEX "RoleRequest_tenantId_idx" ON "RoleRequest"("tenantId");

-- AddForeignKey
ALTER TABLE "RoleRequest" ADD CONSTRAINT "RoleRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCourse" ADD CONSTRAINT "TrainingCourse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCourse" ADD CONSTRAINT "TrainingCourse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCourse" ADD CONSTRAINT "TrainingCourse_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCourse" ADD CONSTRAINT "TrainingCourse_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_enrolledById_fkey" FOREIGN KEY ("enrolledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAttendance" ADD CONSTRAINT "TrainingAttendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificate" ADD CONSTRAINT "TrainingCertificate_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificateTemplate" ADD CONSTRAINT "TrainingCertificateTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificateTemplate" ADD CONSTRAINT "TrainingCertificateTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCertificateTemplate" ADD CONSTRAINT "TrainingCertificateTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAssessment" ADD CONSTRAINT "TrainingAssessment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAssessment" ADD CONSTRAINT "TrainingAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAssessment" ADD CONSTRAINT "TrainingAssessment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAssessmentAttempt" ADD CONSTRAINT "TrainingAssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "TrainingAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAssessmentAttempt" ADD CONSTRAINT "TrainingAssessmentAttempt_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAssessmentAttempt" ADD CONSTRAINT "TrainingAssessmentAttempt_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingAssessmentAttempt" ADD CONSTRAINT "TrainingAssessmentAttempt_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSkill" ADD CONSTRAINT "TrainingSkill_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrainingSkill" ADD CONSTRAINT "EmployeeTrainingSkill_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrainingSkill" ADD CONSTRAINT "EmployeeTrainingSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "TrainingSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrainingSkill" ADD CONSTRAINT "EmployeeTrainingSkill_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrainingSkill" ADD CONSTRAINT "EmployeeTrainingSkill_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrainingSkill" ADD CONSTRAINT "EmployeeTrainingSkill_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "TrainingCertificate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTrainingSkill" ADD CONSTRAINT "EmployeeTrainingSkill_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingCategory" ADD CONSTRAINT "TrainingCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoursePrerequisites" ADD CONSTRAINT "_CoursePrerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoursePrerequisites" ADD CONSTRAINT "_CoursePrerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "TrainingCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
