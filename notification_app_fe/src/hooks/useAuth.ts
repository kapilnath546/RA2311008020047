/**
 * @module hooks/useAuth
 * @description Authentication lifecycle hook.
 * Manages login, logout, token storage in memory, and silent refresh scheduling.
 * Exposes an isAuthenticated flag, loading/error states, and action callbacks.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAuthToken, refreshAuthToken } from "../api/authApi";
import {
  clearRefreshCallback,
  registerRefreshCallback,
} from "../api/apiClient";
import { Log, registerTokenAccessor } from "../middleware/logger";
import {
  clearAuthState,
  getAuthState,
  setAuthToken,
  subscribeToAuthState,
} from "../state/authStore";
import type { AuthCredentials, UseAuthReturn } from "../types";
import { scheduleTokenRefresh } from "../utils/tokenUtils";
import type { RefreshHandle } from "../utils/tokenUtils";

/**
 * Provides authentication state and actions to the consuming component.
 * Token is kept purely in memory via the authStore module.
 */
export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => getAuthState().isAuthenticated
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshHandleRef = useRef<RefreshHandle | null>(null);
  const credentialsRef = useRef<AuthCredentials | null>(null);

  // Subscribe to in-memory auth state changes.
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((state) => {
      setIsAuthenticated(state.isAuthenticated);
    });
    return unsubscribe;
  }, []);

  // Register token accessor in the logger so it can attach the Bearer header.
  useEffect(() => {
    registerTokenAccessor(() => getAuthState().accessToken);
  }, []);

  /**
   * Performs a silent refresh using the stored credentials and reschedules
   * the next refresh timer.
   */
  const performRefresh = useCallback(async (): Promise<void> => {
    if (!credentialsRef.current) return;
    const response = await refreshAuthToken(credentialsRef.current);
    setAuthToken(response.access_token, response.expires_in);
    refreshHandleRef.current?.cancel();
    refreshHandleRef.current = scheduleTokenRefresh(
      response.expires_in,
      performRefresh
    );
  }, []);

  /**
   * Authenticates the user with the provided credentials.
   * On success, stores the token in memory and schedules a silent refresh.
   */
  const login = useCallback(
    async (credentials: AuthCredentials): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        Log("frontend", "info", "auth", "Login initiated.");
        const response = await fetchAuthToken(credentials);
        credentialsRef.current = credentials;

        setAuthToken(response.access_token, response.expires_in);
        registerRefreshCallback(refreshAuthToken, credentials);

        refreshHandleRef.current?.cancel();
        refreshHandleRef.current = scheduleTokenRefresh(
          response.expires_in,
          performRefresh
        );

        Log("frontend", "info", "auth", "Login successful. Token stored in memory.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Authentication failed.";
        setError(message);
        Log("frontend", "error", "auth", `Login failed: ${message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [performRefresh]
  );

  /**
   * Logs the user out by clearing all in-memory auth state and cancelling
   * any pending refresh timers.
   */
  const logout = useCallback((): void => {
    refreshHandleRef.current?.cancel();
    refreshHandleRef.current = null;
    credentialsRef.current = null;
    clearRefreshCallback();
    clearAuthState();
    Log("frontend", "info", "auth", "User logged out. Auth state cleared.");
  }, []);

  // Clean up the refresh timer when the hook unmounts.
  useEffect(() => {
    return () => {
      refreshHandleRef.current?.cancel();
    };
  }, []);

  return { isAuthenticated, isLoading, error, login, logout };
}
