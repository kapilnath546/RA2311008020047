import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InboxIcon from "@mui/icons-material/Inbox";
import { useEffect } from "react";
import { Log } from "../middleware/logger";
import { NotificationCard } from "./NotificationCard";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorBanner } from "./ErrorBanner";
import type { Notification, RankedNotification } from "../types";
import { useReadState } from "../hooks/useReadState";

interface NotificationListProps {
  /** Notifications to render (can be ranked or standard). */
  notifications: (Notification | RankedNotification)[];
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
  notifications,
  isLoading,
  error,
  onRetry,
}: NotificationListProps): React.ReactElement {
  const { isRead, markAsRead } = useReadState();

  useEffect(() => {
    Log(
      "frontend",
      "info",
      "component",
      `NotificationList mounted with ${notifications.length} items.`
    );
  }, [notifications.length]);

  if (isLoading) {
    return <LoadingSpinner label="Fetching notifications…" fullPage />;
  }

  if (error) {
    return <ErrorBanner message={error} onRetry={onRetry} />;
  }

  if (notifications.length === 0) {
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
      }}
    >
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          isRead={isRead(notification.id)}
          onClick={() => markAsRead(notification.id)}
        />
      ))}
    </Box>
  );
}
