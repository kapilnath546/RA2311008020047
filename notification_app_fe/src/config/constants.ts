/**
 * @module config/constants
 * @description Application-wide configuration constants.
 * All URLs, weights, and default values live here — never inline in code.
 */

/** Base URL for all evaluation-service API calls. */
export const BASE_URL = "http://20.207.122.201";

/** API endpoint paths. */
export const ENDPOINTS = {
  AUTH: `${BASE_URL}/evaluation-service/auth`,
  LOGS: `${BASE_URL}/evaluation-service/logs`,
  NOTIFICATIONS: `${BASE_URL}/evaluation-service/notifications`,
} as const;

/** Category priority weights used in the priority score formula. */
export const CATEGORY_WEIGHTS: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
} as const;

/** Multiplier used in the priority score formula: weight * 10^12 + timestamp. */
export const WEIGHT_MULTIPLIER = 1_000_000_000_000;

/** Default number of top-N notifications to display. */
export const DEFAULT_TOP_N = 10;

/** Available top-N options for the selector dropdown. */
export const TOP_N_OPTIONS = [5, 10, 20, 50] as const;

/** Notification category filter options. */
export const CATEGORY_FILTERS = ["All", "Placement", "Result", "Event"] as const;

/** Token refresh buffer in milliseconds before expiry. */
export const TOKEN_REFRESH_BUFFER_MS = 60_000;

/** Maximum number of retry attempts for failed API calls. */
export const MAX_RETRIES = 2;

/** Base delay in milliseconds for exponential backoff on retries. */
export const RETRY_BASE_DELAY_MS = 1_000;

/** Allowed log stack value. */
export const LOG_STACK = "frontend" as const;

/** Allowed log level values. */
export const LOG_LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;

/** Allowed log package values. */
export const LOG_PACKAGES = [
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
  "auth",
  "config",
  "middleware",
  "utils",
] as const;
