/**
 * @module hooks/useNotifications
 * @description Hook that fetches notifications from the API and exposes them
 * alongside loading, error, and refetch state. Applies category filtering.
 * Data fetching is strictly contained here — never in components.
 */

import { useCallback, useEffect, useState } from "react";
import { fetchNotifications, FetchNotificationsOptions } from "../api/notificationApi";
import { Log } from "../middleware/logger";
import type { Notification, NotificationsState } from "../types";

/**
 * Fetches all notifications and provides filtered access to them.
 * Logs lifecycle events at appropriate levels.
 *
 * @param categoryFilter - The currently selected category filter.
 * @returns NotificationsState with data, loading flag, error message, and refetch.
 */
export function useNotifications(
  options?: FetchNotificationsOptions
): NotificationsState {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchNotifications(options);
      setNotifications(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load notifications.";
      setError(message);
      Log("frontend", "fatal", "api", `useNotifications fetch error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [options?.limit, options?.page, options?.notification_type]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    isLoading,
    error,
    refetch: loadNotifications,
  };
}
