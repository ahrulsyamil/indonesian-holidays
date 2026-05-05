import type { Context, Env, Next } from "hono";

/**
 * Cache-Control TTL values in seconds.
 */
const TTL = {
  /** Static per-year/month data — changes only when new SKB is issued. */
  LONG: 86400, // 24h
  /** Per-request dynamic data — still cacheable but shorter window. */
  SHORT: 3600, // 1h
  /** Never cache — always fresh. */
  NONE: 0,
} as const;

const CACHE_RULES: Array<{ pattern: RegExp; ttl: number }> = [
  // Health — never cache (uptime monitors need real response)
  { pattern: /^\/health$/, ttl: TTL.NONE },
  // Per-year and per-month holiday data — static within a year
  { pattern: /^\/holidays\/\d{4}(\/\d{1,2})?(\?.*)?$/, ttl: TTL.LONG },
  // Sources per year
  { pattern: /^\/sources(\/\d{4})?(\?.*)?$/, ttl: TTL.LONG },
  // Today/check/range — query-dependent but still cacheable
  { pattern: /^\/holidays(\/today|\/check|\?.*)?$/, ttl: TTL.SHORT },
  // OpenAPI spec and docs
  { pattern: /^\/(openapi\.json|docs)(\/.*)?$/, ttl: TTL.SHORT },
  // Root info endpoint
  { pattern: /^\/$/, ttl: TTL.SHORT },
];

function getCacheTtl(path: string): number {
  for (const rule of CACHE_RULES) {
    if (rule.pattern.test(path)) {
      return rule.ttl;
    }
  }
  return TTL.SHORT;
}

/**
 * Middleware that sets Cache-Control headers on all GET responses.
 * Also handles Cloudflare edge cache via caches.default when available.
 */
export async function cacheMiddleware<E extends Env>(
  c: Context<E>,
  next: Next,
): Promise<undefined | Response> {
  // Only cache GET requests
  if (c.req.method !== "GET") {
    await next();
    return;
  }

  const path = new URL(c.req.url).pathname + new URL(c.req.url).search;
  const ttl = getCacheTtl(new URL(c.req.url).pathname);

  // Try Cloudflare edge cache (only available in Workers runtime, not Miniflare local)
  const cache = typeof caches !== "undefined" ? caches.default : null;

  if (cache && ttl > 0) {
    const cached = await cache.match(c.req.raw);
    if (cached) {
      // Clone and add cache hit indicator
      const res = new Response(cached.body, cached);
      res.headers.set("X-Cache", "HIT");
      return res;
    }
  }

  await next();

  // Set Cache-Control on the response
  if (ttl === TTL.NONE) {
    c.res.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  } else {
    c.res.headers.set(
      "Cache-Control",
      `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=60`,
    );
  }

  // Store in Cloudflare edge cache (async, does not block response).
  // executionCtx is unavailable in test environments — guard with try/catch.
  if (cache && ttl > 0 && c.res.status === 200) {
    try {
      const ctx = c.executionCtx;
      const resClone = c.res.clone();
      resClone.headers.set("X-Cache", "MISS");
      ctx.waitUntil(cache.put(c.req.raw, resClone));
    } catch {
      // No-op: executionCtx not available (local dev / test environment)
    }
  }

  // Tag cache miss for debugging
  if (cache && ttl > 0) {
    c.res.headers.set("X-Cache", "MISS");
  }

  void path; // used implicitly via URL parsing above
}
