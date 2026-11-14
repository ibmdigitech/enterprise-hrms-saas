import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Supported AI Providers
 */
export type AIProvider = "openai" | "google" | "anthropic" | "mock";

export interface ResolvedAIProvider {
    provider: AIProvider;
    modelName: string;
    apiKey: string;
}

/**
 * Single source of truth for AI provider resolution.
 *
 * Reads API keys from environment variables and returns the provider,
 * model name, and API key. Used by both getLanguageModel() (AI SDK
 * consumers) and callAIProvider() (raw fetch consumers in index.ts).
 *
 * Resolution order:
 * 1. GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY → google (Gemini)
 * 2. OPENAI_API_KEY → openai
 * 3. ANTHROPIC_API_KEY → anthropic
 * 4. None → mock
 */
export function resolveAIProvider(): ResolvedAIProvider | null {
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (googleApiKey) {
        return {
            provider: "google",
            modelName: "gemini-1.5-flash",
            apiKey: googleApiKey,
        };
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
        return {
            provider: "openai",
            modelName: "gpt-4o-mini",
            apiKey: openaiApiKey,
        };
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicApiKey) {
        return {
            provider: "anthropic",
            modelName: "claude-3-haiku-20240307",
            apiKey: anthropicApiKey,
        };
    }

    return null;
}

/**
 * Returns the appropriate language model based on environment variables.
 * Used by the AI SDK (chat route).
 */
export function getLanguageModel() {
    const resolved = resolveAIProvider();

    if (resolved?.provider === "google") {
        const google = createGoogleGenerativeAI({
            apiKey: resolved.apiKey,
        });
        return {
            provider: "google" as const,
            model: google(resolved.modelName),
        };
    }

    if (resolved?.provider === "openai") {
        const openai = createOpenAI({
            apiKey: resolved.apiKey,
        });
        return {
            provider: "openai" as const,
            model: openai(resolved.modelName),
        };
    }

    // Fallback stub: will be handled gracefully if neither key is set
    return {
        provider: "none" as const,
        model: null,
    };
}
