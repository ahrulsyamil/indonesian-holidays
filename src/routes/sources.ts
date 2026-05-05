import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../db/client";
import type { Bindings } from "../env";
import { badRequest } from "../lib/errors";
import { YearSchema } from "../schemas/holidays";
import { getAllSources, getSourcesByYear } from "../services/sources";

const router = new Hono<{ Bindings: Bindings }>();

// GET /sources?year=YYYY
router.get(
  "/",
  zValidator("query", z.object({ year: YearSchema.optional() }), (result, c) => {
    if (!result.success) {
      return badRequest(c, "Invalid year parameter", "INVALID_YEAR");
    }
    return undefined;
  }),
  async (c) => {
    const { year } = c.req.valid("query");
    const db = createDb(c.env.DB);
    const data = year ? await getSourcesByYear(db, year) : await getAllSources(db);
    return c.json({
      meta: { count: data.length },
      data,
    });
  },
);

// GET /sources/:year
router.get(
  "/:year",
  zValidator("param", z.object({ year: YearSchema }), (result, c) => {
    if (!result.success) {
      return badRequest(c, "Invalid year. Must be a 4-digit integer.", "INVALID_YEAR");
    }
    return undefined;
  }),
  async (c) => {
    const { year } = c.req.valid("param");
    const db = createDb(c.env.DB);
    const data = await getSourcesByYear(db, year);
    return c.json({
      meta: { count: data.length, year },
      data,
    });
  },
);

export { router as sourcesRouter };
