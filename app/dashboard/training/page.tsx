import { getTrainingCourses, getTrainingSessions, getEnrollments, getCertificates } from "@/app/lib/actions/training";
import { requirePermission } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function TrainingPage() {
    await requirePermission(PERMISSIONS.TRAINING_VIEW);
    
    const courses = await getTrainingCourses() as any[];
    const sessions = await getTrainingSessions() as any[];
    const enrollments = await getEnrollments() as any[];
    const certificates = await getCertificates() as any[];

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Training & Certification</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-700">Courses</h3>
                    <p className="text-2xl font-bold">{courses.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-700">Sessions</h3>
                    <p className="text-2xl font-bold">{sessions.length}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-700">Enrollments</h3>
                    <p className="text-2xl font-bold">{enrollments.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-700">Certificates</h3>
                    <p className="text-2xl font-bold">{certificates.length}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Training Courses</h2>
                <div className="space-y-4">
                    {courses.map((course) => (
                        <div key={course.id} className="border p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">{course.title}</h3>
                                    <p className="text-sm text-gray-600">{course.code} | {course.category} | {course.level}</p>
                                    <p className="text-sm text-gray-500 mt-1">{course.description}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm ${course.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                    {course.status}
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                {course._count.enrollments} enrollments | {course._count.sessions} sessions
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
                <div className="space-y-4">
                    {sessions.map((session) => (
                        <div key={session.id} className="border p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold">{session.title}</h3>
                                    <p className="text-sm text-gray-600">{session.course.title} ({session.course.code})</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(session.startDate).toLocaleDateString()} - {new Date(session.endDate).toLocaleDateString()}
                                        {session.location && ` | ${session.location}`}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Instructor: {session.instructor?.name || "TBA"} | {session._count.enrollments} enrolled
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm ${session.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" : session.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                                    {session.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Recent Certificates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {certificates.map((cert) => (
                        <div key={cert.id} className="border p-4 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                {cert.employee.photo ? (
                                    <img src={cert.employee.photo} alt={cert.employee.firstName} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                        {cert.employee.firstName[0]}{cert.employee.lastName[0]}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold">{cert.employee.firstName} {cert.employee.lastName}</p>
                                    <p className="text-sm text-gray-500">{cert.course.title}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-xs ${cert.status === "ISSUED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                    {cert.status}
                                </span>
                                <a href={`/api/training/certificate/${cert.id}`} target="_blank" className="text-blue-600 text-sm hover:underline">
                                    View Certificate
                                </a>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                {cert.certificateNumber} | {new Date(cert.issuedAt).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}