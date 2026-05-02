import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import { Log } from "../middleware/logger";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationList } from "../components/NotificationList";
import { FilterBar } from "../components/FilterBar";
import { TopNSelector } from "../components/TopNSelector";
import { Pagination } from "../components/Pagination";
import { Navbar } from "../components/Navbar";
import { useReadState } from "../hooks/useReadState";
import { DEFAULT_TOP_N } from "../config/constants";
import type { CategoryFilter, TopNOption } from "../types";

export function AllNotificationsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<TopNOption>(DEFAULT_TOP_N as TopNOption);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");

  const { notifications, isLoading, error, refetch } = useNotifications({
    page,
    limit,
    notification_type: categoryFilter === "All" ? undefined : categoryFilter,
  });

  const { readIds, markAllAsRead } = useReadState();

  useEffect(() => {
    Log("frontend", "info", "page", "AllNotificationsPage mounted.");
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: TopNOption) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page
  };

  const handleCategoryChange = (newCategory: CategoryFilter) => {
    setCategoryFilter(newCategory);
    setPage(1); // Reset to first page
  };

  // Compute unread count for current view as a rough estimate for badge
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  // We do not have total count from API so counts per category are omitted or mocked as undefined
  const counts: Record<string, number> = {};

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "transparent",
      }}
    >
      <Navbar unreadCount={unreadCount} />
      <Container maxWidth="md" sx={{ pt: { xs: 2, md: 3 }, pb: 6, px: { xs: 0, md: 3 } }}>
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
            All Notifications
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontFamily: "'Inter', sans-serif",
              color: "text.secondary",
              mt: 0.5,
            }}
          >
            A chronological list of all notifications.
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={() => markAllAsRead(notifications.map(n => n.id))}>
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
            onFilterChange={handleCategoryChange}
            counts={counts}
          />
          <TopNSelector value={limit} onChange={handleLimitChange} />
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 3 }} />

        <NotificationList
          notifications={notifications} // Notifications are not ranked here, just ordered
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />

        {notifications.length > 0 && !isLoading && !error && (
          <Pagination
            page={page}
            count={notifications.length === limit ? page + 1 : page}
            onChange={handlePageChange}
          />
        )}
      </Container>
    </Box>
  );
}
