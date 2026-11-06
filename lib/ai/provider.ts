import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Supported AI Providers
 */
export type AIProvider = "openai" | "google" | "mock";

/**
 * Returns the appropriate language model based on environment variables.
 * Fallbacks cleanly to mock or first available configured provider.
 */
export function getLanguageModel() {
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (googleApiKey) {
        const google = createGoogleGenerativeAI({
            apiKey: googleApiKey,
        });
        return {
            provider: "google" as const,
            model: google("gemini-1.5-flash"),
        };
    }

    if (openaiApiKey) {
        const openai = createOpenAI({
            apiKey: openaiApiKey,
        });
        return {
            provider: "openai" as const,
            model: openai("gpt-4o-mini"),
        };
    }

    // Fallback stub: will be handled gracefully if neither key is set
    return {
        provider: "none" as const,
        model: null,
    };
}
