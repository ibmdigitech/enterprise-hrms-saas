/**
 * Lightweight retry wrapper for async operations.
 * Use it to guard against transient PostgreSQL / network errors inside cron jobs.
 *
 * @param fn       — async function to retry
 * @param attempts — max attempts (default: 3)
 * @param delayMs  — delay between attempts in ms (default: 2000)
 */
export async function retry<T>(
    fn: () => Promise<T>,
    { attempts = 3, delayMs = 2000 }: { attempts?: number; delayMs?: number } = {},
): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (i < attempts - 1) {
                await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError;
}
