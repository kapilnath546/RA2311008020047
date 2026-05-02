/**
 * @module api/notificationApi
 * @description Notification fetching API.
 * Retrieves all notifications from the evaluation service, normalises the
 * PascalCase API response into camelCase Notification objects, and converts
 * the string Timestamp into a unix timestamp number.
 */

import { ENDPOINTS } from "../config/constants";
import { Log } from "../middleware/logger";
import { apiRequest } from "./apiClient";
import type { Notification, NotificationsResponse, RawNotification } from "../types";

// ─── Timestamp parser ─────────────────────────────────────────────────────────

/**
 * Converts the API timestamp string (e.g. "2026-04-22 17:51:30") to a unix
 * timestamp in seconds.
 *
 * The API returns a datetime string without timezone info. We treat it as UTC
 * for consistent ordering. If parsing fails, returns 0 so the notification
 * still appears (at the lowest recency position within its category).
 *
 * @param raw - The raw timestamp string from the API.
 * @returns Unix timestamp in seconds, or 0 on parse failure.
 */
function parseTimestamp(raw: string): number {
  if (!raw) return 0;
  // Replace the space separator with "T" to produce a valid ISO 8601 string.
  const isoString = raw.trim().replace(" ", "T") + "Z";
  const ms = Date.parse(isoString);
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
}

// ─── Normaliser ───────────────────────────────────────────────────────────────

/**
 * Converts a raw PascalCase API notification into the normalised camelCase
 * Notification interface used throughout the application.
 *
 * API shape:  { ID, Type, Message, Timestamp }
 * App shape:  { id, category, message, timestamp }
 *
 * @param raw - RawNotification from the API.
 * @returns Normalised Notification object.
 */
function normaliseNotification(raw: RawNotification): Notification {
  return {
    id: raw.ID,
    category: raw.Type,
    message: raw.Message,
    timestamp: parseTimestamp(raw.Timestamp),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches all notifications from the evaluation service and returns them
 * as normalised Notification objects.
 *
 * The Bearer token is attached automatically by the base apiRequest client.
 *
 * @returns An array of normalised Notification objects.
 * @throws Will throw if the network request fails, the token is invalid, or
 *         the server returns a non-2xx status after all retries are exhausted.
 */
export async function fetchNotifications(): Promise<Notification[]> {
  Log("frontend", "info", "api", "Fetching notifications from evaluation service.");

  try {
    const response = await apiRequest<NotificationsResponse>(
      ENDPOINTS.NOTIFICATIONS,
      { method: "GET" }
    );

    const rawList: RawNotification[] = response.notifications ?? [];
    const normalised = rawList.map(normaliseNotification);

    Log(
      "frontend",
      "info",
      "api",
      `Notifications fetched and normalised. Count: ${normalised.length}.`
    );

    return normalised;
  } catch (error) {
    Log(
      "frontend",
      "fatal",
      "api",
      `Failed to fetch notifications: ${String(error)}`
    );
    throw error;
  }
}
