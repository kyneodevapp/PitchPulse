/**
 * Centralised environment variable validation.
 *
 * Import this module in any server-only file that relies on env vars.
 * It throws a clear, descriptive error at startup if a required variable
 * is missing — far better than a cryptic runtime error deep in a call stack.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const stripe = new Stripe(env.STRIPE_SECRET_KEY, ...);
 */

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `[env] Required environment variable "${name}" is not set.\n` +
            `Add it to your .env.local file or deployment environment.`
        );
    }
    return value;
}

function optionalEnv(name: string, fallback = ""): string {
    return process.env[name] ?? fallback;
}

// Only validate at runtime (not during Next.js static analysis / build phase)
// by using a lazy getter pattern so imports don't throw during `next build`.
function createEnv() {
    // Server-only secrets — never expose these to the client
    const CLERK_SECRET_KEY      = requireEnv("CLERK_SECRET_KEY");
    const STRIPE_SECRET_KEY     = requireEnv("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = requireEnv("STRIPE_WEBHOOK_SECRET");
    const STRIPE_PRICE_ID       = requireEnv("STRIPE_PRICE_ID");
    const SPORTMONKS_API_KEY    = requireEnv("SPORTMONKS_API_KEY");

    // Public vars (NEXT_PUBLIC_* are safe to expose)
    const NEXT_PUBLIC_APP_URL           = optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    const NEXT_PUBLIC_SUPABASE_URL      = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const NEXT_PUBLIC_SUPABASE_ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    return {
        CLERK_SECRET_KEY,
        STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET,
        STRIPE_PRICE_ID,
        SPORTMONKS_API_KEY,
        NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
}

// Lazily initialised — first import in a request triggers validation.
let _env: ReturnType<typeof createEnv> | null = null;

export function getEnv() {
    if (!_env) {
        _env = createEnv();
    }
    return _env;
}

// Named exports for convenience
export const env = new Proxy({} as ReturnType<typeof createEnv>, {
    get(_target, prop: string) {
        return getEnv()[prop as keyof ReturnType<typeof createEnv>];
    },
});
