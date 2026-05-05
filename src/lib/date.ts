const JAKARTA_TZ = "Asia/Jakarta";

/**
 * Returns today's date string (YYYY-MM-DD) in Asia/Jakarta timezone.
 */
export function todayJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * Validates a YYYY-MM-DD date string. Returns true if valid calendar date.
 */
export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  // Ensure no overflow (e.g. Feb 31 → Mar 3)
  return d.toISOString().startsWith(date);
}

/**
 * Validates YYYY-MM-DD and that 'from' <= 'to'.
 */
export function isValidRange(from: string, to: string): boolean {
  return isValidDate(from) && isValidDate(to) && from <= to;
}
