# Contributing to Indonesian Holidays API

Thank you for your interest in contributing. This guide covers everything you need to get started — whether you're fixing a typo in holiday data or adding a new feature.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Updating Holiday Data](#updating-holiday-data)
- [Code Changes](#code-changes)
- [Scripts Reference](#scripts-reference)
- [Pull Request Guidelines](#pull-request-guidelines)

---

## Code of Conduct

Be respectful and constructive. Discussions should focus on the work, not the person.

---

## Ways to Contribute

| Type | Examples |
|------|---------|
| **Data** | Add a new year's holidays, fix an incorrect date, add a missing cuti bersama |
| **Bug fix** | Broken endpoint, wrong response format, seed script failure |
| **Feature** | New endpoint, new filter option, new data field |
| **Docs** | Improve README, add examples, fix typos |
| **Tooling** | CI improvements, dependency updates |

---

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.1
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (for D1)
- Node.js is **not** required — Bun handles everything

### Steps

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/indonesian-holidays.git
cd indonesian-holidays

# 2. Install dependencies
bun install

# 3. Create your local D1 database (once only)
bun x wrangler login
bun x wrangler d1 create indonesian_holidays
# Copy the database_id into wrangler.jsonc

# 4. Apply the initial migration
bun run db:migrate:local

# 5. Seed holiday data
bun run db:seed:local

# 6. Start the dev server
bun run dev
# → http://localhost:8787
```

### Verify everything works

```bash
bun run typecheck   # 0 errors
bun run lint        # 0 errors
bun run test        # all tests pass
```

---

## Updating Holiday Data

Most contributions will be data-only changes inside `data/holidays/`.

### File structure

Each year has its own JSON file at `data/holidays/{year}.json`:

```json
{
  "year": 2025,
  "last_updated": "YYYY-MM-DD",
  "sources": [
    {
      "type": "skb",
      "title": "Full official title of the decree",
      "number": "1017 Tahun 2024, 2 Tahun 2024, 2 Tahun 2024",
      "issued_by": [
        "Kementerian Agama",
        "Kementerian Ketenagakerjaan",
        "Kementerian Pendayagunaan Aparatur Negara dan Reformasi Birokrasi"
      ],
      "issued_date": "YYYY-MM-DD",
      "url": "https://www.kemenkopmk.go.id/...",
      "archive_url": null,
      "local_pdf": "docs/sources/filename.pdf"
    }
  ],
  "holidays": [
    {
      "date": "2025-01-01",
      "name": "Tahun Baru Masehi",
      "type": "national_holiday",
      "is_national": true,
      "description": "New Year's Day"
    }
  ]
}
```

### Rules

| Rule | Detail |
|------|--------|
| **Use official sources only** | Data must come from SKB 3 Menteri (Kemenko PMK, Kemenag, Kemnaker, MenPAN-RB) |
| **Include the source PDF** | Download the official PDF and place it in `docs/sources/`. Set `local_pdf` to the relative path. |
| **Accurate dates** | Dates must exactly match the official decree, including cuti bersama dates. |
| **Date format** | Always `YYYY-MM-DD` |
| **No duplicates** | Each `(date, type, name)` combination must be unique. Overlapping types on the same date are fine (e.g. a national holiday + joint leave). |
| **Update `last_updated`** | Set it to today's date whenever you modify a year's data. |

### Holiday types

| Type | Use for |
|------|---------|
| `national_holiday` | Official public holidays (hari libur nasional) |
| `joint_leave` | Government-designated joint leave (cuti bersama) |

### Source types

| Type | Use for |
|------|---------|
| `skb` | Surat Keputusan Bersama (initial annual decree) |
| `revision` | Amendment/revision to an existing SKB |
| `keppres` | Keputusan Presiden |
| `perpres` | Peraturan Presiden |

### Validating your changes

```bash
# Test that the JSON parses, validates via Zod, and seeds cleanly
bun run db:seed:local:fresh

# Verify counts via query
bun x wrangler d1 execute indonesian_holidays --local \
  --command "SELECT year, type, COUNT(*) AS total FROM holidays GROUP BY year, type ORDER BY year, type;"
```

### Adding a new year

1. Create `data/holidays/{year}.json` following the format above.
2. Download the official PDF from [kemenkopmk.go.id](https://www.kemenkopmk.go.id) and save it to `docs/sources/`.
3. Set `local_pdf` in the JSON to point to the saved PDF.
4. Run the seed script to verify no validation errors.

---

## Code Changes

### Branch naming

```
feat/short-description
fix/short-description
data/year-update-2027
```

### Standards

- **TypeScript strict mode** — all types must be explicit; no `any`.
- **Biome** for linting and formatting — run `bun run lint:fix` before committing.
- **Zod** for all external data validation (request params, data files).
- **TDD** — write tests before implementation. All new behavior needs a test.

### Test requirements

All tests must pass before submitting a PR:

```bash
bun run test
```

Tests run inside the Cloudflare Workers runtime via `@cloudflare/vitest-pool-workers` with a real in-memory D1 instance — no mocking.

New features require:
- A test that fails before your implementation.
- A test that passes after your implementation.
- Edge cases covered (invalid input, empty results, etc.).

### Typecheck and lint

```bash
bun run typecheck   # must produce 0 errors
bun run lint        # must produce 0 errors
```

Auto-fix formatting:

```bash
bun run lint:fix
```

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `bun run dev` | Start local dev server at `http://localhost:8787` |
| `bun run deploy` | Deploy to Cloudflare Workers |
| `bun run test` | Run full test suite |
| `bun run test:watch` | Watch mode for tests |
| `bun run typecheck` | TypeScript type check (no emit) |
| `bun run lint` | Biome lint check |
| `bun run lint:fix` | Auto-fix lint and formatting |
| `bun run format` | Format all files |
| `bun run db:migrate:local` | Apply migrations to local D1 |
| `bun run db:migrate:prod` | Apply migrations to remote D1 |
| `bun run db:seed:local` | Upsert seed data into local D1 |
| `bun run db:seed:local:fresh` | Delete all rows then reseed local D1 |
| `bun run db:seed:prod` | Upsert seed data into remote D1 |
| `bun run db:seed:prod:fresh` | Delete all rows then reseed remote D1 |
| `bun run db:studio` | Open Drizzle Studio (requires `.dev.vars`) |

---

## Pull Request Guidelines

Before opening a PR, verify the following checklist:

### For data changes

- [ ] Data sourced from an official government decree (SKB / Keppres / Perpres)
- [ ] Official PDF downloaded and placed in `docs/sources/`
- [ ] `local_pdf` field in JSON points to the correct file path
- [ ] `last_updated` field updated to today's date
- [ ] `bun run db:seed:local:fresh` completes without errors
- [ ] Holiday dates match the official decree exactly

### For code changes

- [ ] `bun run test` — all tests pass
- [ ] `bun run typecheck` — 0 errors
- [ ] `bun run lint` — 0 errors
- [ ] New behavior has a corresponding test (written before implementation)
- [ ] No unrelated changes bundled into the PR

### PR description

Include:

- **What** changed and **why**
- For data: the official source URL and decree number
- For bug fixes: steps to reproduce the original bug
- For features: example request/response

---

## Project Structure

```
indonesian-holidays/
├── data/holidays/          # Holiday data per year (JSON)
├── docs/sources/           # Official government PDF decrees
├── drizzle/                # SQL migrations
├── scripts/
│   └── seed.ts             # Reads data/ and seeds into D1
├── src/
│   ├── app.ts              # Hono app composition
│   ├── index.ts            # Worker entry point
│   ├── env.ts              # Cloudflare Bindings type
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema (holidays + sources tables)
│   │   └── client.ts       # createDb() factory
│   ├── routes/
│   │   ├── index.ts        # GET / and GET /health
│   │   ├── holidays.ts     # GET /holidays/*
│   │   ├── sources.ts      # GET /sources/*
│   │   └── docs.ts         # GET /openapi.json and GET /docs
│   ├── services/
│   │   ├── holidays.ts     # Holiday query logic
│   │   └── sources.ts      # Sources query logic
│   ├── schemas/
│   │   └── holidays.ts     # Zod schemas for validation
│   ├── lib/
│   │   ├── date.ts         # Date utilities (Asia/Jakarta timezone)
│   │   └── errors.ts       # Standard error response helpers
│   └── types.ts            # Shared domain types
└── tests/
    ├── holidays.test.ts    # Holiday endpoint tests
    ├── sources.test.ts     # Sources + metadata tests
    ├── helpers.ts          # DB setup + fixture helpers
    └── env.d.ts            # cloudflare:test type declarations
```
