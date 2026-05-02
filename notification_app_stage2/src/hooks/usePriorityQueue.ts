/**
 * @module hooks/usePriorityQueue
 * @description Hook that applies the max-heap priority engine to a notification array.
 * Uses useMemo to avoid recomputing on unrelated renders.
 * Exposes ranked notifications ready for display.
 */

import { useMemo } from "react";
import { Log } from "../middleware/logger";
import type { Notification, PriorityQueueState, RankedNotification } from "../types";
import { extractTopN } from "../utils/priorityEngine";

/**
 * Computes the top-N ranked notifications from the provided array using a max-heap.
 * Memoized so the O(n log k) computation only re-runs when inputs change.
 *
 * @param notifications - Full filtered notification array.
 * @param topN          - Maximum number of results to return.
 * @returns PriorityQueueState containing the ranked notification array.
 */
export function usePriorityQueue(
  notifications: Notification[],
  topN: number
): PriorityQueueState {
  const rankedNotifications: RankedNotification[] = useMemo(() => {
    Log(
      "frontend",
      "debug",
      "utils",
      `usePriorityQueue: computing top-${topN} from ${notifications.length} notifications.`
    );
    const results = extractTopN(notifications, topN);
    Log(
      "frontend",
      "debug",
      "utils",
      `usePriorityQueue: computation done, ${results.length} ranked items.`
    );
    return results;
  }, [notifications, topN]);

  return { rankedNotifications };
}
