import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getLanguageModel } from "@/lib/ai/provider";
import { getAuthorizedAITools } from "@/lib/ai/tools";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { messages } = await req.json();

    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            role: true,
            employee: {
                select: { id: true, tenantId: true, firstName: true, lastName: true },
            },
            memberships: {
                where: { status: "ACTIVE" },
                select: { tenantId: true },
                take: 1,
            },
        },
    });

    if (!dbUser) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const tenantId = dbUser.employee?.tenantId || dbUser.memberships?.[0]?.tenantId || null;
    const employeeId = dbUser.employee?.id || null;
    const userName = dbUser.employee ? `${dbUser.employee.firstName} ${dbUser.employee.lastName}` : (session.user.name || "User");

    const { model } = getLanguageModel();

    if (!model) {
        return new Response(
            JSON.stringify({
                error: "No AI provider configured. Please set GEMINI_API_KEY or OPENAI_API_KEY in the environment.",
            }),
            { status: 503 }
        );
    }

    const tools = getAuthorizedAITools({
        userId: dbUser.id,
        role: dbUser.role,
        tenantId,
        employeeId,
    });

    const systemPrompt = `You are iBoo AI, the intelligent enterprise assistant for the iBoo HR MultiSaaS platform.
You are conversing with ${userName} (Role: ${dbUser.role}).
Company Context: Tenant ID ${tenantId || "Global / Unassigned"}.

GUIDELINES:
1. Multi-Tenant Safety: NEVER attempt to query or discuss data outside Tenant ${tenantId || "none"}.
2. Data Access: Use provided tools (getLeaveSummary, getUpcomingExpiries, getAttendanceSummary) to retrieve factual HR information. Do NOT guess or hallucinate HR records.
3. Tone: Professional, courteous, helpful, concise, enterprise-ready. Match iBoo HR branding.
4. Formatting: Use markdown tables for lists, bold for metrics, clear bullet points for action items.`;

    const result = streamText({
        model,
        system: systemPrompt,
        messages,
        tools,
    });

    return result.toTextStreamResponse();
}
