/**
 * @module components/NotificationCard
 * @description Renders a single ranked notification with message body,
 * category badge, priority rank badge, and human-readable timestamp.
 *
 * NOTE: The evaluation-service API has no separate "title" field.
 * The Message field is used as both the card heading and body text.
 * Wrapped in React.memo to prevent unnecessary re-renders.
 */

import React, { memo } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import type { RankedNotification, NotificationCategory } from "../types";
import { PriorityBadge } from "./PriorityBadge";
import { formatRelativeTime, formatAbsoluteTime } from "../utils/tokenUtils";

interface NotificationCardProps {
  /** The ranked notification to display. */
  notification: RankedNotification;
}

/** Category chip colours (background, text, border). */
const CATEGORY_CHIP_STYLES: Record<
  NotificationCategory,
  { bg: string; color: string; border: string }
> = {
  Placement: { bg: "#E3F2FD", color: "#1565C0", border: "#90CAF9" },
  Result: { bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7" },
  Event: { bg: "#FFF3E0", color: "#E65100", border: "#FFCC80" },
};

/** Left border accent colours per category. */
const CATEGORY_BORDER: Record<NotificationCategory, string> = {
  Placement: "#1565C0",
  Result: "#2E7D32",
  Event: "#E65100",
};

/**
 * Displays a single notification card with all available metadata.
 * Since the API returns only a Message field (no title), the message is
 * displayed in a prominent heading style at the top of the card.
 * Memoised to prevent re-renders when sibling cards change.
 *
 * @param props - NotificationCardProps
 */
const NotificationCard = memo(function NotificationCard({
  notification,
}: NotificationCardProps): React.ReactElement {
  const { message, category, timestamp, rank } = notification;
  const chipStyle = CATEGORY_CHIP_STYLES[category];
  const accentColor = CATEGORY_BORDER[category];

  return (
    <Card
      id={`notification-card-${notification.id}`}
      elevation={0}
      sx={{
        flexShrink: 0,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        borderLeft: `4px solid ${accentColor}`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 8px 24px ${accentColor}22`,
        },
        background: "#FFFFFF",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
        {/* Header row: rank badge + category chip */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PriorityBadge rank={rank} category={category} />
            <Chip
              label={category}
              size="small"
              sx={{
                backgroundColor: chipStyle.bg,
                color: chipStyle.color,
                border: `1px solid ${chipStyle.border}`,
                fontWeight: 700,
                fontSize: "0.7rem",
                height: 22,
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </Box>

          {/* Timestamp in the top-right */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            <AccessTimeIcon sx={{ fontSize: 13, color: "text.disabled" }} />
            <Tooltip title={formatAbsoluteTime(timestamp)} arrow placement="top">
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  cursor: "default",
                  userSelect: "none",
                  fontSize: "0.7rem",
                }}
              >
                {formatRelativeTime(timestamp)}
              </Typography>
            </Tooltip>
          </Box>
        </Box>

        <Divider sx={{ my: 1, opacity: 0.3 }} />

        {/* Message body — this is the only text the API provides */}
        <Typography
          variant="body1"
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            lineHeight: 1.5,
            color: "text.primary",
            wordBreak: "break-word",
          }}
        >
          {message}
        </Typography>
      </CardContent>
    </Card>
  );
});

export { NotificationCard };
