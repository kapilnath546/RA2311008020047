/**
 * @module middleware/logger
 * @description Centralised, non-blocking logging middleware.
 * This is the single source of truth for the Log() function.
 * Import and use this in EVERY module. Never duplicate or inline logging logic.
 */

import { ENDPOINTS, LOG_LEVELS, LOG_PACKAGES, LOG_STACK } from "../config/constants";
import type { LogLevel, LogPackage, LogPayload } from "../types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Validates that a log level value is among the allowed set.
 * @param level - The level string to validate.
 * @returns True if valid.
 */
function isValidLevel(level: string): level is LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(level);
}

/**
 * Validates that a package value is among the allowed set.
 * @param pkg - The package string to validate.
 * @returns True if valid.
 */
function isValidPackage(pkg: string): pkg is LogPackage {
  return (LOG_PACKAGES as readonly string[]).includes(pkg);
}

// ─── In-memory token accessor (lazily injected to avoid circular imports) ─────

/** Function type that resolves the current Bearer token or null. */
type TokenAccessor = () => string | null;

let _getToken: TokenAccessor = () => null;

/**
 * Registers a token accessor function so the logger can attach Authorization
 * headers when a token is available. Called once during app initialisation.
 * @param accessor - A function returning the current access token or null.
 */
export function registerTokenAccessor(accessor: TokenAccessor): void {
  _getToken = accessor;
}

// ─── Core Log function ────────────────────────────────────────────────────────

/**
 * Sends a structured log entry to the remote logging API asynchronously.
 * This function is non-blocking — it fires and forgets so it never delays
 * the calling module. Validation failures are silently discarded to avoid
 * infinite log loops.
 *
 * @param stack   - Must be "frontend" (validated).
 * @param level   - Severity: "debug" | "info" | "warn" | "error" | "fatal".
 * @param pkg     - Module origin: see LOG_PACKAGES in constants.ts.
 * @param message - Human-readable description of the event.
 */
export function Log(
  stack: string,
  level: string,
  pkg: string,
  message: string
): void {
  if (stack !== LOG_STACK) return;
  if (!isValidLevel(level)) return;
  if (!isValidPackage(pkg)) return;

  const payload: LogPayload = {
    stack: LOG_STACK,
    level,
    package: pkg,
    message,
  };

  const token = _getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Fire-and-forget: never await so callers are never blocked.
  fetch(ENDPOINTS.LOGS, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  }).catch(() => {
    // Intentionally swallowed — logging must never crash the application.
  });
}
