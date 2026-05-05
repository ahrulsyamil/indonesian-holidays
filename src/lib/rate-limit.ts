import type { Context, Env, Next } from "hono";
import type { Bindings } from "../env";

/**
 * Cloudflare Rate Limiting binding type.
 * Available in Workers runtime only — undefined in local Miniflare dev.
 */
interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface RateLimitBindings extends Bindings {
  RATE_LIMIT_BURST?: RateLimiter;
  RATE_LIMIT_SUSTAINED?: RateLimiter;
}

/**
 * Returns a standard 429 JSON response.
 */
function tooManyRequests(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please slow down and try again later.",
      },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
      },
    },
  );
}

/**
 * Paths exempt from rate limiting (uptime monitors, etc.)
 */
const EXEMPT_PATHS = new Set(["/health"]);

/**
 * Rate limiting middleware using Cloudflare Workers Rate Limiting binding.
 *
 * Two layers:
 *   - Burst:     30 req / 10s per IP  (stops scrapers and burst attacks)
 *   - Sustained: 600 req / 60s per IP (stops sustained abuse)
 *
 * Gracefully skips when bindings are unavailable (local dev / Miniflare).
 */
export async function rateLimitMiddleware<E extends Env>(
  c: Context<E & { Bindings: RateLimitBindings }>,
  next: Next,
): Promise<undefined | Response> {
  const path = new URL(c.req.url).pathname;

  // Skip exempt paths
  if (EXEMPT_PATHS.has(path)) {
    await next();
    return;
  }

  // Get client IP — Cloudflare sets CF-Connecting-IP in production
  const ip =
    c.req.header("CF-Connecting-IP") ??
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown";

  const burstLimiter = c.env?.RATE_LIMIT_BURST as RateLimiter | undefined;
  const sustainedLimiter = c.env?.RATE_LIMIT_SUSTAINED as RateLimiter | undefined;

  // Burst check (30 req / 10s)
  if (burstLimiter) {
    const result = await burstLimiter.limit({ key: ip });
    if (!result.success) {
      return tooManyRequests(10);
    }
  }

  // Sustained check (600 req / 60s)
  if (sustainedLimiter) {
    const result = await sustainedLimiter.limit({ key: ip });
    if (!result.success) {
      return tooManyRequests(60);
    }
  }

  await next();
}
