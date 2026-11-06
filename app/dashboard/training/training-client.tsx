"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    GraduationCap, BookOpen, Calendar, Award, Search, CheckCircle2,
    Clock, ExternalLink, ShieldCheck, Users, Layers, AlertCircle, FileText
} from "lucide-react";
import { CreateCourseDialog } from "./create-course-dialog";
import { EnrollEmployeeDialog } from "./enroll-employee-dialog";

interface TrainingClientProps {
    courses: any[];
    sessions: any[];
    enrollments: any[];
    certificates: any[];
    employees: any[];
}

export function TrainingClient({
    courses,
    sessions,
    enrollments,
    certificates,
    employees,
}: TrainingClientProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("ALL");

    const filteredCourses = courses.filter((c) => {
        const matchesSearch =
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === "ALL" || c.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const activeSessions = sessions.filter((s) => s.status === "SCHEDULED" || s.status === "IN_PROGRESS");
    const completedCertificates = certificates.filter((c) => c.status === "ISSUED");

    return (
        <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
            {/* Header with Title & Action Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Training & Certification Academy
                            </h1>
                            <p className="text-slate-400 text-sm">
                                Enterprise curriculum management, employee skill progression, and verifiable credentials.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <EnrollEmployeeDialog
                        sessions={sessions.map((s) => ({
                            id: s.id,
                            title: s.title,
                            startDate: s.startDate,
                            endDate: s.endDate,
                            course: { title: s.course.title, code: s.course.code },
                        }))}
                        employees={employees}
                    />
                    <CreateCourseDialog />
                </div>
            </div>

            {/* Metric KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900/60 border-slate-800/60 backdrop-blur-md shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-teal-400">Total Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-teal-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{courses.length}</div>
                        <p className="text-xs text-slate-400 mt-1">Available learning modules</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800/60 backdrop-blur-md shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-400">Active Sessions</CardTitle>
                        <Calendar className="h-4 w-4 text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{activeSessions.length}</div>
                        <p className="text-xs text-slate-400 mt-1">Cohorts currently open or scheduled</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800/60 backdrop-blur-md shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-400">Total Enrollments</CardTitle>
                        <Users className="h-4 w-4 text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{enrollments.length}</div>
                        <p className="text-xs text-slate-400 mt-1">Active team registrations</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/60 border-slate-800/60 backdrop-blur-md shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-400">Issued Certificates</CardTitle>
                        <Award className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-white">{completedCertificates.length}</div>
                        <p className="text-xs text-slate-400 mt-1">Digital credentials earned</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabbed Workspace Section */}
            <Tabs defaultValue="courses" className="w-full space-y-6">
                <TabsList className="bg-slate-900/80 border border-slate-800 p-1 rounded-2xl h-12 flex gap-1 w-full max-w-xl">
                    <TabsTrigger
                        value="courses"
                        className="flex-1 rounded-xl font-bold text-xs data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all"
                    >
                        Courses ({courses.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="sessions"
                        className="flex-1 rounded-xl font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                    >
                        Sessions ({sessions.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="enrollments"
                        className="flex-1 rounded-xl font-bold text-xs data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all"
                    >
                        Enrollments ({enrollments.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="certificates"
                        className="flex-1 rounded-xl font-bold text-xs data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all"
                    >
                        Certificates ({certificates.length})
                    </TabsTrigger>
                </TabsList>

                {/* ── Courses Tab ── */}
                <TabsContent value="courses" className="space-y-4 outline-none">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Search courses by title or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-slate-900 border-slate-800 text-white rounded-xl text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCourses.length === 0 ? (
                            <div className="col-span-full p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                                <BookOpen className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-slate-400 font-semibold text-sm">No training courses found</p>
                                <p className="text-slate-500 text-xs mt-1">Create your first course using the "New Course" button above.</p>
                            </div>
                        ) : (
                            filteredCourses.map((course) => (
                                <Card key={course.id} className="bg-slate-900/60 border-slate-800/80 hover:border-teal-500/30 transition-all shadow-md flex flex-col justify-between">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <Badge variant="outline" className="font-mono text-[10px] bg-slate-800 text-teal-400 border-slate-700">
                                                {course.code}
                                            </Badge>
                                            <Badge
                                                className={`text-[10px] uppercase font-bold border-0 ${
                                                    course.status === "PUBLISHED"
                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                        : "bg-slate-700 text-slate-300"
                                                }`}
                                            >
                                                {course.status}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base font-bold text-white mt-2 leading-tight">
                                            {course.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1">
                                            {course.description || "Comprehensive modular workplace training program."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs text-slate-400">
                                            <div className="flex items-center justify-between">
                                                <span>Category:</span>
                                                <span className="font-semibold text-slate-200">{course.category}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Level:</span>
                                                <span className="font-semibold text-slate-200">{course.level || "Beginner"}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Duration:</span>
                                                <span className="font-semibold text-slate-200">{course.durationHours || 0} Hours</span>
                                            </div>
                                            <div className="flex items-center justify-between text-teal-400 pt-1">
                                                <span>Active Cohorts:</span>
                                                <span className="font-bold">{course._count?.sessions || 0} Sessions</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* ── Sessions Tab ── */}
                <TabsContent value="sessions" className="space-y-4 outline-none">
                    <Card className="bg-slate-900/60 border-slate-800/80 shadow-xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-800/50">
                                <TableRow className="border-slate-800">
                                    <TableHead className="text-slate-300 font-bold text-xs">Session Title</TableHead>
                                    <TableHead className="text-slate-300 font-bold text-xs">Course</TableHead>
                                    <TableHead className="text-slate-300 font-bold text-xs">Dates</TableHead>
                                    <TableHead className="text-slate-300 font-bold text-xs">Instructor / Location</TableHead>
                                    <TableHead className="text-slate-300 font-bold text-xs">Enrolled</TableHead>
                                    <TableHead className="text-slate-300 font-bold text-xs text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-slate-500 text-xs">
                                            No training sessions scheduled.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sessions.map((session) => (
                                        <TableRow key={session.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                            <TableCell className="font-semibold text-white text-xs">
                                                {session.title}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-300">
                                                <span className="font-mono text-indigo-400 mr-1.5">{session.course.code}</span>
                                                {session.course.title}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-400">
                                                {new Date(session.startDate).toLocaleDateString()} – {new Date(session.endDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-400">
                                                {session.instructor?.name || "Assigned Trainer"} {session.location ? `• ${session.location}` : ""}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-200">
                                                {session._count?.enrollments || 0} participants
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    className={`text-[10px] uppercase font-bold border-0 ${
                                                        session.status === "SCHEDULED"
                                                            ? "bg-indigo-500/20 text-indigo-400"
                                                            : session.status === "COMPLETED"
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : "bg-slate-700 text-slate-300"
                                                    }`}
                                                >
                                                    {session.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* ── Enrollments Tab ── */}
                <TabsContent value="enrollments" className="space-y-4 outline-none">
                    <Card className="bg-slate-900/60 border-slate-800/80 shadow-xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-800/50">
                                <TableRow className="border-slate-800">
                                    <TableHead className="text-slate-300 font-bold text-xs">Employee</TableHead>
                                    <TableHead className="text-slate-300 font-bold text-xs">Course & Session</TableHead>
                                    <TableHead className="text-slate-300 font-bold text-xs">Enrolled Date</TableHead>
                                    <TableHead className="text-slate-300 font-bold text-xs">Score / Grade</TableHead>
                                    <TableHead className="text-slate-300 font-bold text-xs text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrollments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-slate-500 text-xs">
                                            No employee enrollments recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    enrollments.map((enr) => (
                                        <TableRow key={enr.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-7 w-7 rounded-full bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center text-xs">
                                                        {enr.employee.firstName[0]}{enr.employee.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white text-xs leading-none">
                                                            {enr.employee.firstName} {enr.employee.lastName}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                            {enr.employee.employeeCode || "EMP"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-300">
                                                <span className="font-semibold text-white">{enr.course.title}</span>
                                                <span className="text-slate-500 block text-[11px]">{enr.session?.title || "Standard Session"}</span>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-400">
                                                {new Date(enr.enrolledAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-200">
                                                {enr.score !== null && enr.score !== undefined ? `${enr.score}%` : "Pending"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    className={`text-[10px] uppercase font-bold border-0 ${
                                                        enr.status === "COMPLETED"
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : enr.status === "ENROLLED"
                                                            ? "bg-teal-500/20 text-teal-400"
                                                            : "bg-amber-500/20 text-amber-400"
                                                    }`}
                                                >
                                                    {enr.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* ── Certificates Tab ── */}
                <TabsContent value="certificates" className="space-y-4 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {certificates.length === 0 ? (
                            <div className="col-span-full p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                                <Award className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                                <p className="text-slate-400 font-semibold text-sm">No training certificates issued yet</p>
                                <p className="text-slate-500 text-xs mt-1">Complete an enrollment course assessment to issue verifiable certificates.</p>
                            </div>
                        ) : (
                            certificates.map((cert) => (
                                <Card key={cert.id} className="bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/30 transition-all shadow-md flex flex-col justify-between">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                                                    <Award className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white leading-none">
                                                        {cert.employee.firstName} {cert.employee.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                        {cert.employee.employeeCode || "EMP"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px] font-bold">
                                                {cert.status}
                                            </Badge>
                                        </div>

                                        <CardTitle className="text-sm font-bold text-slate-200 mt-3">
                                            {cert.course.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs font-mono text-slate-500">
                                            Cert ID: {cert.certificateNumber}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-400">
                                                Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                                            </span>
                                            <a
                                                href={`/api/training/certificate/${cert.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                                            >
                                                View PDF <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
