import React from "react";
/**
 * @module components/NotificationList
 * @description Scrollable, priority-ordered list of notification cards.
 * Handles loading, error, and empty states. Logs mount event.
 */

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InboxIcon from "@mui/icons-material/Inbox";
import { useEffect } from "react";
import { Log } from "../middleware/logger";
import { NotificationCard } from "./NotificationCard";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorBanner } from "./ErrorBanner";
import type { RankedNotification } from "../types";

interface NotificationListProps {
  /** Priority-ranked notifications to render. */
  rankedNotifications: RankedNotification[];
  /** Whether the data is currently loading. */
  isLoading: boolean;
  /** Error message if the fetch failed. */
  error: string | null;
  /** Callback to retry the failed fetch. */
  onRetry: () => void;
}

/**
 * Renders the priority-ordered notification list with full state management.
 * Logs mount event with the item count.
 *
 * @param props - NotificationListProps
 */
export function NotificationList({
  rankedNotifications,
  isLoading,
  error,
  onRetry,
}: NotificationListProps): React.ReactElement {
  useEffect(() => {
    Log(
      "frontend",
      "info",
      "component",
      `NotificationList mounted with ${rankedNotifications.length} items.`
    );
  }, [rankedNotifications.length]);

  if (isLoading) {
    return <LoadingSpinner label="Fetching notifications…" fullPage />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={onRetry} />;
  }

  if (rankedNotifications.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 320,
          gap: 2,
          color: "text.disabled",
        }}
      >
        <InboxIcon sx={{ fontSize: 72, opacity: 0.3 }} />
        <Typography
          variant="h6"
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            opacity: 0.5,
          }}
        >
          No notifications found
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontFamily: "'Inter', sans-serif", opacity: 0.4 }}
        >
          Try changing the category filter or increasing the top-N count.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      id="notification-list"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflowY: "auto",
        maxHeight: { xs: "calc(100vh - 280px)", md: "calc(100vh - 240px)" },
        pr: { xs: 0, md: 1 },
        pb: 2,
        "&::-webkit-scrollbar": { width: 6 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          background: "rgba(255,255,255,0.15)",
          borderRadius: 3,
        },
      }}
    >
      {rankedNotifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
        />
      ))}
    </Box>
  );
}

