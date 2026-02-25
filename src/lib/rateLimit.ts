/**
 * Simple sliding-window rate limiter.
 *
 * Works per-process (suitable for single-instance / development).
 * For multi-instance / serverless deployments, swap the store for
 * Upstash Redis: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 *
 * Usage:
 *   const result = rateLimit(userId, { limit: 30, windowMs: 60_000 });
 *   if (!result.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
 */

interface RateLimitOptions {
    /** Max requests allowed within the window */
    limit: number;
    /** Window size in milliseconds */
    windowMs: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number; // Unix ms timestamp
}

// In-memory store: key → array of request timestamps within the window
const store = new Map<string, number[]>();

// Periodically clean up stale keys to prevent memory leaks
const GC_INTERVAL_MS = 5 * 60 * 1000; // every 5 min
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store.entries()) {
        // If all timestamps are older than 10 minutes, evict the key
        if (timestamps.every(t => now - t > 10 * 60 * 1000)) {
            store.delete(key);
        }
    }
}, GC_INTERVAL_MS);

export function rateLimit(
    key: string,
    { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing timestamps, filter to current window
    const timestamps = (store.get(key) ?? []).filter(t => t > windowStart);

    if (timestamps.length >= limit) {
        const oldestInWindow = timestamps[0];
        return {
            allowed: false,
            remaining: 0,
            resetAt: oldestInWindow + windowMs,
        };
    }

    // Record this request
    timestamps.push(now);
    store.set(key, timestamps);

    return {
        allowed: true,
        remaining: limit - timestamps.length,
        resetAt: now + windowMs,
    };
}
