/**
 * @module utils/priorityEngine
 * @description Priority score computation and max-heap based top-N extraction.
 * Implements the formula: priorityScore = (categoryWeight * 10^12) + unixTimestamp.
 * Uses a max-heap to extract the top-N items in O(n log k) time.
 */

import { CATEGORY_WEIGHTS, WEIGHT_MULTIPLIER } from "../config/constants";
import { Log } from "../middleware/logger";
import type { Notification, RankedNotification } from "../types";

// ─── Priority Score ───────────────────────────────────────────────────────────

/**
 * Computes the priority score for a notification.
 * Category weight always dominates; within a category, newer = higher score.
 *
 * @param notification - The notification to score.
 * @returns A numeric priority score (higher = more important).
 */
export function computePriorityScore(notification: Notification): number {
  const weight = CATEGORY_WEIGHTS[notification.category] ?? 0;
  return weight * WEIGHT_MULTIPLIER + notification.timestamp;
}

// ─── Max-Heap Implementation ──────────────────────────────────────────────────

/**
 * A generic max-heap (priority queue) that operates on scored items.
 * Provides O(log n) insert and O(log n) extract-max operations.
 */
class MaxHeap {
  private readonly _heap: [number, Notification][] = [];

  /** Returns the number of elements in the heap. */
  get size(): number {
    return this._heap.length;
  }

  /**
   * Inserts a new item into the heap.
   * @param score        - Priority score (higher = higher priority).
   * @param notification - The notification associated with this score.
   */
  insert(score: number, notification: Notification): void {
    this._heap.push([score, notification]);
    this._bubbleUp(this._heap.length - 1);
  }

  /**
   * Removes and returns the item with the highest priority score.
   * Returns null if the heap is empty.
   */
  extractMax(): [number, Notification] | null {
    if (this._heap.length === 0) return null;
    const max = this._heap[0];
    const last = this._heap.pop();
    if (this._heap.length > 0 && last !== undefined) {
      this._heap[0] = last;
      this._sinkDown(0);
    }
    return max;
  }

  private _bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this._heap[parent][0] >= this._heap[index][0]) break;
      [this._heap[parent], this._heap[index]] = [
        this._heap[index],
        this._heap[parent],
      ];
      index = parent;
    }
  }

  private _sinkDown(index: number): void {
    const length = this._heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let largest = index;

      if (left < length && this._heap[left][0] > this._heap[largest][0]) {
        largest = left;
      }
      if (right < length && this._heap[right][0] > this._heap[largest][0]) {
        largest = right;
      }
      if (largest === index) break;

      [this._heap[largest], this._heap[index]] = [
        this._heap[index],
        this._heap[largest],
      ];
      index = largest;
    }
  }
}

// ─── Top-N Extraction ─────────────────────────────────────────────────────────

/**
 * Extracts the top-N highest priority notifications using a max-heap.
 * Time complexity: O(n log k) where n = total notifications, k = topN.
 * This is significantly better than O(n log n) full sort when k << n.
 *
 * @param notifications - Full array of notifications from the API.
 * @param topN          - Number of top items to return.
 * @returns Ranked notifications sorted from rank 1 (highest) to rank N.
 */
export function extractTopN(
  notifications: Notification[],
  topN: number
): RankedNotification[] {
  Log(
    "frontend",
    "debug",
    "utils",
    `Priority computation started for ${notifications.length} notifications, topN=${topN}.`
  );

  const heap = new MaxHeap();

  for (const notification of notifications) {
    const score = computePriorityScore(notification);
    heap.insert(score, notification);
  }

  const results: RankedNotification[] = [];
  const extractCount = Math.min(topN, heap.size);

  for (let rank = 1; rank <= extractCount; rank++) {
    const extracted = heap.extractMax();
    if (extracted === null) break;
    const [priorityScore, notification] = extracted;
    results.push({ ...notification, priorityScore, rank });
  }

  Log(
    "frontend",
    "debug",
    "utils",
    `Priority computation complete. Extracted ${results.length} ranked notifications.`
  );

  return results;
}
