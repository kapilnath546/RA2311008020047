/**
 * @module state/readStore
 * @description In-memory store for tracking read notification IDs.
 * Uses a Set<string> to track read state, as requested by the prompt
 * (NO localStorage allowed for state per the strict constraints).
 */

class ReadStore {
  private readIds: Set<string>;
  private listeners: Set<() => void>;

  constructor() {
    this.readIds = new Set<string>();
    this.listeners = new Set();
  }

  /** Gets all currently read IDs. */
  get(): ReadonlySet<string> {
    return this.readIds;
  }

  /** Marks a specific ID as read and notifies listeners. */
  add(id: string): void {
    if (!this.readIds.has(id)) {
      this.readIds.add(id);
      this.notify();
    }
  }

  /** Marks multiple IDs as read. */
  addAll(ids: string[]): void {
    let changed = false;
    for (const id of ids) {
      if (!this.readIds.has(id)) {
        this.readIds.add(id);
        changed = true;
      }
    }
    if (changed) {
      this.notify();
    }
  }

  /** Clears all read states (for testing/reset). */
  clear(): void {
    this.readIds.clear();
    this.notify();
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

// Export a singleton instance.
export const readStore = new ReadStore();
