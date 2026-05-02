import React from "react";
/**
 * @module components/PriorityBadge
 * @description Displays the numeric priority rank of a notification.
 * Visual styling uses category-specific colours with a bold circular badge.
 */

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { NotificationCategory } from "../types";

interface PriorityBadgeProps {
  /** Numeric rank to display (1 = highest priority). */
  rank: number;
  /** Notification category used to determine badge colour. */
  category: NotificationCategory;
}

/** Maps each category to its brand colour. */
const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  Placement: "#1565C0",
  Result: "#2E7D32",
  Event: "#E65100",
};

/**
 * Renders a circular rank badge coloured by notification category.
 * Rank 1–3 receive an elevated visual treatment.
 *
 * @param props - PriorityBadgeProps
 */
export function PriorityBadge({
  rank,
  category,
}: PriorityBadgeProps): React.ReactElement {
  const color = CATEGORY_COLORS[category];
  const isTopThree = rank <= 3;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: isTopThree ? 36 : 30,
        height: isTopThree ? 36 : 30,
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: isTopThree
          ? `0 0 0 3px ${color}40, 0 2px 8px ${color}60`
          : `0 1px 4px ${color}40`,
        flexShrink: 0,
        transition: "transform 0.15s ease",
        "&:hover": { transform: "scale(1.1)" },
      }}
    >
      <Typography
        sx={{
          color: "#fff",
          fontWeight: 800,
          fontSize: isTopThree ? "0.85rem" : "0.75rem",
          lineHeight: 1,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        #{rank}
      </Typography>
    </Box>
  );
}

