import type { D1Database } from "@cloudflare/workers-types";

/**
 * Sets up the holidays and sources tables in an in-memory D1 for tests.
 */
export async function setupDb(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS holidays (
        id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        date        TEXT    NOT NULL,
        name        TEXT    NOT NULL,
        type        TEXT    NOT NULL,
        is_national INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        year        INTEGER NOT NULL GENERATED ALWAYS AS (CAST(SUBSTR(date, 1, 4) AS INTEGER)) STORED,
        month       INTEGER NOT NULL GENERATED ALWAYS AS (CAST(SUBSTR(date, 6, 2) AS INTEGER)) STORED
      )`,
    )
    .run();

  await db
    .prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_unique ON holidays (date, type, name)")
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS sources (
        id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        year        INTEGER NOT NULL,
        type        TEXT    NOT NULL,
        title       TEXT    NOT NULL,
        number      TEXT,
        issued_by   TEXT    NOT NULL,
        issued_date TEXT    NOT NULL,
        url         TEXT    NOT NULL,
        archive_url TEXT,
        local_pdf   TEXT
      )`,
    )
    .run();

  await db
    .prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_sources_unique ON sources (year, type, number)")
    .run();

  await db.prepare("DELETE FROM sources").run();
  await db.prepare("DELETE FROM holidays").run();
}

/**
 * Inserts fixture holidays for testing.
 */
export async function seedFixtures(db: D1Database) {
  const holidays = [
    {
      date: "2025-01-01",
      name: "Tahun Baru Masehi",
      type: "national_holiday",
      is_national: 1,
      description: null,
    },
    {
      date: "2025-08-17",
      name: "Hari Kemerdekaan",
      type: "national_holiday",
      is_national: 1,
      description: null,
    },
    {
      date: "2025-12-25",
      name: "Hari Raya Natal",
      type: "national_holiday",
      is_national: 1,
      description: null,
    },
    {
      date: "2025-12-26",
      name: "Cuti Bersama Natal",
      type: "joint_leave",
      is_national: 0,
      description: null,
    },
  ];

  for (const f of holidays) {
    await db
      .prepare(
        `INSERT OR REPLACE INTO holidays (date, name, type, is_national, description)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(f.date, f.name, f.type, f.is_national, f.description)
      .run();
  }

  const sourceFixtures = [
    {
      year: 2025,
      type: "skb",
      title: "SKB 3 Menteri Hari Libur Nasional dan Cuti Bersama Tahun 2025",
      number: "1017 Tahun 2024, 2 Tahun 2024, 2 Tahun 2024",
      issued_by: JSON.stringify([
        "Kementerian Agama",
        "Kementerian Ketenagakerjaan",
        "Kementerian PANRB",
      ]),
      issued_date: "2024-10-14",
      url: "https://www.kemenkopmk.go.id/sites/default/files/pengumuman/2024-10/SKB%203%20Menteri%20Libur%20Nasional%20dan%20Cuti%20Bersama%20Tahun%202025.pdf",
      archive_url: null,
      local_pdf: "docs/sources/SKB 3 Menteri Libur Nasional dan Cuti Bersama Tahun 2025.pdf",
    },
  ];

  for (const s of sourceFixtures) {
    await db
      .prepare(
        `INSERT OR IGNORE INTO sources (year, type, title, number, issued_by, issued_date, url, archive_url, local_pdf)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        s.year,
        s.type,
        s.title,
        s.number,
        s.issued_by,
        s.issued_date,
        s.url,
        s.archive_url,
        s.local_pdf,
      )
      .run();
  }
}
