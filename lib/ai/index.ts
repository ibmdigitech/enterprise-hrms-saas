"use server";

import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { logSecurityEvent, SECURITY_ACTION } from "@/lib/auth/audit";
import { resolveAIProvider } from "@/lib/ai/provider";

export interface AIConfig {
    enabled: boolean;
    provider: "openai" | "anthropic" | "gemini" | "vertex";
    model: string;
    features: {
        smartSummaries: boolean;
        autoLetterDrafting: boolean;
        leavePolicyAssistant: boolean;
        payrollAnomalyDetection: boolean;
        employeeInsights: boolean;
        recruitmentScreening: boolean;
        attendancePatternAnalysis: boolean;
        complianceAdvisor: boolean;
    };
    limits: {
        monthlyTokens: number;
        monthlyRequests: number;
    };
}

export interface AIUsage {
    tokensUsed: number;
    requestsMade: number;
    tokensLimit: number;
    requestsLimit: number;
    remainingTokens: number;
    remainingRequests: number;
}

async function getCompanyAIConfig(): Promise<AIConfig | null> {
    const subscription = await prisma.companySubscription.findFirst({
        where: { status: { in: ["ACTIVE", "TRIAL"] } },
        include: { plan: true }
    });

    if (!subscription?.plan?.features) return null;

    const features = subscription.plan.features as Record<string, unknown>;
    const aiConfig = features.ai as Record<string, unknown> | undefined;

    if (!aiConfig?.enabled) return null;

    const aiFeatures = (aiConfig.features as Record<string, boolean>) || {};
    const aiLimits = (aiConfig.limits as Record<string, number>) || {};

    return {
        enabled: true,
        provider: (aiConfig.provider as AIConfig["provider"]) || "openai",
        model: (aiConfig.model as string) || "gpt-4o-mini",
        features: {
            smartSummaries: aiFeatures.smartSummaries === true,
            autoLetterDrafting: aiFeatures.autoLetterDrafting === true,
            leavePolicyAssistant: aiFeatures.leavePolicyAssistant === true,
            payrollAnomalyDetection: aiFeatures.payrollAnomalyDetection === true,
            employeeInsights: aiFeatures.employeeInsights === true,
            recruitmentScreening: aiFeatures.recruitmentScreening === true,
            attendancePatternAnalysis: aiFeatures.attendancePatternAnalysis === true,
            complianceAdvisor: aiFeatures.complianceAdvisor === true,
        },
        limits: {
            monthlyTokens: aiLimits.monthlyTokens || 0,
            monthlyRequests: aiLimits.monthlyRequests || 0,
        }
    };
}

async function getCurrentUsage(): Promise<AIUsage> {
    const config = await getCompanyAIConfig();
    if (!config) {
        return { tokensUsed: 0, requestsMade: 0, tokensLimit: 0, requestsLimit: 0, remainingTokens: 0, remainingRequests: 0 };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usageLogs = await prisma.subscriptionUsageLog.findMany({
        where: {
            subscriptionId: (await prisma.companySubscription.findFirst({
                where: { status: { in: ["ACTIVE", "TRIAL"] } }
            }))?.id,
            featureKey: "ai",
            createdAt: { gte: startOfMonth, lte: endOfMonth }
        }
    });

    const tokensUsed = usageLogs.reduce((sum, log) => {
        const meta = log.metadata as Record<string, unknown> | null;
        return sum + (meta?.tokens as number || 0);
    }, 0);
    const requestsMade = usageLogs.length;

    return {
        tokensUsed,
        requestsMade,
        tokensLimit: config.limits.monthlyTokens,
        requestsLimit: config.limits.monthlyRequests,
        remainingTokens: Math.max(0, config.limits.monthlyTokens - tokensUsed),
        remainingRequests: Math.max(0, config.limits.monthlyRequests - requestsMade)
    };
}

async function checkAILimits(feature: string): Promise<{ allowed: boolean; reason?: string }> {
    const config = await getCompanyAIConfig();
    if (!config) return { allowed: false, reason: "AI not enabled for current plan" };

    if (!config.features[feature as keyof typeof config.features]) {
        return { allowed: false, reason: `Feature ${feature} not enabled in current plan` };
    }

    const usage = await getCurrentUsage();
    if (usage.requestsMade >= usage.requestsLimit) {
        return { allowed: false, reason: "Monthly request limit reached" };
    }
    if (usage.tokensUsed >= usage.tokensLimit) {
        return { allowed: false, reason: "Monthly token limit reached" };
    }

    return { allowed: true };
}

async function recordAIUsage(tokens: number, feature: string, metadata: Record<string, unknown> = {}) {
    const subscription = await prisma.companySubscription.findFirst({
        where: { status: { in: ["ACTIVE", "TRIAL"] } }
    });

if (subscription) {
        await prisma.subscriptionUsageLog.create({
            data: {
                subscriptionId: subscription.id,
                featureKey: "ai",
                tokensUsed: tokens,
                requestsCount: 1,
                periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
                metadata: { tokens, ...metadata }
            }
        });
    }
}

export async function generateSmartSummary(content: string, type: "leave" | "payroll" | "employee" | "attendance" | "recruitment"): Promise<{ summary: string; tokensUsed: number } | { error: string }> {
    const session = await getSessionUser();
    if (!session.ok) return { error: "Authentication required" };

    const { resolvePermissions, PERMISSIONS: PERMS } = await import("@/lib/auth/permissions");
    const userPerms = resolvePermissions(session.user.role);
    
    if (!userPerms.permissions.has(PERMS.EMPLOYEES_VIEW)) {
        return { error: "Insufficient permissions" };
    }

    const allowed = await checkAILimits("smartSummaries");
    if (!allowed.allowed) return { error: allowed.reason || "AI limit reached" };

    const config = await getCompanyAIConfig();
    if (!config) return { error: "AI not configured" }

    try {
        const prompt = buildSummaryPrompt(content, type);
        const { summary, tokens } = await callAIProvider(config.provider, config.model, prompt);

        await recordAIUsage(tokens, "smartSummary", { type, contentLength: content.length });

        return { summary, tokensUsed: tokens };
    } catch (error) {
        console.error("[AI_SUMMARY_ERROR]", error);
        return { error: "Failed to generate summary" };
    }
}

export async function generateLetterDraft(type: string, context: Record<string, unknown>): Promise<{ draft: string; tokensUsed: number } | { error: string }> {
    const session = await getSessionUser();
    if (!session.ok) return { error: "Authentication required" };

    const allowed = await checkAILimits("autoLetterDrafting");
    if (!allowed.allowed) return { error: allowed.reason || "AI limit reached" };

    const config = await getCompanyAIConfig();
    if (!config) return { error: "AI not configured" }

    try {
        const prompt = buildLetterPrompt(type, context);
        const { summary, tokens } = await callAIProvider(config.provider, config.model, prompt);

        await recordAIUsage(tokens, "autoLetterDrafting", { type });

        return { draft: summary, tokensUsed: tokens };
    } catch (error) {
        console.error("[AI_LETTER_ERROR]", error);
        return { error: "Failed to generate letter draft" };
    }
}

export async function getLeavePolicyAnswer(question: string): Promise<{ answer: string; tokensUsed: number } | { error: string }> {
    const session = await getSessionUser();
    if (!session.ok) return { error: "Authentication required" };

    const allowed = await checkAILimits("leavePolicyAssistant");
    if (!allowed.allowed) return { error: allowed.reason || "AI limit reached" };

    const config = await getCompanyAIConfig();
    if (!config) return { error: "AI not configured" }

    try {
        const prompt = `You are an HR assistant. Answer the following leave policy question based on UAE labor law and standard HR practices.

Question: ${question}

Provide a clear, concise answer with relevant article references if applicable.`;
        const { summary, tokens } = await callAIProvider(config.provider, config.model, prompt);

        await recordAIUsage(tokens, "leavePolicyAssistant", { questionLength: question.length });

        return { answer: summary, tokensUsed: tokens };
    } catch (error) {
        console.error("[AI_LEAVE_POLICY_ERROR]", error);
        return { error: "Failed to get answer" };
    }
}

export async function detectPayrollAnomalies(payrollData: unknown[]): Promise<{ anomalies: string[]; tokensUsed: number } | { error: string }> {
    const session = await getSessionUser();
    if (!session.ok) return { error: "Authentication required" };

    const allowed = await checkAILimits("payrollAnomalyDetection");
    if (!allowed.allowed) return { error: allowed.reason || "AI limit reached" };

    const config = await getCompanyAIConfig();
    if (!config) return { error: "AI not configured" }

    try {
        const prompt = `Analyze the following payroll data for anomalies, unusual patterns, or potential errors:

${JSON.stringify(payrollData, null, 2)}

Identify:
1. Unusual salary amounts compared to role/department norms
2. Missing or duplicate entries
3. Overtime anomalies
4. Deduction irregularities
5. Any compliance concerns

Return a JSON array of anomaly descriptions.`;
        const { summary, tokens } = await callAIProvider(config.provider, config.model, prompt);

        await recordAIUsage(tokens, "payrollAnomalyDetection", { recordsAnalyzed: payrollData.length });

        try {
            const anomalies = JSON.parse(summary);
            return { anomalies, tokensUsed: tokens };
        } catch {
            return { anomalies: [summary], tokensUsed: tokens };
        }
    } catch (error) {
        console.error("[AI_PAYROLL_ANOMALY_ERROR]", error);
        return { error: "Failed to detect anomalies" };
    }
}

export async function getEmployeeInsights(employeeId: string): Promise<{ insights: string; tokensUsed: number } | { error: string }> {
    const session = await getSessionUser();
    if (!session.ok) return { error: "Authentication required" };

    const allowed = await checkAILimits("employeeInsights");
    if (!allowed.allowed) return { error: allowed.reason || "AI limit reached" };

    const config = await getCompanyAIConfig();
    if (!config) return { error: "AI not configured" }

    try {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                leaveBalances: true,
                attendance: { take: 30, orderBy: { date: "desc" } },
                leaveRequests: { take: 20, orderBy: { createdAt: "desc" } },
                salaryRecords: { take: 12, orderBy: { year: "desc" } }
            }
        });

        if (!employee) return { error: "Employee not found" };

        const prompt = `Analyze the following employee data and provide insights on performance, engagement, and retention risk:

Employee: ${employee.firstName} ${employee.lastName}
Department: ${employee.department}
Designation: ${employee.designation}
Joining Date: ${employee.joiningDate}
Leave Balances: ${JSON.stringify(employee.leaveBalances)}
Recent Attendance (30 days): ${JSON.stringify(employee.attendance.map(a => ({ date: a.date, status: a.status, lateMinutes: a.lateMinutes })))}
Recent Leave Requests: ${JSON.stringify(employee.leaveRequests.map(l => ({ type: l.type, start: l.startDate, end: l.endDate, status: l.status })))}
Salary History: ${JSON.stringify(employee.salaryRecords.map(s => ({ month: s.month, year: s.year, net: s.netSalary })))}

Provide insights on:
1. Attendance patterns and punctuality
2. Leave usage trends
3. Compensation trajectory
4. Retention risk indicators
5. Recommendations for manager

Return as structured JSON.`;
        const { summary, tokens } = await callAIProvider(config.provider, config.model, prompt);

        await recordAIUsage(tokens, "employeeInsights", { employeeId });

        return { insights: summary, tokensUsed: tokens };
    } catch (error) {
        console.error("[AI_EMPLOYEE_INSIGHTS_ERROR]", error);
        return { error: "Failed to generate insights" };
    }
}

export async function screenCandidate(candidateData: unknown): Promise<{ screening: string; tokensUsed: number } | { error: string }> {
    const session = await getSessionUser();
    if (!session.ok) return { error: "Authentication required" };

    const allowed = await checkAILimits("recruitmentScreening");
    if (!allowed.allowed) return { error: allowed.reason || "AI limit reached" };

    const config = await getCompanyAIConfig();
    if (!config) return { error: "AI not configured" }

    try {
        const prompt = `Screen the following candidate profile for a job position:

${JSON.stringify(candidateData, null, 2)}

Provide:
1. Skills match assessment
2. Experience relevance
3. Red flags or concerns
4. Interview question suggestions
5. Overall recommendation (Strong Fit / Good Fit / Consider with Reservations / Not Recommended)

Return as structured JSON.`;
        const { summary, tokens } = await callAIProvider(config.provider, config.model, prompt);

        await recordAIUsage(tokens, "recruitmentScreening", { candidateId: (candidateData as Record<string, unknown>)?.id as string });

        return { screening: summary, tokensUsed: tokens };
    } catch (error) {
        console.error("[AI_CANDIDATE_SCREENING_ERROR]", error);
        return { error: "Failed to screen candidate" };
    }
}

export async function analyzeAttendancePatterns(employeeId?: string): Promise<{ analysis: string; tokensUsed: number } | { error: string }> {
    const session = await getSessionUser();
    if (!session.ok) return { error: "Authentication required" };

    const allowed = await checkAILimits("attendancePatternAnalysis");
    if (!allowed.allowed) return { error: allowed.reason || "AI limit reached" };

    const config = await getCompanyAIConfig();
    if (!config) return { error: "AI not configured" }

    try {
        const where = employeeId ? { employeeId } : {};
        const attendance = await prisma.attendance.findMany({
            where,
            take: 500,
            orderBy: { date: "desc" },
            include: { employee: { select: { firstName: true, lastName: true, department: true } } }
        });

        const prompt = `Analyze the following attendance data for patterns:

${JSON.stringify(attendance.map(a => ({
    employee: `${a.employee.firstName} ${a.employee.lastName}`,
    department: a.employee.department,
    date: a.date,
    status: a.status,
    checkIn: a.checkIn,
    checkOut: a.checkOut,
    lateMinutes: a.lateMinutes,
    overtimeMinutes: a.overtimeMinutes
})), null, 2)}

Identify:
1. Department-level attendance trends
2. Chronic latecomers
3. Absence patterns
4. Overtime patterns
5. Seasonal/weekly patterns
6. Recommendations for HR

Return as structured JSON.`;
        const { summary, tokens } = await callAIProvider(config.provider, config.model, prompt);

        await recordAIUsage(tokens, "attendancePatternAnalysis", { recordsAnalyzed: attendance.length });

        return { analysis: summary, tokensUsed: tokens };
    } catch (error) {
        console.error("[AI_ATTENDANCE_ANALYSIS_ERROR]", error);
        return { error: "Failed to analyze attendance" };
    }
}

export async function getComplianceAdvice(topic: string, context: Record<string, unknown>): Promise<{ advice: string; tokensUsed: number } | { error: string }> {
    const session = await getSessionUser();
    if (!session.ok) return { error: "Authentication required" };

    const allowed = await checkAILimits("complianceAdvisor");
    if (!allowed.allowed) return { error: allowed.reason || "AI limit reached" };

    const config = await getCompanyAIConfig();
    if (!config) return { error: "AI not configured" }

    try {
        const prompt = `You are a UAE labor law compliance advisor. Provide guidance on:

Topic: ${topic}
Context: ${JSON.stringify(context, null, 2)}

Provide:
1. Relevant UAE labor law articles
2. Compliance requirements
3. Recommended actions
4. Risk assessment
5. Documentation needed

Return as structured JSON with citations.`;
        const { summary, tokens } = await callAIProvider(config.provider, config.model, prompt);

        await recordAIUsage(tokens, "complianceAdvisor", { topic });

        return { advice: summary, tokensUsed: tokens };
    } catch (error) {
        console.error("[AI_COMPLIANCE_ERROR]", error);
        return { error: "Failed to get compliance advice" };
    }
}

function buildSummaryPrompt(content: string, type: string): string {
    const typePrompts: Record<string, string> = {
        leave: "Summarize this leave request for a manager's quick review. Include: employee name, leave type, dates, reason, and any concerns.",
        payroll: "Summarize this payroll record for review. Include: employee, period, gross/net, key components, and any anomalies.",
        employee: "Summarize this employee profile for HR. Include: name, role, department, tenure, key metrics, and status.",
        attendance: "Summarize this attendance record. Include: employee, period, present/absent/late days, overtime, and patterns.",
        recruitment: "Summarize this candidate application. Include: name, role applied, experience, skills match, and recommendation."
    };

    return `${typePrompts[type] || "Summarize this content for quick review."}

Content:
${content}

Return a concise professional summary (max 3 sentences).`;
}

function buildLetterPrompt(type: string, context: Record<string, unknown>): string {
    const typeTemplates: Record<string, string> = {
        OFFER: "Draft a professional offer letter for the UAE market. Include: position, salary, benefits, start date, probation, and acceptance terms.",
        APPOINTMENT: "Draft an appointment letter confirming employment details after probation.",
        RELIEVING: "Draft a relieving letter for an employee who has resigned.",
        NOC: "Draft a No Objection Certificate for visa/personal purposes.",
        SALARY_CERTIFICATE: "Draft a salary certificate for bank/visa purposes.",
        EXPERIENCE: "Draft an experience certificate.",
        WARNING: "Draft a formal warning letter for policy violation.",
        TERMINATION: "Draft a termination letter with UAE labor law compliance."
    };

    return `${typeTemplates[type] || "Draft a professional HR letter."}

Context:
${JSON.stringify(context, null, 2)}

Return a complete, professional letter ready for review.`;
}

async function callAIProvider(provider: string, model: string, prompt: string): Promise<{ summary: string; tokens: number }> {
    // Use resolveAIProvider as the single source of truth for API key selection.
    // This prevents duplicate provider implementations between index.ts and provider.ts.
    const resolved = resolveAIProvider();
    if (!resolved) {
        throw new Error("No AI provider API key configured");
    }

    // Use the resolved provider's API key. If the configured provider matches
    // the resolved one, use the configured model; otherwise fall back to the
    // resolved provider's default model.
    const apiKey = resolved.apiKey;
    const effectiveProvider = resolved.provider;
    const effectiveModel = (effectiveProvider === provider) ? model : resolved.modelName;

    let response: Response;
    let tokens = 0;

    switch (effectiveProvider) {
        case "openai":
            response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: effectiveModel,
                    messages: [
                        { role: "system", content: "You are an expert HR assistant for a UAE-based company." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                })
            });
            if (response.ok) {
                const data = await response.json();
                tokens = data.usage?.total_tokens || 0;
                return { summary: data.choices[0]?.message?.content || "", tokens };
            }
            throw new Error(`OpenAI API error: ${response.statusText}`);

        case "anthropic":
            response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "x-api-key": apiKey,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: effectiveModel,
                    max_tokens: 2000,
                    messages: [{ role: "user", content: prompt }],
                    system: "You are an expert HR assistant for a UAE-based company."
                })
            });
            if (response.ok) {
                const data = await response.json();
                tokens = data.usage?.input_tokens + data.usage?.output_tokens || 0;
                return { summary: data.content[0]?.text || "", tokens };
            }
            throw new Error(`Anthropic API error: ${response.statusText}`);

        case "google":
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${effectiveModel}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `You are an expert HR assistant for a UAE-based company.\n\n${prompt}` }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
                })
            });
            if (response.ok) {
                const data = await response.json();
                tokens = data.usageMetadata?.totalTokenCount || 0;
                return { summary: data.candidates[0]?.content?.parts[0]?.text || "", tokens };
            }
            throw new Error(`Gemini API error: ${response.statusText}`);

        default:
            throw new Error(`Unknown provider: ${effectiveProvider}`);
    }
}

export async function getAIConfig(): Promise<AIConfig | null> {
    return getCompanyAIConfig();
}

export async function getAIUsage(): Promise<AIUsage> {
    return getCurrentUsage();
}