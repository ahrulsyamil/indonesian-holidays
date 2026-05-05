import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import { seedFixtures, setupDb } from "./helpers";

beforeEach(async () => {
  await setupDb(env.DB);
  await seedFixtures(env.DB);
});

describe("GET /sources", () => {
  it("returns all sources", async () => {
    const res = await app.request("/sources", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ meta: { count: number }; data: unknown[] }>();
    expect(body.meta.count).toBe(1);
    expect(body.data).toHaveLength(1);
  });

  it("filters sources by year", async () => {
    const res = await app.request("/sources?year=2025", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ meta: { count: number } }>();
    expect(body.meta.count).toBe(1);
  });

  it("returns empty for year with no sources", async () => {
    const res = await app.request("/sources?year=2030", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ meta: { count: number } }>();
    expect(body.meta.count).toBe(0);
  });

  it("returns 400 for invalid year", async () => {
    const res = await app.request("/sources?year=abc", {}, env);
    expect(res.status).toBe(400);
  });
});

describe("GET /sources/:year", () => {
  it("returns sources for 2025", async () => {
    const res = await app.request("/sources/2025", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{
      meta: { count: number; year: number };
      data: Array<{
        type: string;
        number: string | null;
        issued_by: string[];
        url: string;
        local_pdf: string | null;
      }>;
    }>();
    expect(body.meta.count).toBe(1);
    expect(body.meta.year).toBe(2025);
    expect(body.data[0]?.type).toBe("skb");
    expect(body.data[0]?.number).toBe("1017 Tahun 2024, 2 Tahun 2024, 2 Tahun 2024");
    expect(body.data[0]?.issued_by).toBeInstanceOf(Array);
    expect(body.data[0]?.url).toBe(
      "https://www.kemenkopmk.go.id/sites/default/files/pengumuman/2024-10/SKB%203%20Menteri%20Libur%20Nasional%20dan%20Cuti%20Bersama%20Tahun%202025.pdf",
    );
    expect(body.data[0]?.local_pdf).toBe(
      "docs/sources/SKB 3 Menteri Libur Nasional dan Cuti Bersama Tahun 2025.pdf",
    );
  });

  it("returns 400 for invalid year param", async () => {
    const res = await app.request("/sources/abc", {}, env);
    expect(res.status).toBe(400);
  });
});

describe("official source PDF metadata", () => {
  it("exposes the 2025 revision SKB metadata from the local PDF", async () => {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO sources (year, type, title, number, issued_by, issued_date, url, archive_url, local_pdf)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        2025,
        "revision",
        "SKB Perubahan Libur Nasional dan Cuti Bersama Tahun 2025",
        "933 Tahun 2025, 1 Tahun 2025, 3 Tahun 2025",
        JSON.stringify(["Kementerian Agama", "Kementerian Ketenagakerjaan", "Kementerian PANRB"]),
        "2025-08-07",
        "https://www.kemenkopmk.go.id/sites/default/files/artikel/2025-08/SKB%20Perubahan%20Libur%20Nasional%20dan%20Cuti%20Bersama%20Tahun%202025.pdf",
        null,
        "docs/sources/SKB Perubahan Libur Nasional dan Cuti Bersama Tahun 2025.pdf",
      )
      .run();

    const res = await app.request("/sources/2025", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{
      data: Array<{ type: string; number: string | null; url: string; local_pdf: string | null }>;
    }>();

    const revision = body.data.find((source) => source.type === "revision");
    expect(revision?.number).toBe("933 Tahun 2025, 1 Tahun 2025, 3 Tahun 2025");
    expect(revision?.url).toBe(
      "https://www.kemenkopmk.go.id/sites/default/files/artikel/2025-08/SKB%20Perubahan%20Libur%20Nasional%20dan%20Cuti%20Bersama%20Tahun%202025.pdf",
    );
    expect(revision?.local_pdf).toBe(
      "docs/sources/SKB Perubahan Libur Nasional dan Cuti Bersama Tahun 2025.pdf",
    );
  });
});

describe("GET /holidays/:year includes sources in meta", () => {
  it("includes sources array in meta", async () => {
    const res = await app.request("/holidays/2025", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{
      meta: { count: number; year: number; sources: unknown[] };
    }>();
    expect(body.meta.sources).toBeInstanceOf(Array);
    expect(body.meta.sources).toHaveLength(1);
  });
});

describe("GET /holidays/:year/:month includes sources in meta", () => {
  it("includes sources array in meta", async () => {
    const res = await app.request("/holidays/2025/12", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{
      meta: { count: number; year: number; month: number; sources: unknown[] };
    }>();
    expect(body.meta.sources).toBeInstanceOf(Array);
    expect(body.meta.sources).toHaveLength(1);
  });
});
