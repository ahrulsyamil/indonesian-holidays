import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createDb } from "../db/client";
import type { Bindings } from "../env";
import { todayJakarta } from "../lib/date";
import { badRequest } from "../lib/errors";
import {
  CheckQuerySchema,
  MonthSchema,
  RangeQuerySchema,
  YearQuerySchema,
  YearSchema,
} from "../schemas/holidays";
import {
  getHolidaysByDate,
  getHolidaysByMonth,
  getHolidaysByRange,
  getHolidaysByYear,
} from "../services/holidays";
import { getSourcesByYear } from "../services/sources";
import type { HolidayType } from "../types";

const router = new Hono<{ Bindings: Bindings }>();

// GET /holidays/today
router.get("/today", async (c) => {
  const db = createDb(c.env.DB);
  const today = todayJakarta();
  const holidays = await getHolidaysByDate(db, today);
  return c.json({
    meta: {
      today,
      is_holiday: holidays.length > 0,
      count: holidays.length,
    },
    data: holidays,
  });
});

// GET /holidays/check?date=YYYY-MM-DD
router.get(
  "/check",
  zValidator("query", CheckQuerySchema, (result, c) => {
    if (!result.success) {
      return badRequest(c, result.error.errors[0]?.message ?? "Invalid date", "INVALID_DATE");
    }
    return undefined;
  }),
  async (c) => {
    const { date } = c.req.valid("query");
    const db = createDb(c.env.DB);
    const holidays = await getHolidaysByDate(db, date);
    return c.json({
      meta: { date, is_holiday: holidays.length > 0, count: holidays.length },
      data: holidays,
    });
  },
);

// GET /holidays?from=YYYY-MM-DD&to=YYYY-MM-DD[&type=...]
router.get(
  "/",
  zValidator("query", RangeQuerySchema, (result, c) => {
    if (!result.success) {
      const msg = result.error.errors[0]?.message ?? "Invalid query parameters";
      return badRequest(c, msg, "INVALID_QUERY");
    }
    return undefined;
  }),
  async (c) => {
    const { from, to, type } = c.req.valid("query");
    const db = createDb(c.env.DB);
    const data = await getHolidaysByRange(db, from, to, type as HolidayType | undefined);
    return c.json({
      meta: { count: data.length, from, to },
      data,
    });
  },
);

// GET /holidays/:year
router.get(
  "/:year",
  zValidator("param", z.object({ year: YearSchema }), (result, c) => {
    if (!result.success) {
      return badRequest(c, "Invalid year. Must be a 4-digit integer.", "INVALID_YEAR");
    }
    return undefined;
  }),
  zValidator("query", YearQuerySchema, (result, c) => {
    if (!result.success) {
      return badRequest(c, result.error.errors[0]?.message ?? "Invalid query", "INVALID_QUERY");
    }
    return undefined;
  }),
  async (c) => {
    const { year } = c.req.valid("param");
    const { type } = c.req.valid("query");
    const db = createDb(c.env.DB);
    const [data, sources] = await Promise.all([
      getHolidaysByYear(db, year, type as HolidayType | undefined),
      getSourcesByYear(db, year),
    ]);
    return c.json({
      meta: { count: data.length, year, sources },
      data,
    });
  },
);

// GET /holidays/:year/:month
router.get(
  "/:year/:month",
  zValidator("param", z.object({ year: YearSchema, month: MonthSchema }), (result, c) => {
    if (!result.success) {
      const msg = result.error.errors[0]?.message ?? "Invalid year or month";
      return badRequest(c, msg, "INVALID_PARAM");
    }
    return undefined;
  }),
  zValidator("query", YearQuerySchema, (result, c) => {
    if (!result.success) {
      return badRequest(c, result.error.errors[0]?.message ?? "Invalid query", "INVALID_QUERY");
    }
    return undefined;
  }),
  async (c) => {
    const { year, month } = c.req.valid("param");
    const { type } = c.req.valid("query");
    const db = createDb(c.env.DB);
    const [data, sources] = await Promise.all([
      getHolidaysByMonth(db, year, month, type as HolidayType | undefined),
      getSourcesByYear(db, year),
    ]);
    return c.json({
      meta: { count: data.length, year, month, sources },
      data,
    });
  },
);

export { router as holidaysRouter };
