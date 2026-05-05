import { eq } from "drizzle-orm";
import type { Database } from "../db/client";
import { sources } from "../db/schema";
import type { SourceTypeEnum } from "../db/schema";

export interface SourceRecord {
  id: number;
  year: number;
  type: SourceTypeEnum;
  title: string;
  number: string | null;
  issued_by: string[]; // parsed from JSON string
  issued_date: string;
  url: string;
  archive_url: string | null;
  local_pdf: string | null;
}

function mapRow(row: typeof sources.$inferSelect): SourceRecord {
  return {
    id: row.id,
    year: row.year,
    type: row.type,
    title: row.title,
    number: row.number ?? null,
    issued_by: JSON.parse(row.issued_by) as string[],
    issued_date: row.issued_date,
    url: row.url,
    archive_url: row.archive_url ?? null,
    local_pdf: row.local_pdf ?? null,
  };
}

export async function getSourcesByYear(db: Database, year: number): Promise<SourceRecord[]> {
  const rows = await db
    .select()
    .from(sources)
    .where(eq(sources.year, year))
    .orderBy(sources.issued_date)
    .all();
  return rows.map(mapRow);
}

export async function getAllSources(db: Database): Promise<SourceRecord[]> {
  const rows = await db.select().from(sources).orderBy(sources.year, sources.issued_date).all();
  return rows.map(mapRow);
}
