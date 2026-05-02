/**
 * @module state/authStore
 * @description In-memory authentication state store.
 * Access tokens are NEVER persisted to localStorage or sessionStorage.
 * All state lives exclusively in module-level variables for the session lifetime.
 */

import { Log } from "../middleware/logger";
import type { AuthState } from "../types";

// ─── Module-level in-memory state ─────────────────────────────────────────────

let _authState: AuthState = {
  accessToken: null,
  expiresAt: null,
  isAuthenticated: false,
};

// ─── Subscriber registry ──────────────────────────────────────────────────────

type StateListener = (state: AuthState) => void;
const _listeners: Set<StateListener> = new Set();

/**
 * Notifies all registered listeners of a state change.
 */
function notify(): void {
  _listeners.forEach((listener) => listener({ ..._authState }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Subscribes a listener to auth state changes.
 * Returns an unsubscribe function that removes the listener.
 * @param listener - Callback receiving the updated AuthState.
 */
export function subscribeToAuthState(listener: StateListener): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

/**
 * Returns a snapshot of the current in-memory auth state.
 */
export function getAuthState(): AuthState {
  return { ..._authState };
}

/**
 * Returns the current access token or null if not authenticated.
 */
export function getAccessToken(): string | null {
  return _authState.accessToken;
}

/**
 * Stores a new token and its expiry timestamp in memory and notifies listeners.
 * @param accessToken - The JWT access token.
 * @param expiresAt   - Unix timestamp (seconds) at which the token expires.
 */
export function setAuthToken(accessToken: string, expiresAt: number): void {
  _authState = {
    accessToken,
    expiresAt,
    isAuthenticated: true,
  };
  Log("frontend", "info", "state", "Auth token stored in memory.");
  notify();
}

/**
 * Clears all authentication state and notifies listeners.
 * Called on logout or when a 403 is received.
 */
export function clearAuthState(): void {
  _authState = {
    accessToken: null,
    expiresAt: null,
    isAuthenticated: false,
  };
  Log("frontend", "info", "state", "Auth state cleared.");
  notify();
}

/**
 * Returns true when the stored token has expired or will expire within
 * the given buffer window.
 * @param bufferMs - Number of milliseconds before actual expiry to consider it expired.
 */
export function isTokenExpired(bufferMs: number): boolean {
  if (!_authState.expiresAt) return true;
  const nowMs = Date.now();
  const expiryMs = _authState.expiresAt * 1000;
  return nowMs >= expiryMs - bufferMs;
}
