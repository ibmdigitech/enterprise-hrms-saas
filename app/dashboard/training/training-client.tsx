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
    Clock, ExternalLink, ShieldCheck, Users, Layers, AlertCircle, FileText,
    Sparkles
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
        <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
            {/* ── 1. Hero Banner Matching App Design System ──────────────────────── */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 sm:p-8 shadow-xl border border-slate-800">
                <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="min-w-0">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-300 backdrop-blur-md">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            Professional Development
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                            Training & Certification Academy
                        </h1>
                        <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-slate-300 max-w-2xl">
                            Enterprise curriculum management, employee skill progression, and verifiable credentials.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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
            </section>

            {/* ── 2. Metric KPI Overview Cards (Matching App Rounded KPI Style) ────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="group overflow-hidden rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Courses</CardTitle>
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <BookOpen className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{courses.length}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Available learning modules</p>
                    </CardContent>
                </Card>

                <Card className="group overflow-hidden rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Sessions</CardTitle>
                        <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                            <Calendar className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{activeSessions.length}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cohorts currently open or scheduled</p>
                    </CardContent>
                </Card>

                <Card className="group overflow-hidden rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Enrollments</CardTitle>
                        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{enrollments.length}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active team registrations</p>
                    </CardContent>
                </Card>

                <Card className="group overflow-hidden rounded-2xl border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Issued Certificates</CardTitle>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <Award className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{completedCertificates.length}</div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Digital credentials earned</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── 3. Tabbed Workspace Section ───────────────────────────────────── */}
            <Tabs defaultValue="courses" className="w-full space-y-6">
                <TabsList className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-1 rounded-2xl h-12 flex gap-1 w-full max-w-xl shadow-xs">
                    <TabsTrigger
                        value="courses"
                        className="flex-1 rounded-xl font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
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
                        className="flex-1 rounded-xl font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                    >
                        Enrollments ({enrollments.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="certificates"
                        className="flex-1 rounded-xl font-bold text-xs data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                    >
                        Certificates ({certificates.length})
                    </TabsTrigger>
                </TabsList>

                {/* ── Courses Tab ── */}
                <TabsContent value="courses" className="space-y-4 outline-none">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search courses by title or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCourses.length === 0 ? (
                            <div className="col-span-full p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/40">
                                <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">No training courses found</p>
                                <p className="text-slate-400 text-xs mt-1">Create your first course using the &quot;New Course&quot; button above.</p>
                            </div>
                        ) : (
                            filteredCourses.map((course) => (
                                <Card key={course.id} className="bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all flex flex-col justify-between rounded-2xl">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <Badge variant="outline" className="font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                                                {course.code}
                                            </Badge>
                                            <Badge
                                                className={`text-[10px] uppercase font-bold border-0 ${
                                                    course.status === "PUBLISHED"
                                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                }`}
                                            >
                                                {course.status}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white mt-2 leading-tight">
                                            {course.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                            {course.description || "Comprehensive modular workplace training program."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center justify-between">
                                                <span>Category:</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{course.category}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Level:</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{course.level || "Beginner"}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Duration:</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{course.durationHours || 0} Hours</span>
                                            </div>
                                            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 pt-1 font-bold">
                                                <span>Active Cohorts:</span>
                                                <span>{course._count?.sessions || 0} Sessions</span>
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
                    <Card className="bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/70 dark:bg-slate-850/50">
                                <TableRow className="border-slate-100 dark:border-slate-800">
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Session Title</TableHead>
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Course</TableHead>
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Dates</TableHead>
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Instructor / Location</TableHead>
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Enrolled</TableHead>
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                                            No training sessions scheduled yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sessions.map((sess) => (
                                        <TableRow key={sess.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                                            <TableCell className="font-bold text-xs text-slate-900 dark:text-white">
                                                {sess.title}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                                                {sess.course.title}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(sess.startDate).toLocaleDateString()} - {new Date(sess.endDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                                                {sess.instructor || sess.location || "Online"}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-900 dark:text-white">
                                                {sess._count?.enrollments || 0} / {sess.capacity || "∞"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    className={`text-[10px] uppercase font-bold border-0 ${
                                                        sess.status === "COMPLETED"
                                                            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                            : sess.status === "IN_PROGRESS"
                                                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                                                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                    }`}
                                                >
                                                    {sess.status}
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
                    <Card className="bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/70 dark:bg-slate-850/50">
                                <TableRow className="border-slate-100 dark:border-slate-800">
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Employee</TableHead>
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Course & Session</TableHead>
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Enrolled On</TableHead>
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs">Assessment Score</TableHead>
                                    <TableHead className="text-slate-600 dark:text-slate-300 font-bold text-xs text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrollments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-xs">
                                            No employee enrollments recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    enrollments.map((enr) => (
                                        <TableRow key={enr.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                                            <TableCell className="font-bold text-xs text-slate-900 dark:text-white">
                                                {enr.employee.firstName} {enr.employee.lastName}
                                                <span className="block text-[10px] text-slate-400 font-normal">
                                                    {enr.employee.employeeCode || enr.employee.department}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                                                {enr.course.title}
                                                <span className="block text-[10px] text-slate-400">
                                                    {enr.session.title}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(enr.enrolledAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-900 dark:text-white">
                                                {enr.score !== null && enr.score !== undefined ? `${enr.score}%` : "Pending"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge
                                                    className={`text-[10px] uppercase font-bold border-0 ${
                                                        enr.status === "COMPLETED"
                                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                            : enr.status === "ENROLLED"
                                                            ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                                                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
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
                            <div className="col-span-full p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/40">
                                <Award className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">No training certificates issued yet</p>
                                <p className="text-slate-400 text-xs mt-1">Complete an enrollment course assessment to issue verifiable certificates.</p>
                            </div>
                        ) : (
                            certificates.map((cert) => (
                                <Card key={cert.id} className="bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-xs hover:shadow-md flex flex-col justify-between rounded-2xl">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                                    <Award className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                                                        {cert.employee.firstName} {cert.employee.lastName}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                        {cert.employee.employeeCode || "EMP"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-0 text-[10px] font-bold">
                                                {cert.status}
                                            </Badge>
                                        </div>

                                        <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3">
                                            {cert.course.title}
                                        </CardTitle>
                                        <CardDescription className="text-xs font-mono text-slate-400">
                                            Cert ID: {cert.certificateNumber}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-400">
                                                Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                                            </span>
                                            <a
                                                href={`/api/training/certificate/${cert.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 transition-colors"
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
