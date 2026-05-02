/**
 * @module pages/InboxPage
 * @description Priority inbox main view.
 * Composes FilterBar, TopNSelector, and NotificationList to display
 * the top-N priority-ranked notifications with live category filtering.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import { Log } from "../middleware/logger";
import { useNotifications } from "../hooks/useNotifications";
import { usePriorityQueue } from "../hooks/usePriorityQueue";
import { Navbar } from "../components/Navbar";
import { FilterBar } from "../components/FilterBar";
import { TopNSelector } from "../components/TopNSelector";
import { NotificationList } from "../components/NotificationList";
import { DEFAULT_TOP_N } from "../config/constants";
import { useReadState } from "../hooks/useReadState";
import type { CategoryFilter, TopNOption } from "../types";

/**
 * Main priority inbox page. Orchestrates fetching, priority ranking,
 * filtering, and rendering of notifications.
 */
export function PriorityNotificationsPage(): React.ReactElement {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [topN, setTopN] = useState<TopNOption>(DEFAULT_TOP_N as TopNOption);

  const { notifications, isLoading, error, refetch } =
    useNotifications({
      notification_type: categoryFilter === "All" ? undefined : categoryFilter
    });

  const { rankedNotifications } = usePriorityQueue(notifications, topN);

  // Compute per-category counts for the FilterBar chips.
  const categoryCounts = useMemo(() => {
    const allNotifications = notifications;
    const counts: Record<string, number> = {
      All: allNotifications.length,
    };
    for (const n of allNotifications) {
      counts[n.category] = (counts[n.category] ?? 0) + 1;
    }
    return counts;
  }, [notifications]);

  useEffect(() => {
    Log("frontend", "info", "page", "PriorityNotificationsPage mounted.");
  }, []);

  const { readIds, markAllAsRead } = useReadState();

  const handleFilterChange = useCallback((filter: CategoryFilter) => {
    Log(
      "frontend",
      "info",
      "component",
      `InboxPage: filter changed to "${filter}".`
    );
    setCategoryFilter(filter);
  }, []);

  const handleTopNChange = useCallback((value: TopNOption) => {
    Log(
      "frontend",
      "info",
      "component",
      `PriorityNotificationsPage: topN changed to ${value}.`
    );
    setTopN(value);
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "transparent",
      }}
    >
      <Navbar unreadCount={rankedNotifications.length - readIds.size} />
      <Container
        maxWidth="md"
        sx={{ pt: { xs: 2, md: 3 }, pb: 6, px: { xs: 0, md: 3 } }}
      >
        {/* Page heading */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              color: "text.primary",
              letterSpacing: "-0.4px",
            }}
          >
            Priority Inbox
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "'Inter', sans-serif",
              color: "text.secondary",
              mt: 0.5,
            }}
          >
            Notifications ranked by category weight and recency.
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={() => markAllAsRead(rankedNotifications.map(n => n.id))}>
            Mark All as Read
          </Button>
        </Box>

        {/* Controls row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
          }}
        >
          <FilterBar
            activeFilter={categoryFilter}
            onFilterChange={handleFilterChange}
            counts={categoryCounts}
          />
          <TopNSelector value={topN} onChange={handleTopNChange} />
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 3 }} />

        {/* Notification list */}
        <NotificationList
          notifications={rankedNotifications}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />
      </Container>
    </Box>
  );
}
