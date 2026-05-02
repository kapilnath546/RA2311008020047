/**
 * @module api/apiClient
 * @description Base HTTP client with interceptors, retry logic with exponential backoff,
 * 401 token-refresh retry, and 403 forced logout handling.
 * All data fetching flows through this module — never directly in components.
 */

import { MAX_RETRIES, RETRY_BASE_DELAY_MS } from "../config/constants";
import { Log } from "../middleware/logger";
import { clearAuthState, getAccessToken, setAuthToken } from "../state/authStore";
import type { AuthCredentials, AuthResponse } from "../types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Waits for the given number of milliseconds.
 * @param ms - Duration in milliseconds.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Builds the Authorization header from the in-memory token.
 */
function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Refresh token callback registry ─────────────────────────────────────────

/** Function signature for a token refresh callback. */
type RefreshCallback = (credentials: AuthCredentials) => Promise<AuthResponse>;

let _refreshCallback: RefreshCallback | null = null;
let _storedCredentials: AuthCredentials | null = null;

/**
 * Registers the token-refresh callback and the last-used credentials so the
 * client can silently renew a token on 401. Called from useAuth during login.
 * @param callback    - The function that fetches a fresh token.
 * @param credentials - The user's credentials to pass to the callback.
 */
export function registerRefreshCallback(
  callback: RefreshCallback,
  credentials: AuthCredentials
): void {
  _refreshCallback = callback;
  _storedCredentials = credentials;
}

/**
 * Clears the stored refresh callback and credentials. Called on logout.
 */
export function clearRefreshCallback(): void {
  _refreshCallback = null;
  _storedCredentials = null;
}

// ─── Core request function ────────────────────────────────────────────────────

/**
 * Sends an HTTP request with automatic retry on 5xx errors (exponential backoff),
 * token refresh on 401, and forced logout on 403.
 *
 * @param url     - Full URL to request.
 * @param init    - Standard RequestInit options.
 * @param retries - Current retry count (internal recursion parameter).
 * @returns The parsed JSON response.
 */
export async function apiRequest<T>(
  url: string,
  init: RequestInit,
  retries = 0
): Promise<T> {
  const mergedHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...(init.headers as Record<string, string> | undefined ?? {}),
  };

  Log("frontend", "info", "api", `API call started: ${init.method ?? "GET"} ${url}`);

  let response: Response;

  try {
    response = await fetch(url, { ...init, headers: mergedHeaders });
  } catch (networkError) {
    Log("frontend", "fatal", "api", `Network failure for ${url}: ${String(networkError)}`);
    throw new Error("Network error: unable to reach the server.");
  }

  // ── 401: Attempt silent token refresh then retry once ──────────────────────
  if (response.status === 401) {
    Log("frontend", "warn", "api", `401 received for ${url}. Attempting token refresh.`);

    if (_refreshCallback && _storedCredentials) {
      try {
        const refreshed = await _refreshCallback(_storedCredentials);
        setAuthToken(refreshed.access_token, refreshed.expires_in);
        Log("frontend", "info", "auth", "Token refreshed successfully after 401.");
        return apiRequest<T>(url, init, retries);
      } catch (refreshError) {
        Log("frontend", "fatal", "auth", `Token refresh failed: ${String(refreshError)}`);
        clearAuthState();
        throw new Error("Session expired. Please log in again.");
      }
    }

    clearAuthState();
    throw new Error("Unauthorized. Please log in.");
  }

  // ── 403: Force logout ─────────────────────────────────────────────────────
  if (response.status === 403) {
    Log("frontend", "error", "api", `403 Forbidden for ${url}. Forcing logout.`);
    clearAuthState();
    throw new Error("Access denied. You have been logged out.");
  }

  // ── 5xx: Exponential backoff retry ────────────────────────────────────────
  if (response.status >= 500 && retries < MAX_RETRIES) {
    const backoffMs = RETRY_BASE_DELAY_MS * Math.pow(2, retries);
    Log(
      "frontend",
      "warn",
      "api",
      `${response.status} error for ${url}. Retry ${retries + 1}/${MAX_RETRIES} in ${backoffMs}ms.`
    );
    await delay(backoffMs);
    return apiRequest<T>(url, init, retries + 1);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    Log("frontend", "error", "api", `API error ${response.status} for ${url}: ${body}`);
    throw new Error(`Request failed with status ${response.status}.`);
  }

  Log("frontend", "info", "api", `API call succeeded: ${init.method ?? "GET"} ${url}`);

  try {
    const data = (await response.json()) as T;
    return data;
  } catch (parseError) {
    Log("frontend", "fatal", "api", `JSON parse error for ${url}: ${String(parseError)}`);
    throw new Error("Invalid response format from server.");
  }
}
