import { and, between, eq, gte, lte } from "drizzle-orm";
import type { Database } from "../db/client";
import { holidays } from "../db/schema";
import type { HolidayRecord, HolidayType } from "../types";

function mapRow(row: typeof holidays.$inferSelect): HolidayRecord {
  return {
    date: row.date,
    name: row.name,
    type: row.type,
    is_national: Boolean(row.is_national),
    description: row.description ?? null,
  };
}

// ─── Query functions ─────────────────────────────────────────────────────────

export async function getHolidaysByYear(
  db: Database,
  year: number,
  type?: HolidayType,
): Promise<HolidayRecord[]> {
  const rows = await db
    .select()
    .from(holidays)
    .where(type ? and(eq(holidays.year, year), eq(holidays.type, type)) : eq(holidays.year, year))
    .orderBy(holidays.date)
    .all();
  return rows.map(mapRow);
}

export async function getHolidaysByMonth(
  db: Database,
  year: number,
  month: number,
  type?: HolidayType,
): Promise<HolidayRecord[]> {
  const rows = await db
    .select()
    .from(holidays)
    .where(
      type
        ? and(eq(holidays.year, year), eq(holidays.month, month), eq(holidays.type, type))
        : and(eq(holidays.year, year), eq(holidays.month, month)),
    )
    .orderBy(holidays.date)
    .all();
  return rows.map(mapRow);
}

export async function getHolidaysByDate(db: Database, date: string): Promise<HolidayRecord[]> {
  const rows = await db
    .select()
    .from(holidays)
    .where(eq(holidays.date, date))
    .orderBy(holidays.type, holidays.name)
    .all();
  return rows.map(mapRow);
}

export async function getHolidaysByRange(
  db: Database,
  from: string,
  to: string,
  type?: HolidayType,
): Promise<HolidayRecord[]> {
  const rows = await db
    .select()
    .from(holidays)
    .where(
      type
        ? and(between(holidays.date, from, to), eq(holidays.type, type))
        : between(holidays.date, from, to),
    )
    .orderBy(holidays.date)
    .all();
  return rows.map(mapRow);
}

// Re-export SourceRecord so routes can use it via one import
export type { SourceRecord } from "./sources";

export async function getHolidaysByRangeFallback(
  db: Database,
  from: string,
  to: string,
  type?: HolidayType,
): Promise<HolidayRecord[]> {
  // Fallback using gte/lte for D1 compat if `between` isn't available
  const rows = await db
    .select()
    .from(holidays)
    .where(
      type
        ? and(gte(holidays.date, from), lte(holidays.date, to), eq(holidays.type, type))
        : and(gte(holidays.date, from), lte(holidays.date, to)),
    )
    .orderBy(holidays.date)
    .all();
  return rows.map(mapRow);
}
