# Indonesian Holidays API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/runtime-Bun-black?logo=bun)](https://bun.sh)
[![Cloudflare Workers](https://img.shields.io/badge/deployed%20on-Cloudflare%20Workers-orange?logo=cloudflare)](https://workers.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org)

A public REST API providing Indonesian national holidays (hari libur nasional) and joint leave days (cuti bersama), sourced from official government decrees (SKB 3 Menteri).

**Live API**: <https://indonesian-holidays.ahrulsyamil.com>
**Interactive Docs**: <https://indonesian-holidays.ahrulsyamil.com/docs>

---

## Features

- All Indonesian national holidays and joint leave days
- Data sourced directly from official SKB 3 Menteri (Ministry of Religious Affairs, Manpower, and PANRB)
- Multiple holidays per date supported (e.g. Idul Fitri + joint leave on the same day)
- Filter by year, month, date range, or holiday type
- Source attribution — every year links back to the official PDF decree
- OpenAPI 3.1 spec at `/openapi.json`
- Interactive API docs powered by Scalar at `/docs`
- Zero authentication required — fully public
- CORS open for all origins

---

## API Endpoints

### Holidays

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/holidays/:year` | All holidays for a year |
| `GET` | `/holidays/:year/:month` | Holidays for a specific month |
| `GET` | `/holidays/today` | Whether today (Asia/Jakarta) is a holiday |
| `GET` | `/holidays/check?date=YYYY-MM-DD` | Check a specific date |
| `GET` | `/holidays?from=YYYY-MM-DD&to=YYYY-MM-DD` | Holidays within a date range |

**Query parameters** (all holiday endpoints):

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `national_holiday` \| `joint_leave` | Filter by holiday type |
| `from` | `YYYY-MM-DD` | Range start (required for range endpoint) |
| `to` | `YYYY-MM-DD` | Range end (required for range endpoint) |
| `date` | `YYYY-MM-DD` | Specific date (required for check endpoint) |

### Sources

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sources` | All official sources |
| `GET` | `/sources?year=YYYY` | Sources for a specific year |
| `GET` | `/sources/:year` | Sources for a specific year (path param) |

### Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info and endpoint list |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Interactive API reference (Scalar) |
| `GET` | `/openapi.json` | OpenAPI 3.1 specification |

---

## Response Format

All endpoints return a consistent JSON envelope:

```json
{
  "meta": {
    "count": 2,
    "year": 2025
  },
  "data": [...]
}
```

### Holiday object

```json
{
  "date": "2025-08-17",
  "name": "Hari Kemerdekaan Republik Indonesia",
  "type": "national_holiday",
  "is_national": true,
  "description": "Indonesian Independence Day"
}
```

### `/holidays/:year` — includes sources in meta

```json
{
  "meta": {
    "count": 28,
    "year": 2025,
    "sources": [
      {
        "id": 1,
        "year": 2025,
        "type": "skb",
        "title": "Keputusan Bersama ...",
        "number": "1017 Tahun 2024, 2 Tahun 2024, 2 Tahun 2024",
        "issued_by": ["Kementerian Agama", "Kementerian Ketenagakerjaan", "Kementerian PANRB"],
        "issued_date": "2024-10-14",
        "url": "https://www.kemenkopmk.go.id/...",
        "archive_url": null,
        "local_pdf": "docs/sources/SKB 3 Menteri Libur Nasional dan Cuti Bersama Tahun 2025.pdf"
      }
    ]
  },
  "data": [...]
}
```

### `/holidays/check` and `/holidays/today`

Both endpoints return an array in `data`. A single date can have multiple holidays (e.g. a national holiday and joint leave on the same day):

```json
{
  "meta": {
    "date": "2025-08-17",
    "is_holiday": true,
    "count": 1
  },
  "data": [
    {
      "date": "2025-08-17",
      "name": "Hari Kemerdekaan Republik Indonesia",
      "type": "national_holiday",
      "is_national": true,
      "description": "Indonesian Independence Day"
    }
  ]
}
```

### Holiday types

| Type | Description |
|------|-------------|
| `national_holiday` | Official national holiday (hari libur nasional) |
| `joint_leave` | Government-designated joint leave day (cuti bersama) |

### Error responses

```json
{
  "error": {
    "code": "INVALID_DATE",
    "message": "Date must be in YYYY-MM-DD format"
  }
}
```

---

## Data Coverage

| Year | Holiday Count | Joint Leave | Sources |
|------|:---:|:---:|---------|
| 2025 | 17 | 11 | SKB No. 1017/2024, Revision No. 933/2025 |
| 2026 | 17 | 8 | SKB No. 1497/2025 |

Data is sourced exclusively from official government decrees published on [kemenkopmk.go.id](https://www.kemenkopmk.go.id). PDF copies of the decrees are stored in `docs/sources/`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Hono](https://hono.dev) v4 |
| Runtime (dev) | [Bun](https://bun.sh) + `wrangler dev` (Miniflare) |
| Runtime (prod) | [Cloudflare Workers](https://workers.cloudflare.com) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| ORM | [Drizzle ORM](https://orm.drizzle.team) |
| Validation | [Zod](https://zod.dev) |
| API Docs | OpenAPI 3.1 + [Scalar](https://scalar.com) |
| Lint / Format | [Biome](https://biomejs.dev) |
| Tests | [Vitest](https://vitest.dev) + `@cloudflare/vitest-pool-workers` |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.1
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- `wrangler` (installed as a dev dependency — no global install needed)

### Installation

```bash
git clone https://github.com/ahrulsyamil/indonesian-holidays.git
cd indonesian-holidays
bun install
```

### Create the D1 database

```bash
bun x wrangler login
bun x wrangler d1 create indonesian_holidays
```

Copy the `database_id` from the output and paste it into `wrangler.jsonc`:

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "indonesian_holidays",
      "database_id": "YOUR_DATABASE_ID_HERE",
      "migrations_dir": "drizzle"
    }
  ]
}
```

### Apply migration and seed data

```bash
bun run db:migrate:local
bun run db:seed:local
```

### Run the development server

```bash
bun run dev
# → http://localhost:8787
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `API_BASE_URL` | No | Override the base URL used in the OpenAPI `servers` field. Defaults to the request origin. Set in `wrangler.jsonc` under `vars`. |

For **local secrets** (drizzle-kit studio / remote D1 operations), copy `.dev.vars.example` to `.dev.vars` and fill in:

```bash
cp .dev.vars.example .dev.vars
```

| Variable | Description |
|----------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `CLOUDFLARE_DATABASE_ID` | Your D1 database ID |
| `CLOUDFLARE_D1_TOKEN` | Cloudflare API token with D1 access |

---

## Database

### Scripts

| Script | Description |
|--------|-------------|
| `bun run db:migrate:local` | Apply migrations to local D1 |
| `bun run db:migrate:prod` | Apply migrations to remote D1 |
| `bun run db:seed:local` | Upsert seed data into local D1 |
| `bun run db:seed:local:fresh` | Delete all rows then reseed local D1 |
| `bun run db:seed:prod` | Upsert seed data into remote D1 |
| `bun run db:seed:prod:fresh` | Delete all rows then reseed remote D1 |
| `bun run db:studio` | Open Drizzle Studio (requires `.dev.vars`) |

### Schema

```
holidays
  id          INTEGER  PK AUTOINCREMENT
  date        TEXT     NOT NULL              -- YYYY-MM-DD
  name        TEXT     NOT NULL
  type        TEXT     NOT NULL              -- national_holiday | joint_leave
  is_national INTEGER  NOT NULL DEFAULT 1
  description TEXT
  year        INTEGER  GENERATED (stored)   -- extracted from date
  month       INTEGER  GENERATED (stored)   -- extracted from date
  UNIQUE (date, type, name)

sources
  id          INTEGER  PK AUTOINCREMENT
  year        INTEGER  NOT NULL
  type        TEXT     NOT NULL              -- skb | keppres | perpres | revision
  title       TEXT     NOT NULL
  number      TEXT
  issued_by   TEXT     NOT NULL              -- JSON array
  issued_date TEXT     NOT NULL              -- YYYY-MM-DD
  url         TEXT     NOT NULL
  archive_url TEXT
  local_pdf   TEXT
  UNIQUE (year, type, number)
```

### Holiday data format (`data/holidays/{year}.json`)

```json
{
  "year": 2025,
  "last_updated": "2025-08-07",
  "sources": [
    {
      "type": "skb",
      "title": "...",
      "number": "1017 Tahun 2024, ...",
      "issued_by": ["Kementerian Agama", "..."],
      "issued_date": "2024-10-14",
      "url": "https://...",
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

---

## Deployment

### To Cloudflare Workers

```bash
# Apply migrations to production D1
bun run db:migrate:prod

# Seed production D1
bun run db:seed:prod

# Deploy the Worker
bun run deploy
```

### Generate Cloudflare types (after wrangler.jsonc changes)

```bash
bun run cf-typegen
```

---

## Development Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start local dev server (`wrangler dev`) |
| `bun run deploy` | Deploy to Cloudflare Workers |
| `bun run test` | Run test suite |
| `bun run test:watch` | Watch mode for tests |
| `bun run typecheck` | TypeScript type check |
| `bun run lint` | Run Biome linter |
| `bun run lint:fix` | Auto-fix lint and formatting issues |
| `bun run format` | Format all files with Biome |

---

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE).
