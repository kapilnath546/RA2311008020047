/**
 * @module types/index
 * @description Shared TypeScript interfaces and type definitions for the entire application.
 * All API response shapes, domain entities, and UI state types are declared here.
 * API field names are preserved exactly as returned by the evaluation service.
 */

import { LOG_LEVELS, LOG_PACKAGES, LOG_STACK } from "../config/constants";

// ─── Log Types ───────────────────────────────────────────────────────────────

/** The single allowed stack identifier for frontend logging. */
export type LogStack = typeof LOG_STACK;

/** Allowed severity levels for log entries. */
export type LogLevel = (typeof LOG_LEVELS)[number];

/** Allowed package identifiers for frontend log entries. */
export type LogPackage = (typeof LOG_PACKAGES)[number];

/** Payload sent to the logging API. */
export interface LogPayload {
  stack: LogStack;
  level: LogLevel;
  package: LogPackage;
  message: string;
}

/** Response from the logging API. */
export interface LogResponse {
  logID: string;
  message: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

/** Credentials the user enters on the LoginPage. */
export interface AuthCredentials {
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  clientID: string;
  clientSecret: string;
}

/** Successful response from the authentication endpoint. */
export interface AuthResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}

/** In-memory auth state managed by the auth store. */
export interface AuthState {
  accessToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
}

// ─── Notification Types ───────────────────────────────────────────────────────

/** Notification category enum values. */
export type NotificationCategory = "Placement" | "Result" | "Event";

/**
 * Raw notification shape as returned by the evaluation-service API.
 * Field names use the exact casing from the API (PascalCase).
 */
export interface RawNotification {
  /** UUID identifier of the notification. */
  ID: string;
  /** Category type: Placement | Result | Event. */
  Type: NotificationCategory;
  /** Notification body text (the API has no separate title field). */
  Message: string;
  /** ISO-ish datetime string, e.g. "2026-04-22 17:51:30". */
  Timestamp: string;
}

/**
 * Normalised notification used throughout the app after parsing.
 * Converts PascalCase API fields to camelCase and the string Timestamp to a
 * unix timestamp number for reliable arithmetic in the priority engine.
 */
export interface Notification {
  /** UUID from the API (maps from ID). */
  id: string;
  /** Category (maps from Type). */
  category: NotificationCategory;
  /** Message body (maps from Message — there is no separate title in the API). */
  message: string;
  /** Unix timestamp in seconds (parsed from the API Timestamp string). */
  timestamp: number;
}

/** A notification augmented with its computed priority score and display rank. */
export interface RankedNotification extends Notification {
  priorityScore: number;
  rank: number;
}

/** Successful response from the notifications endpoint. */
export interface NotificationsResponse {
  notifications: RawNotification[];
}

// ─── Filter / UI State Types ──────────────────────────────────────────────────

/** All valid category filter values, including the catch-all. */
export type CategoryFilter = "All" | NotificationCategory;

/** Top-N selector allowed values. */
export type TopNOption = 5 | 10 | 20 | 50;

/** State exposed by the useNotifications hook. */
export interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/** State exposed by the usePriorityQueue hook. */
export interface PriorityQueueState {
  rankedNotifications: RankedNotification[];
}

/** State exposed by the useAuth hook. */
export interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
}
