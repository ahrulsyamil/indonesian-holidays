import type { Context } from "hono";

export function errorResponse(
  c: Context,
  status: 400 | 404 | 422 | 500,
  code: string,
  message: string,
) {
  return c.json({ error: { code, message } }, status);
}

export function notFound(c: Context, message = "Resource not found") {
  return errorResponse(c, 404, "NOT_FOUND", message);
}

export function badRequest(c: Context, message: string, code = "BAD_REQUEST") {
  return errorResponse(c, 400, code, message);
}

export function serverError(c: Context, message = "Internal server error") {
  return errorResponse(c, 500, "INTERNAL_ERROR", message);
}
