#!/usr/bin/env bun
/**
 * Seed script: reads all data/holidays/*.json, validates, and seeds into D1.
 *
 * Usage:
 *   bun run db:seed:local          → upsert ke local D1 (INSERT OR REPLACE)
 *   bun run db:seed:prod           → upsert ke remote D1
 *   bun run db:seed:local --fresh  → hapus semua data dulu, lalu insert ulang
 *   bun run db:seed:prod --fresh   → same, ke remote
 *
 * Flags:
 *   --local   use local miniflare D1
 *   --remote  use remote production D1
 *   --fresh   DELETE all rows before inserting (full sync with JSON files)
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HolidayDataFileSchema } from "../src/schemas/holidays";

const isRemote = process.argv.includes("--remote");
const isFresh = process.argv.includes("--fresh");
const flag = isRemote ? "--remote" : "--local";
const DB_NAME = "indonesian_holidays";

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

async function main() {
  const dataDir = join(import.meta.dir, "../data/holidays");
  const files = (await readdir(dataDir)).filter((f) => f.endsWith(".json")).sort();

  if (files.length === 0) {
    console.error("No JSON files found in data/holidays/");
    process.exit(1);
  }

  const statements: string[] = [];

  // --fresh: wipe both tables first so DB is 100% in sync with JSON files
  if (isFresh) {
    console.log("🗑  --fresh: DELETE FROM sources & holidays will run before insert.\n");
    statements.push("DELETE FROM sources;");
    statements.push("DELETE FROM holidays;");
  }

  let totalHolidays = 0;
  let totalSources = 0;

  for (const file of files) {
    const raw = await readFile(join(dataDir, file), "utf-8");
    const parsed = JSON.parse(raw);
    const result = HolidayDataFileSchema.safeParse(parsed);

    if (!result.success) {
      console.error(`❌ Validation failed for ${file}:`);
      for (const err of result.error.errors) {
        console.error(`  [${err.path.join(".")}] ${err.message}`);
      }
      process.exit(1);
    }

    const { year, sources, holidays } = result.data;
    console.log(`✓ ${file}: ${holidays.length} holidays, ${sources.length} sources`);
    totalHolidays += holidays.length;
    totalSources += sources.length;

    // ── Sources ──────────────────────────────────────────────────────────────
    for (const s of sources) {
      const title = escapeSql(s.title);
      const number = s.number ? `'${escapeSql(s.number)}'` : "NULL";
      const issuedBy = escapeSql(JSON.stringify(s.issued_by));
      const archiveUrl = s.archive_url ? `'${escapeSql(s.archive_url)}'` : "NULL";
      const localPdf = s.local_pdf ? `'${escapeSql(s.local_pdf)}'` : "NULL";

      if (s.local_pdf && !existsSync(join(import.meta.dir, "..", s.local_pdf))) {
        console.error(`❌ Local source PDF not found: ${s.local_pdf}`);
        process.exit(1);
      }

      // The unique index (year, type, number) keeps repeat seeds idempotent.
      // For updates to existing source metadata, use --fresh.
      statements.push(
        `INSERT OR IGNORE INTO sources (year, type, title, number, issued_by, issued_date, url, archive_url, local_pdf) VALUES (${year}, '${s.type}', '${title}', ${number}, '${issuedBy}', '${s.issued_date}', '${escapeSql(s.url)}', ${archiveUrl}, ${localPdf});`,
      );
    }

    // ── Holidays ─────────────────────────────────────────────────────────────
    for (const h of holidays) {
      const name = escapeSql(h.name);
      const description = h.description ? `'${escapeSql(h.description)}'` : "NULL";
      const isNational = h.is_national ? 1 : 0;
      statements.push(
        `INSERT OR REPLACE INTO holidays (date, name, type, is_national, description) VALUES ('${h.date}', '${name}', '${h.type}', ${isNational}, ${description});`,
      );
    }
  }

  // Write to temp SQL file
  const tmpFile = join(tmpdir(), `holidays-seed-${Date.now()}.sql`);
  await Bun.write(tmpFile, statements.join("\n"));

  const mode = isFresh ? "fresh insert" : "upsert";
  console.log(
    `\nExecuting ${totalHolidays} holidays + ${totalSources} sources into D1 (${flag}, ${mode})...`,
  );

  try {
    execSync(`bun x wrangler d1 execute ${DB_NAME} --file="${tmpFile}" ${flag}`, {
      stdio: "inherit",
    });
    console.log(`\n✅ Seeded ${totalHolidays} holidays and ${totalSources} sources successfully.`);
  } catch (_e) {
    console.error("\n❌ wrangler d1 execute failed. Check the output above.");
    process.exit(1);
  }
}

main();
