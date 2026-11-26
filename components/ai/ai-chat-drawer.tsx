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
import { cn } from "@/lib/utils";

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
        "Show my latest salary breakdown",
        "Check my active loan or advance requests",
        "What training courses are available?",
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
                    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3.5 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-primary to-teal-600 text-primary-foreground font-black text-sm shadow-[0_10px_30px_rgba(0,180,166,0.4)] hover:shadow-[0_15px_35px_rgba(13,148,136,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-background/30 group cursor-pointer"
                    aria-label="Open iBoo HR Chatbot"
                >
                    {/* Chatbot Icon with animated online pulse dot */}
                    <div className="relative flex items-center justify-center h-8 w-8 rounded-xl bg-primary/20 backdrop-blur-md group-hover:bg-primary/30 transition-colors shadow-inner">
                        <Bot className="h-5 w-5 text-primary-foreground transition-transform group-hover:scale-110" />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-background"></span>
                        </span>
                    </div>
                    <div className="hidden sm:flex flex-col text-left leading-none pr-1">
                        <span className="font-black text-[13px] tracking-wide text-primary-foreground">iBoo AI</span>
                        <span className="text-[10px] font-bold text-emerald-300 mt-0.5">HR Chatbot</span>
                    </div>
                </button>
            )}

            {/* Chat Drawer / Modal */}
            {isOpen && (
                <div
                    className={cn("fixed z-50 transition-all duration-300", isExpanded
                        ? "inset-4 md:inset-10"
                        : "bottom-6 right-6 w-[92vw] sm:w-[440px] h-[640px] max-h-[88vh]"
                    )}
                >
                    <Card className="w-full h-full flex flex-col rounded-3xl shadow-2xl border border-border bg-background/95 dark:bg-card/95 backdrop-blur-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-900 via-primary/20 to-slate-900 border-b border-primary/20 text-foreground flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-md">
                                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-sm tracking-tight">iBoo AI Assistant</h3>
                                        <Badge className={cn("bg-primary/20 text-primary border-0 text-[9px] font-bold uppercase tracking-wider")}>
                                            Enterprise
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">Authorized for {userName || "User"} ({userRole || "Staff"})</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                                >
                                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="py-8 text-center px-4 space-y-4">
                                    <div className={cn("h-14 w-14 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary flex items-center justify-center mx-auto shadow-inner")}>
                                        <Bot className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-foreground text-base">How can I assist your HR operations?</h4>
                                        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                                            I am context-aware and strictly limited to your authorized company data.
                                        </p>
                                    </div>

                                    {/* Starter questions */}
                                    <div className="space-y-2 pt-2 text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Suggested inquiries:</p>
                                        {starterPrompts.map((prompt) => (
                                            <button
                                                key={prompt}
                                                onClick={() => sendMessage(prompt)}
                                                className={cn("w-full text-left p-2.5 rounded-xl text-xs font-semibold bg-muted/50 hover:bg-primary/10 dark:hover:bg-primary/20 text-foreground border border-border/60 transition-all flex items-center gap-2 cursor-pointer")}
                                            >
                                                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                                                <span className="truncate">{prompt}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {messages.map((m: ChatMessage) => (
                                <div
                                    key={m.id}
                                    className={cn("flex gap-3 text-sm", m.role === "user" ? "justify-end" : "justify-start")}
                                >
                                    {m.role !== "user" && (
                                        <div className={cn("h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-primary-foreground shrink-0 mt-0.5 shadow-sm")}>
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}

                                    <div
                                        className={cn("max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed whitespace-pre-wrap break-words", m.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted text-foreground border border-border/50 rounded-tl-sm"
                                        )}
                                    >
                                        {m.content}
                                    </div>

                                    {m.role === "user" && (
                                        <div className={cn("h-8 w-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground shrink-0 mt-0.5")}>
                                            <User className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex gap-3 items-center text-muted-foreground text-xs py-2 px-1">
                                    <div className={cn("h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center")}>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    </div>
                                    <span className="font-semibold">Retrieving authorized records and analyzing…</span>
                                </div>
                            )}

                            {error && (
                                <div className={cn("p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs flex items-center gap-2")}>
                                    <ShieldAlert className="h-4 w-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Footer */}
                        <form
                            onSubmit={handleFormSubmit}
                            className={cn("p-3 bg-muted/50 border-t border-border/60 flex items-center gap-2 flex-shrink-0")}
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask iBoo AI regarding leaves, expiries, policy..."
                                className="h-11 rounded-xl bg-background border-border text-xs font-medium focus-visible:ring-primary"
                                disabled={isLoading}
                            />
                            <Button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="h-11 w-11 rounded-xl bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-600/90 text-primary-foreground shrink-0 p-0 shadow-md cursor-pointer"
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