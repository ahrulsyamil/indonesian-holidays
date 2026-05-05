import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../src/app";
import { seedFixtures, setupDb } from "./helpers";

beforeEach(async () => {
  await setupDb(env.DB);
  await seedFixtures(env.DB);
});

describe("GET /holidays/:year", () => {
  it("returns all holidays for 2025", async () => {
    const res = await app.request("/holidays/2025", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ meta: { count: number }; data: unknown[] }>();
    expect(body.meta.count).toBe(4);
    expect(body.data).toHaveLength(4);
  });

  it("returns 400 for invalid year", async () => {
    const res = await app.request("/holidays/abc", {}, env);
    expect(res.status).toBe(400);
  });

  it("filters by type=joint_leave", async () => {
    const res = await app.request("/holidays/2025?type=joint_leave", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ meta: { count: number } }>();
    expect(body.meta.count).toBe(1);
  });
});

describe("GET /holidays/:year/:month", () => {
  it("returns holidays for December 2025", async () => {
    const res = await app.request("/holidays/2025/12", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ meta: { count: number } }>();
    expect(body.meta.count).toBe(2);
  });

  it("returns empty for month with no holidays", async () => {
    const res = await app.request("/holidays/2025/3", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ meta: { count: number } }>();
    expect(body.meta.count).toBe(0);
  });

  it("returns 400 for invalid month", async () => {
    const res = await app.request("/holidays/2025/13", {}, env);
    expect(res.status).toBe(400);
  });
});

describe("GET /holidays/check", () => {
  it("returns is_holiday=true for a known holiday", async () => {
    const res = await app.request("/holidays/check?date=2025-08-17", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{
      meta: { is_holiday: boolean; count: number };
      data: unknown[];
    }>();
    expect(body.meta.is_holiday).toBe(true);
    expect(body.meta.count).toBe(1);
    expect(body.data).toHaveLength(1);
  });

  it("returns is_holiday=false for a non-holiday", async () => {
    const res = await app.request("/holidays/check?date=2025-06-15", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{
      meta: { is_holiday: boolean; count: number };
      data: unknown[];
    }>();
    expect(body.meta.is_holiday).toBe(false);
    expect(body.meta.count).toBe(0);
    expect(body.data).toEqual([]);
  });

  it("returns all holiday records when a date has overlapping holidays", async () => {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO holidays (date, name, type, is_national, description)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind("2025-08-17", "Cuti Bersama Hari Kemerdekaan", "joint_leave", 0, null)
      .run();

    const res = await app.request("/holidays/check?date=2025-08-17", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{
      meta: { is_holiday: boolean; count: number };
      data: Array<{ date: string; name: string; type: string }>;
    }>();

    expect(body.meta.is_holiday).toBe(true);
    expect(body.meta.count).toBe(2);
    expect(body.data.map((holiday) => holiday.name).sort()).toEqual([
      "Cuti Bersama Hari Kemerdekaan",
      "Hari Kemerdekaan",
    ]);
  });

  it("returns 400 for invalid date format", async () => {
    const res = await app.request("/holidays/check?date=17-08-2025", {}, env);
    expect(res.status).toBe(400);
  });
});

describe("GET /holidays (range)", () => {
  it("returns holidays within a range", async () => {
    const res = await app.request("/holidays?from=2025-08-01&to=2025-08-31", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ meta: { count: number } }>();
    expect(body.meta.count).toBe(1);
  });

  it("returns 400 when from > to", async () => {
    const res = await app.request("/holidays?from=2025-12-31&to=2025-01-01", {}, env);
    expect(res.status).toBe(400);
  });
});

describe("GET /", () => {
  it("returns API info", async () => {
    const res = await app.request("/", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ name: string }>();
    expect(body.name).toBe("Indonesian Holidays API");
  });
});

describe("GET /health", () => {
  it("returns status ok", async () => {
    const res = await app.request("/health", {}, env);
    expect(res.status).toBe(200);
    const body = await res.json<{ status: string }>();
    expect(body.status).toBe("ok");
  });
});
