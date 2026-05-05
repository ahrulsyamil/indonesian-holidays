// Re-export enum constants and type from schema (single source of truth)
export { HOLIDAY_TYPE_ENUM } from "./db/schema";
export type { HolidayTypeEnum as HolidayType } from "./db/schema";

import type { HolidayTypeEnum } from "./db/schema";

export interface HolidayRecord {
  date: string; // YYYY-MM-DD
  name: string;
  type: HolidayTypeEnum;
  is_national: boolean;
  description: string | null;
}

export interface ApiMeta {
  count: number;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  meta: ApiMeta;
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
