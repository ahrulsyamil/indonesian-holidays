import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const HOLIDAY_TYPE_ENUM = ["national_holiday", "joint_leave"] as const;
export type HolidayTypeEnum = (typeof HOLIDAY_TYPE_ENUM)[number];

export const SOURCE_TYPE_ENUM = ["skb", "keppres", "perpres", "revision"] as const;
export type SourceTypeEnum = (typeof SOURCE_TYPE_ENUM)[number];

// ─── Tables ───────────────────────────────────────────────────────────────────

export const holidays = sqliteTable(
  "holidays",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(), // YYYY-MM-DD
    name: text("name").notNull(),
    type: text("type", { enum: HOLIDAY_TYPE_ENUM }).notNull(),
    is_national: integer("is_national", { mode: "boolean" }).notNull().default(true),
    description: text("description"),
    // Derived from date for fast filtering; stored as integer for index efficiency
    year: integer("year")
      .notNull()
      .generatedAlwaysAs(sql`CAST(SUBSTR(date, 1, 4) AS INTEGER)`, { mode: "stored" }),
    month: integer("month")
      .notNull()
      .generatedAlwaysAs(sql`CAST(SUBSTR(date, 6, 2) AS INTEGER)`, { mode: "stored" }),
  },
  (t) => [
    index("idx_holidays_year").on(t.year),
    index("idx_holidays_year_month").on(t.year, t.month),
    index("idx_holidays_date").on(t.date),
    index("idx_holidays_type").on(t.type),
    uniqueIndex("idx_holidays_unique").on(t.date, t.type, t.name),
  ],
);

export const sources = sqliteTable(
  "sources",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    year: integer("year").notNull(),
    // "skb" | "keppres" | "perpres" | "revision"
    type: text("type", { enum: SOURCE_TYPE_ENUM }).notNull(),
    title: text("title").notNull(),
    // Nomor SKB, e.g. "1017/2024, 2/2024, 2/2024"
    number: text("number"),
    // JSON-encoded array of issuing ministries
    issued_by: text("issued_by").notNull(),
    issued_date: text("issued_date").notNull(), // YYYY-MM-DD
    url: text("url").notNull(),
    archive_url: text("archive_url"),
    local_pdf: text("local_pdf"),
  },
  (t) => [
    index("idx_sources_year").on(t.year),
    uniqueIndex("idx_sources_unique").on(t.year, t.type, t.number),
  ],
);

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Holiday = typeof holidays.$inferSelect;
export type NewHoliday = typeof holidays.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
