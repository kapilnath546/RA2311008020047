/**
 * @module utils/tokenUtils
 * @description Token expiry detection and automatic refresh scheduling utilities.
 * Decoupled from React so they can be used in any module.
 */

import { TOKEN_REFRESH_BUFFER_MS } from "../config/constants";
import { Log } from "../middleware/logger";
import { isTokenExpired } from "../state/authStore";

/** Handle returned by scheduleTokenRefresh so callers can cancel it. */
export interface RefreshHandle {
  cancel: () => void;
}

/**
 * Returns true when the current in-memory token is expired or will expire
 * within the default buffer window.
 */
export function isCurrentTokenExpired(): boolean {
  return isTokenExpired(TOKEN_REFRESH_BUFFER_MS);
}

/**
 * Schedules a silent token refresh to fire shortly before the token expires.
 * The callback is expected to perform the actual refresh network call.
 *
 * @param expiresAt  - Unix timestamp (seconds) when the token expires.
 * @param onRefresh  - Async function that performs the token refresh.
 * @returns A RefreshHandle with a cancel() method.
 */
export function scheduleTokenRefresh(
  expiresAt: number,
  onRefresh: () => Promise<void>
): RefreshHandle {
  const expiryMs = expiresAt * 1000;
  const nowMs = Date.now();
  const delayMs = Math.max(0, expiryMs - nowMs - TOKEN_REFRESH_BUFFER_MS);

  Log(
    "frontend",
    "info",
    "auth",
    `Token refresh scheduled in ${Math.round(delayMs / 1000)}s.`
  );

  const timeoutId = window.setTimeout(() => {
    Log("frontend", "info", "auth", "Executing scheduled token refresh.");
    onRefresh().catch(() => {
      Log("frontend", "fatal", "auth", "Scheduled token refresh failed.");
    });
  }, delayMs);

  return {
    cancel: () => {
      window.clearTimeout(timeoutId);
      Log("frontend", "debug", "utils", "Token refresh timer cancelled.");
    },
  };
}

/**
 * Formats a Unix timestamp (seconds) into a human-readable relative string,
 * e.g. "2 hours ago", "just now".
 * @param timestamp - Unix timestamp in seconds.
 */
export function formatRelativeTime(timestamp: number): string {
  const nowMs = Date.now();
  const diffMs = nowMs - timestamp * 1000;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diffSeconds / 86400);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

/**
 * Formats a Unix timestamp (seconds) into a localised date-time string.
 * @param timestamp - Unix timestamp in seconds.
 */
export function formatAbsoluteTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
