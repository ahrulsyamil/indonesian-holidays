import { z } from "zod";
import { HOLIDAY_TYPE_ENUM, SOURCE_TYPE_ENUM } from "../db/schema";

// ─── Re-usable primitives ────────────────────────────────────────────────────

export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((d) => {
    const date = new Date(`${d}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(d);
  }, "Invalid calendar date");

export const YearSchema = z.coerce
  .number()
  .int()
  .min(1900, "Year must be ≥ 1900")
  .max(2100, "Year must be ≤ 2100");

export const MonthSchema = z.coerce
  .number()
  .int()
  .min(1, "Month must be 1–12")
  .max(12, "Month must be 1–12");

export const HolidayTypeSchema = z.enum(HOLIDAY_TYPE_ENUM);
export const SourceTypeSchema = z.enum(SOURCE_TYPE_ENUM);

// ─── Query param schemas ─────────────────────────────────────────────────────

export const YearParamSchema = z.object({ year: YearSchema });
export const YearMonthParamSchema = z.object({ year: YearSchema, month: MonthSchema });

export const CheckQuerySchema = z.object({
  date: DateSchema,
});

export const RangeQuerySchema = z
  .object({
    from: DateSchema,
    to: DateSchema,
    type: HolidayTypeSchema.optional(),
  })
  .refine((d) => d.from <= d.to, { message: "'from' must be ≤ 'to'", path: ["from"] });

export const YearQuerySchema = z.object({
  type: HolidayTypeSchema.optional(),
});

// ─── Response schemas ─────────────────────────────────────────────────────────

export const HolidayResponseSchema = z.object({
  date: z.string(),
  name: z.string(),
  type: HolidayTypeSchema,
  is_national: z.boolean(),
  description: z.string().nullable(),
});

export const HolidayListResponseSchema = z.object({
  meta: z.object({ count: z.number() }).passthrough(),
  data: z.array(HolidayResponseSchema),
});

export const HolidayTodayResponseSchema = z.object({
  meta: z.object({ today: z.string(), is_holiday: z.boolean(), count: z.number() }),
  data: z.array(HolidayResponseSchema),
});

// ─── Source schemas ───────────────────────────────────────────────────────────

export const SourceResponseSchema = z.object({
  id: z.number(),
  year: z.number(),
  type: SourceTypeSchema,
  title: z.string(),
  number: z.string().nullable(),
  issued_by: z.array(z.string()),
  issued_date: z.string(),
  url: z.string(),
  archive_url: z.string().nullable(),
  local_pdf: z.string().nullable(),
});

// ─── Data file schemas (for seed script validation) ───────────────────────────

export const HolidayEntrySchema = z.object({
  date: DateSchema,
  name: z.string().min(1),
  type: HolidayTypeSchema,
  is_national: z.boolean().default(true),
  description: z.string().nullable().optional(),
});

export const SourceEntrySchema = z.object({
  type: SourceTypeSchema,
  title: z.string().min(1),
  number: z.string().nullable().optional(),
  issued_by: z.array(z.string().min(1)).min(1),
  issued_date: DateSchema,
  url: z.string().url("Source URL must be a valid URL"),
  archive_url: z.string().url().nullable().optional(),
  local_pdf: z.string().nullable().optional(),
});

export const HolidayDataFileSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  last_updated: DateSchema,
  sources: z.array(SourceEntrySchema).min(1),
  holidays: z.array(HolidayEntrySchema).min(1),
});

export type HolidayDataFile = z.infer<typeof HolidayDataFileSchema>;
export type SourceEntry = z.infer<typeof SourceEntrySchema>;
export type HolidayEntry = z.infer<typeof HolidayEntrySchema>;
