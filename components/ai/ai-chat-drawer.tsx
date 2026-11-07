"use client";

import { useState, useRef, useEffect } from "react";
import {
    MessageSquareText, MessageCircle, Sparkles, X, Send, Bot, User, Minimize2,
    Maximize2, ShieldAlert, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
    userRole?: string | null;
    userName?: string | null;
}

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export function AIChatDrawer({ userRole, userName }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const isHR = ["SUPER_ADMIN", "ADMIN", "COMPANY_ADMIN", "HR_MANAGER", "HR"].includes(userRole || "");

    const starterPrompts = [
        "What is my leave balance?",
        ...(isHR
            ? ["Show employees with visas expiring in 60 days", "Summarize today's attendance"]
            : ["How do I request a salary certificate?"]),
    ];

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: text.trim(),
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Error ${res.status}: ${res.statusText}`);
            }

            const assistantId = (Date.now() + 1).toString();
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let accumulated = "";

            setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    accumulated += decoder.decode(value, { stream: true });
                    setMessages((prev) =>
                        prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
                    );
                }
            }
        } catch (err: unknown) {
            console.error("AI Assistant Error:", err);
            setError(err instanceof Error ? err.message : "Failed to execute AI request.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <>
            {/* Floating Chatbot Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3.5 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-teal-500 via-indigo-600 to-indigo-700 text-white font-black text-sm shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_35px_rgba(13,148,136,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white/30 group cursor-pointer"
                    aria-label="Open iBoo HR Chatbot"
                >
                    {/* Chatbot Icon with animated online pulse dot */}
                    <div className="relative flex items-center justify-center h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md group-hover:bg-white/30 transition-colors shadow-inner">
                        <Bot className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#0f172a]"></span>
                        </span>
                    </div>
                    <div className="hidden sm:flex flex-col text-left leading-none pr-1">
                        <span className="font-black text-[13px] tracking-wide text-white">iBoo AI</span>
                        <span className="text-[10px] font-bold text-teal-200 mt-0.5">HR Chatbot</span>
                    </div>
                </button>
            )}

            {/* Chat Drawer / Modal */}
            {isOpen && (
                <div
                    className={`fixed z-50 transition-all duration-300 ${
                        isExpanded
                            ? "inset-4 md:inset-10"
                            : "bottom-6 right-6 w-[92vw] sm:w-[440px] h-[640px] max-h-[88vh]"
                    }`}
                >
                    <Card className="w-full h-full flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-900/50 text-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-600 flex items-center justify-center shadow-md">
                                    <Sparkles className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-sm tracking-tight">iBoo AI Assistant</h3>
                                        <Badge className="bg-teal-500/20 text-teal-300 border-0 text-[9px] font-bold uppercase tracking-wider">
                                            Enterprise
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] text-slate-400">Authorized for {userName || "User"} ({userRole || "Staff"})</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                                >
                                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="py-8 text-center px-4 space-y-4">
                                    <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                                        <Bot className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white text-base">How can I assist your HR operations?</h4>
                                        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                                            I am context-aware and strictly limited to your authorized company data.
                                        </p>
                                    </div>

                                    {/* Starter questions */}
                                    <div className="space-y-2 pt-2 text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Suggested inquiries:</p>
                                        {starterPrompts.map((prompt) => (
                                            <button
                                                key={prompt}
                                                onClick={() => sendMessage(prompt)}
                                                className="w-full text-left p-2.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60 transition-all flex items-center gap-2 cursor-pointer"
                                            >
                                                <Sparkles className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                                                <span className="truncate">{prompt}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((m: ChatMessage) => (
                                <div
                                    key={m.id}
                                    className={`flex gap-3 text-sm ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {m.role !== "user" && (
                                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap break-words ${
                                            m.role === "user"
                                                ? "bg-indigo-600 text-white rounded-tr-sm"
                                                : "bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/50 dark:border-slate-800/50 rounded-tl-sm"
                                        }`}
                                    >
                                        {m.content}
                                    </div>

                                    {m.role === "user" && (
                                        <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                                            <User className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 items-center text-slate-500 text-xs py-2 px-1">
                                    <div className="h-7 w-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    </div>
                                    <span className="font-semibold">Retrieving authorized records and analyzing…</span>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Footer */}
                        <form
                            onSubmit={handleFormSubmit}
                            className="p-3 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center gap-2 flex-shrink-0"
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask iBoo AI regarding leaves, expiries, policy..."
                                className="h-11 rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-medium focus-visible:ring-indigo-500"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="h-11 w-11 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white shrink-0 p-0 shadow-md cursor-pointer"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </>
    );
}
