import { Hono } from "hono";
import type { Bindings } from "../env";

const router = new Hono<{ Bindings: Bindings }>();

router.get("/", (c) => {
  return c.json({
    name: "Indonesian Holidays API",
    description: "Public API for Indonesian national holidays and joint leave days.",
    version: "1.0.0",
    docs: "/docs",
    openapi: "/openapi.json",
    endpoints: [
      "GET /",
      "GET /health",
      "GET /holidays/:year",
      "GET /holidays/:year/:month",
      "GET /holidays/today",
      "GET /holidays/check?date=YYYY-MM-DD",
      "GET /holidays?from=YYYY-MM-DD&to=YYYY-MM-DD",
      "GET /sources",
      "GET /sources/:year",
      "GET /docs",
      "GET /openapi.json",
    ],
    source: "https://github.com/ahrulsyamil/indonesian-holidays",
  });
});

router.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export { router as infoRouter };
