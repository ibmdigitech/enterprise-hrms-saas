"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import { createTrainingCourse } from "@/app/lib/actions/training";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const CATEGORIES = [
    { value: "COMPLIANCE", label: "Compliance & Legal" },
    { value: "TECHNICAL", label: "Technical & IT" },
    { value: "MANAGEMENT", label: "Leadership & Management" },
    { value: "SAFETY", label: "Health & Safety (HSE)" },
    { value: "CUSTOMER_SERVICE", label: "Customer Service" },
    { value: "ONBOARDING", label: "New Hire Onboarding" },
];

const LEVELS = [
    { value: "BEGINNER", label: "Beginner" },
    { value: "INTERMEDIATE", label: "Intermediate" },
    { value: "ADVANCED", label: "Advanced" },
    { value: "EXPERT", label: "Expert / Specialized" },
];

export function CreateCourseDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        title: "",
        code: "",
        category: "COMPLIANCE",
        level: "BEGINNER",
        durationHours: 8,
        maxParticipants: 25,
        provider: "Internal HR Academy",
        costPerParticipant: 0,
        description: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.code.trim()) {
            toast.error("Please enter Course Title and Course Code");
            return;
        }

        try {
            setLoading(true);
            await createTrainingCourse({
                title: formData.title.trim(),
                code: formData.code.trim().toUpperCase(),
                category: formData.category,
                level: formData.level,
                durationHours: Number(formData.durationHours) || 0,
                maxParticipants: Number(formData.maxParticipants) || undefined,
                provider: formData.provider.trim() || undefined,
                costPerParticipant: Number(formData.costPerParticipant) || 0,
                description: formData.description.trim() || undefined,
            });

            toast.success("Training course created successfully");
            setOpen(false);
            setFormData({
                title: "",
                code: "",
                category: "COMPLIANCE",
                level: "BEGINNER",
                durationHours: 8,
                maxParticipants: 25,
                provider: "Internal HR Academy",
                costPerParticipant: 0,
                description: "",
            });
            router.refresh();
        } catch (err: any) {
            toast.error(err.message || "Failed to create training course");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white font-semibold shadow-md gap-2 rounded-xl">
                    <Plus className="h-4 w-4" />
                    New Course
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-white">Create Training Course</DialogTitle>
                            <DialogDescription className="text-slate-400 text-sm">
                                Define curriculum, duration, and target proficiency level for your workforce.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="title" className="text-xs font-semibold text-slate-300">Course Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g. Information Security Awareness"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-slate-800/80 border-slate-700 text-white"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="code" className="text-xs font-semibold text-slate-300">Course Code *</Label>
                            <Input
                                id="code"
                                placeholder="e.g. SEC-101"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="bg-slate-800/80 border-slate-700 text-white uppercase font-mono"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-300">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-300">Proficiency Level</Label>
                            <Select
                                value={formData.level}
                                onValueChange={(val) => setFormData({ ...formData, level: val })}
                            >
                                <SelectTrigger className="bg-slate-800/80 border-slate-700 text-white">
                                    <SelectValue placeholder="Select Level" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    {LEVELS.map((l) => (
                                        <SelectItem key={l.value} value={l.value}>
                                            {l.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="duration" className="text-xs font-semibold text-slate-300">Duration (Hours)</Label>
                            <Input
                                id="duration"
                                type="number"
                                min={1}
                                value={formData.durationHours}
                                onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) })}
                                className="bg-slate-800/80 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="maxp" className="text-xs font-semibold text-slate-300">Max Participants</Label>
                            <Input
                                id="maxp"
                                type="number"
                                min={1}
                                value={formData.maxParticipants}
                                onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                                className="bg-slate-800/80 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="cost" className="text-xs font-semibold text-slate-300">Cost per Seat (AED)</Label>
                            <Input
                                id="cost"
                                type="number"
                                min={0}
                                value={formData.costPerParticipant}
                                onChange={(e) => setFormData({ ...formData, costPerParticipant: Number(e.target.value) })}
                                className="bg-slate-800/80 border-slate-700 text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="provider" className="text-xs font-semibold text-slate-300">Training Provider</Label>
                        <Input
                            id="provider"
                            placeholder="e.g. Internal HR Academy / Udemy Business / PwC"
                            value={formData.provider}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                            className="bg-slate-800/80 border-slate-700 text-white"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description" className="text-xs font-semibold text-slate-300">Course Overview & Learning Outcomes</Label>
                        <Textarea
                            id="description"
                            rows={3}
                            placeholder="Describe prerequisites, key topics, and certification requirements..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-slate-800/80 border-slate-700 text-white"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Course
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
