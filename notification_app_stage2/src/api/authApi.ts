/**
 * @module api/authApi
 * @description Authentication API functions: token fetch and token refresh.
 * All calls go through the base apiRequest client for consistent error handling.
 */

import { ENDPOINTS } from "../config/constants";
import { Log } from "../middleware/logger";
import { apiRequest } from "./apiClient";
import type { AuthCredentials, AuthResponse } from "../types";

/**
 * Fetches an authentication token from the evaluation service.
 * Sends the full credentials payload and returns the token response.
 *
 * @param credentials - The user-supplied login credentials.
 * @returns The auth response containing the Bearer token and expiry.
 * @throws Will throw if the network request fails or the server returns an error.
 */
export async function fetchAuthToken(
  credentials: AuthCredentials
): Promise<AuthResponse> {
  Log("frontend", "info", "auth", "Fetching authentication token.");

  try {
    const response = await apiRequest<AuthResponse>(ENDPOINTS.AUTH, {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    Log("frontend", "info", "auth", "Access token fetched successfully.");
    return response;
  } catch (error) {
    Log(
      "frontend",
      "fatal",
      "auth",
      `Failed to fetch authentication token: ${String(error)}`
    );
    throw error;
  }
}

/**
 * Refreshes the authentication token using previously stored credentials.
 * Functionally identical to fetchAuthToken — re-exported under a distinct
 * name to convey intent at the call-site.
 *
 * @param credentials - The user's credentials to re-authenticate with.
 * @returns A fresh AuthResponse with a new token and expiry.
 * @throws Will throw if the network request fails.
 */
export async function refreshAuthToken(
  credentials: AuthCredentials
): Promise<AuthResponse> {
  Log("frontend", "info", "auth", "Refreshing authentication token silently.");

  try {
    const response = await apiRequest<AuthResponse>(ENDPOINTS.AUTH, {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    Log("frontend", "info", "auth", "Authentication token refreshed successfully.");
    return response;
  } catch (error) {
    Log(
      "frontend",
      "fatal",
      "auth",
      `Silent token refresh failed: ${String(error)}`
    );
    throw error;
  }
}
