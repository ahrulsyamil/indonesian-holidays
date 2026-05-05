export type RateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

export type Bindings = {
  DB: D1Database;
  API_BASE_URL?: string;
  /** Cloudflare Rate Limiting binding — available in Workers runtime only */
  RATE_LIMIT_BURST?: RateLimiter;
  /** Cloudflare Rate Limiting binding — available in Workers runtime only */
  RATE_LIMIT_SUSTAINED?: RateLimiter;
};
