/**
 * Stripe billing configuration utilities.
 *
 * Centralizes Stripe-related configuration and helper functions.
 * All secret keys are read from environment variables — never hardcoded.
 */

export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Validates that required Stripe configuration is present.
 * Returns missing keys array (empty if all present).
 */
export function getMissingStripeConfig(): string[] {
    const missing: string[] = [];
    if (!STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
    if (!STRIPE_PUBLISHABLE_KEY) missing.push("STRIPE_PUBLISHABLE_KEY");
    if (!STRIPE_WEBHOOK_SECRET) missing.push("STRIPE_WEBHOOK_SECRET");
    return missing;
}

/**
 * Checks if Stripe is fully configured for production use.
 */
export function isStripeConfigured(): boolean {
    return getMissingStripeConfig().length === 0;
}
