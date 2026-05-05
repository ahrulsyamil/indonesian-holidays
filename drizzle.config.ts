import { defineConfig } from "drizzle-kit";

// @ts-ignore - process is available in Node/drizzle-kit context
const env =
  (globalThis as unknown as { process: { env: Record<string, string> } }).process?.env ?? {};

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  // Use d1-http driver for remote D1 operations via drizzle-kit studio/push.
  // For actual migrations, use `wrangler d1 migrations apply` (see package.json scripts).
  driver: "d1-http",
  dbCredentials: {
    accountId: env.CLOUDFLARE_ACCOUNT_ID ?? "",
    databaseId: env.CLOUDFLARE_DATABASE_ID ?? "",
    token: env.CLOUDFLARE_D1_TOKEN ?? "",
  },
});
