import {
    getTrainingCourses,
    getTrainingSessions,
    getEnrollments,
    getCertificates,
    getEmployeesForTraining,
} from "@/app/lib/actions/training";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { TrainingClient } from "./training-client";

export default async function TrainingPage() {
    await requirePermission(PERMISSIONS.TRAINING_VIEW);

    const [courses, sessions, enrollments, certificates, employees] = await Promise.all([
        getTrainingCourses().catch(() => []),
        getTrainingSessions().catch(() => []),
        getEnrollments().catch(() => []),
        getCertificates().catch(() => []),
        getEmployeesForTraining().catch(() => []),
    ]);

    return (
        <TrainingClient
            courses={courses as any[]}
            sessions={sessions as any[]}
            enrollments={enrollments as any[]}
            certificates={certificates as any[]}
            employees={employees as any[]}
        />
    );
}
