/**
 * @module hooks/useReadState
 * @description Hook to interact with the in-memory readStore.
 * Provides functions to mark notifications as read and checks
 * read status. Subscribes to store changes for re-rendering.
 */

import { useEffect, useState, useCallback } from "react";
import { readStore } from "../state/readStore";
import { Log } from "../middleware/logger";

export interface UseReadStateReturn {
  readIds: ReadonlySet<string>;
  markAsRead: (id: string) => void;
  markAllAsRead: (ids: string[]) => void;
  isRead: (id: string) => boolean;
}

export function useReadState(): UseReadStateReturn {
  // Use React state to trigger re-renders when the store changes.
  const [readIds, setReadIds] = useState<ReadonlySet<string>>(readStore.get());

  useEffect(() => {
    // Subscribe to changes from the in-memory store.
    const unsubscribe = readStore.subscribe(() => {
      // Create a new Set reference to force React re-render.
      setReadIds(new Set(readStore.get()));
    });
    return unsubscribe;
  }, []);

  const markAsRead = useCallback((id: string) => {
    if (!readStore.get().has(id)) {
      Log("frontend", "info", "state", `Marked notification ${id} as read`);
      readStore.add(id);
    }
  }, []);

  const markAllAsRead = useCallback((ids: string[]) => {
    if (ids.length > 0) {
      Log("frontend", "info", "state", `Marked ${ids.length} notifications as read`);
      readStore.addAll(ids);
    }
  }, []);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  return {
    readIds,
    markAsRead,
    markAllAsRead,
    isRead,
  };
}
