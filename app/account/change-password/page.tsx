"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, KeyRound, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { changePassword } from "@/lib/actions/change-password";

interface PasswordCheck {
    ok: boolean;
    problems: string[];
}

function checkPasswordStrength(password: string): PasswordCheck {
    const problems: string[] = [];
    if (password.length < 12) problems.push("Must be at least 12 characters");
    if (password.length > 128) problems.push("Must be at most 128 characters");
    if (!/[a-z]/.test(password)) problems.push("Must contain a lowercase letter");
    if (!/[A-Z]/.test(password)) problems.push("Must contain an uppercase letter");
    if (!/\d/.test(password)) problems.push("Must contain a digit");
    if (!/[^A-Za-z0-9]/.test(password)) problems.push("Must contain a symbol");
    if (password.toLowerCase() === "password123") {
        problems.push("This password is already in use elsewhere in the system");
    }
    return { ok: problems.length === 0, problems };
}

const RULES = [
    { id: "length", label: "At least 12 characters", test: (p: string) => p.length >= 12 },
    { id: "lower", label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { id: "upper", label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { id: "digit", label: "A digit", test: (p: string) => /\d/.test(p) },
    { id: "symbol", label: "A symbol", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ChangePasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const strength = checkPasswordStrength(newPassword);
    const matches = newPassword.length > 0 && newPassword === confirmPassword;

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        if (!currentPassword) {
            setError("Current password is required.");
            return;
        }

        if (!strength.ok) {
            setError(strength.problems.join(". "));
            return;
        }
        if (!matches) {
            setError("The two new passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("email", email);
            formData.append("currentPassword", currentPassword);
            formData.append("newPassword", newPassword);

            const result = await changePassword(formData);

            if (result.error) {
                setError(result.error);
                setSubmitting(false);
                return;
            }

            // Sign in with the new password to create a session
            const signInResult = await signIn("credentials", {
                email,
                password: newPassword,
                redirect: false,
            });

            if (signInResult?.error) {
                setError("Password changed but sign-in failed. Please sign in manually at /login.");
                setSubmitting(false);
                return;
            }

            router.push("/dashboard");
        } catch (err) {
            console.error("[CHANGE_PASSWORD_ERROR]", err);
            setError("Could not change password. Please try again.");
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 py-16">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-2xl bg-indigo-100 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
                            <KeyRound className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <CardTitle className="text-xl font-black">Change your password</CardTitle>
                    <CardDescription className="mt-2">
                        Your account requires a password change before you can continue.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-5" noValidate>
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Current password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 font-bold pr-11"
                                    placeholder="Enter your current one-time password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none p-1"
                                    title={showCurrentPassword ? "Hide password" : "Show password"}
                                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                                >
                                    {showCurrentPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                New password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="newPassword"
                                    name="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    aria-describedby="password-rules"
                                    className={cn(
                                        "h-12 rounded-xl bg-slate-50 dark:bg-slate-900 font-bold pr-11",
                                        newPassword.length > 0 && !strength.ok &&
                                            "border-rose-400 dark:border-rose-500 focus-visible:ring-rose-500"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword((prev) => !prev)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none p-1"
                                    title={showNewPassword ? "Hide password" : "Show password"}
                                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Live rule checklist */}
                        <ul id="password-rules" className="space-y-1.5" aria-live="polite">
                            {RULES.map((rule) => {
                                const met = rule.test(newPassword);
                                return (
                                    <li
                                        key={rule.id}
                                        className={cn(
                                            "flex items-center gap-2 text-xs font-bold",
                                            met ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                                        )}
                                    >
                                        {met ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                        ) : (
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                        )}
                                        {rule.label}
                                        <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Confirm new password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    aria-invalid={confirmPassword.length > 0 && !matches ? "true" : undefined}
                                    className={cn(
                                        "h-12 rounded-xl bg-slate-50 dark:bg-slate-900 font-bold pr-11",
                                        confirmPassword.length > 0 && !matches &&
                                            "border-rose-400 dark:border-rose-500 focus-visible:ring-rose-500"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none p-1"
                                    title={showConfirmPassword ? "Hide password" : "Show password"}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && !matches && (
                                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Passwords do not match</p>
                            )}
                        </div>

                        {error && (
                            <p role="alert" className="flex items-start gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            disabled={submitting}
                            aria-busy={submitting}
                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 font-black uppercase text-xs tracking-widest"
                        >
                            {submitting ? "Saving…" : "Change password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
