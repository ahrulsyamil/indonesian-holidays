import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import type { Bindings } from "./env";
import { serverError } from "./lib/errors";
import { docsRouter } from "./routes/docs";
import { holidaysRouter } from "./routes/holidays";
import { infoRouter } from "./routes/index";
import { sourcesRouter } from "./routes/sources";

const app = new Hono<{ Bindings: Bindings }>();

// ─── Global middleware ────────────────────────────────────────────────────────

app.use("*", logger());
app.use("*", cors({ origin: "*", allowMethods: ["GET", "OPTIONS"], maxAge: 86400 }));
app.use("*", prettyJSON());

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route("/", infoRouter);
app.route("/holidays", holidaysRouter);
app.route("/sources", sourcesRouter);
app.route("/", docsRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────

app.notFound((c) => {
  return c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404,
  );
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error(err);
  return serverError(c);
});

export default app;
