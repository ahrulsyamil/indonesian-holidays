import { apiReference } from "@scalar/hono-api-reference";
import { Hono } from "hono";

const router = new Hono();

// OpenAPI spec — generated inline (simple version without zod-openapi codegen)
router.get("/openapi.json", (c) => {
  return c.json({
    openapi: "3.1.0",
    info: {
      title: "Indonesian Holidays API",
      version: "1.0.0",
      description:
        "Public REST API for Indonesian national holidays (hari libur nasional) and joint leave days (cuti bersama).",
      contact: {
        name: "Indonesian Holidays API",
        url: "https://github.com/your-username/indonesian-holidays",
      },
      license: { name: "MIT" },
    },
    servers: [{ url: "https://indonesian-holidays.workers.dev", description: "Production" }],
    tags: [
      { name: "Holidays", description: "Holiday data endpoints" },
      { name: "Sources", description: "Official sources and references (SKB, Keppres, etc.)" },
      { name: "Info", description: "API metadata" },
    ],
    paths: {
      "/": {
        get: {
          tags: ["Info"],
          summary: "API information",
          responses: {
            "200": { description: "API info and available endpoints" },
          },
        },
      },
      "/health": {
        get: {
          tags: ["Info"],
          summary: "Health check",
          responses: {
            "200": { description: "Service is healthy" },
          },
        },
      },
      "/holidays/today": {
        get: {
          tags: ["Holidays"],
          summary: "Check if today is a holiday",
          description: "Returns today's date (Asia/Jakarta) and holiday details if applicable.",
          responses: {
            "200": {
              description: "Today's holiday status",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TodayResponse" },
                },
              },
            },
          },
        },
      },
      "/holidays/check": {
        get: {
          tags: ["Holidays"],
          summary: "Check a specific date",
          parameters: [
            {
              name: "date",
              in: "query",
              required: true,
              schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", example: "2025-08-17" },
              description: "Date in YYYY-MM-DD format",
            },
          ],
          responses: {
            "200": {
              description: "Date holiday status",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CheckResponse" },
                },
              },
            },
            "400": { description: "Invalid date format" },
          },
        },
      },
      "/holidays": {
        get: {
          tags: ["Holidays"],
          summary: "Get holidays by date range",
          parameters: [
            {
              name: "from",
              in: "query",
              required: true,
              schema: { type: "string", example: "2025-01-01" },
            },
            {
              name: "to",
              in: "query",
              required: true,
              schema: { type: "string", example: "2025-12-31" },
            },
            {
              name: "type",
              in: "query",
              required: false,
              schema: { $ref: "#/components/schemas/HolidayType" },
            },
          ],
          responses: {
            "200": {
              description: "List of holidays in range",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HolidayListResponse" },
                },
              },
            },
            "400": { description: "Invalid parameters" },
          },
        },
      },
      "/holidays/{year}": {
        get: {
          tags: ["Holidays"],
          summary: "Get all holidays for a year",
          parameters: [
            {
              name: "year",
              in: "path",
              required: true,
              schema: { type: "integer", example: 2025 },
            },
            {
              name: "type",
              in: "query",
              required: false,
              schema: { $ref: "#/components/schemas/HolidayType" },
            },
          ],
          responses: {
            "200": {
              description: "Holidays for the year",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HolidayListResponse" },
                },
              },
            },
            "400": { description: "Invalid year" },
          },
        },
      },
      "/sources": {
        get: {
          tags: ["Sources"],
          summary: "List all official sources",
          parameters: [
            {
              name: "year",
              in: "query",
              required: false,
              schema: { type: "integer", example: 2025 },
              description: "Filter by year",
            },
          ],
          responses: {
            "200": {
              description: "List of sources",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SourceListResponse" },
                },
              },
            },
          },
        },
      },
      "/sources/{year}": {
        get: {
          tags: ["Sources"],
          summary: "Get sources for a specific year",
          parameters: [
            {
              name: "year",
              in: "path",
              required: true,
              schema: { type: "integer", example: 2025 },
            },
          ],
          responses: {
            "200": {
              description: "Sources for the year",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SourceListResponse" },
                },
              },
            },
            "400": { description: "Invalid year" },
          },
        },
      },
      "/holidays/{year}/{month}": {
        get: {
          tags: ["Holidays"],
          summary: "Get holidays for a specific month",
          parameters: [
            {
              name: "year",
              in: "path",
              required: true,
              schema: { type: "integer", example: 2025 },
            },
            {
              name: "month",
              in: "path",
              required: true,
              schema: { type: "integer", minimum: 1, maximum: 12, example: 8 },
            },
            {
              name: "type",
              in: "query",
              required: false,
              schema: { $ref: "#/components/schemas/HolidayType" },
            },
          ],
          responses: {
            "200": {
              description: "Holidays for the month",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HolidayListResponse" },
                },
              },
            },
            "400": { description: "Invalid year or month" },
          },
        },
      },
    },
    components: {
      schemas: {
        HolidayType: {
          type: "string",
          enum: ["national_holiday", "joint_leave"],
          description: "national_holiday = hari libur nasional; joint_leave = cuti bersama",
        },
        SourceType: {
          type: "string",
          enum: ["skb", "keppres", "perpres", "revision"],
          description:
            "skb = Surat Keputusan Bersama; keppres = Keputusan Presiden; perpres = Peraturan Presiden; revision = Perubahan/revisi",
        },
        Source: {
          type: "object",
          properties: {
            id: { type: "integer" },
            year: { type: "integer", example: 2025 },
            type: { $ref: "#/components/schemas/SourceType" },
            title: {
              type: "string",
              example:
                "Keputusan Bersama Menteri Agama, Menteri Ketenagakerjaan, dan Menteri PANRB tentang Hari Libur Nasional dan Cuti Bersama Tahun 2025",
            },
            number: {
              type: "string",
              nullable: true,
              example: "1017 Tahun 2024, 2 Tahun 2024, 2 Tahun 2024",
            },
            issued_by: {
              type: "array",
              items: { type: "string" },
              example: ["Kementerian Agama", "Kementerian Ketenagakerjaan", "Kementerian PANRB"],
            },
            issued_date: { type: "string", example: "2024-10-14", description: "YYYY-MM-DD" },
            url: { type: "string", format: "uri", example: "https://setkab.go.id/..." },
            archive_url: { type: "string", format: "uri", nullable: true },
            local_pdf: { type: "string", nullable: true },
          },
          required: ["id", "year", "type", "title", "issued_by", "issued_date", "url"],
        },
        SourceListResponse: {
          type: "object",
          properties: {
            meta: {
              type: "object",
              properties: { count: { type: "integer" } },
              additionalProperties: true,
            },
            data: { type: "array", items: { $ref: "#/components/schemas/Source" } },
          },
        },
        Holiday: {
          type: "object",
          properties: {
            date: { type: "string", example: "2025-08-17", description: "YYYY-MM-DD" },
            name: { type: "string", example: "Hari Kemerdekaan Indonesia" },
            type: { $ref: "#/components/schemas/HolidayType" },
            is_national: { type: "boolean", example: true },
            description: { type: "string", nullable: true },
          },
          required: ["date", "name", "type", "is_national", "description"],
        },
        HolidayListResponse: {
          type: "object",
          properties: {
            meta: {
              type: "object",
              properties: {
                count: { type: "integer" },
                sources: { type: "array", items: { $ref: "#/components/schemas/Source" } },
              },
              additionalProperties: true,
            },
            data: { type: "array", items: { $ref: "#/components/schemas/Holiday" } },
          },
        },
        TodayResponse: {
          type: "object",
          properties: {
            meta: {
              type: "object",
              properties: {
                today: { type: "string", example: "2025-08-17" },
                is_holiday: { type: "boolean" },
                count: { type: "integer" },
              },
            },
            data: { type: "array", items: { $ref: "#/components/schemas/Holiday" } },
          },
        },
        CheckResponse: {
          type: "object",
          properties: {
            meta: {
              type: "object",
              properties: {
                date: { type: "string" },
                is_holiday: { type: "boolean" },
                count: { type: "integer" },
              },
            },
            data: { type: "array", items: { $ref: "#/components/schemas/Holiday" } },
          },
        },
      },
    },
  });
});

// Scalar API Reference UI
router.get(
  "/docs",
  apiReference({
    url: "/openapi.json",
    pageTitle: "Indonesian Holidays API",
  }),
);

export { router as docsRouter };
