import React from "react";
/**
 * @module pages/InboxPage
 * @description Priority inbox main view.
 * Composes FilterBar, TopNSelector, and NotificationList to display
 * the top-N priority-ranked notifications with live category filtering.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import LogoutIcon from "@mui/icons-material/Logout";
import { Log } from "../middleware/logger";
import { useNotifications } from "../hooks/useNotifications";
import { usePriorityQueue } from "../hooks/usePriorityQueue";
import { FilterBar } from "../components/FilterBar";
import { TopNSelector } from "../components/TopNSelector";
import { NotificationList } from "../components/NotificationList";
import { DEFAULT_TOP_N } from "../config/constants";
import type { CategoryFilter, TopNOption } from "../types";
import type { UseAuthReturn } from "../types";

interface InboxPageProps {
  /** Auth hook interface injected from parent. */
  auth: UseAuthReturn;
}

/**
 * Main priority inbox page. Orchestrates fetching, priority ranking,
 * filtering, and rendering of notifications.
 *
 * @param props - InboxPageProps
 */
export function InboxPage({ auth }: InboxPageProps): React.ReactElement {
  const navigate = useNavigate();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [topN, setTopN] = useState<TopNOption>(DEFAULT_TOP_N as TopNOption);

  useEffect(() => {
    Log("frontend", "info", "page", "InboxPage mounted.");
    if (!auth.isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  const { notifications, isLoading, error, refetch } =
    useNotifications(categoryFilter);

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
      `InboxPage: topN changed to ${value}.`
    );
    setTopN(value);
  }, []);

  const handleLogout = useCallback(() => {
    Log("frontend", "info", "page", "InboxPage: user initiated logout.");
    auth.logout();
    navigate("/", { replace: true });
  }, [auth, navigate]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #F8FAFC 0%, #E2E8F0 100%)",
      }}
    >
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Toolbar
          sx={{
            px: { xs: 2, md: 4 },
            minHeight: { xs: 56, md: 64 },
          }}
        >
          {/* Brand */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px #7C3AED55",
              }}
            >
              <NotificationsActiveIcon sx={{ fontSize: 20, color: "#fff" }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                color: "text.primary",
                letterSpacing: "-0.3px",
                display: { xs: "none", sm: "block" },
              }}
            >
              Campus Notifications
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Notification count pill */}
          {!isLoading && !error && (
            <Chip
              label={`${rankedNotifications.length} shown`}
              size="small"
              sx={{
                mr: 2,
                background: "rgba(79, 70, 229, 0.1)",
                color: "#4F46E5",
                border: "1px solid rgba(79, 70, 229, 0.2)",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: "0.72rem",
                display: { xs: "none", sm: "flex" },
              }}
            />
          )}

          {/* Logout */}
          <Button
            id="logout-btn"
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            size="small"
            sx={{
              color: "text.secondary",
              borderColor: "rgba(0,0,0,0.12)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": {
                borderColor: "#EF4444",
                color: "#EF4444",
                background: "rgba(239,68,68,0.05)",
              },
              transition: "all 0.2s ease",
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main content */}
      <Container
        maxWidth="md"
        sx={{ pt: { xs: 3, md: 4 }, pb: 6, px: { xs: 2, md: 3 } }}
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

        <Divider sx={{ borderColor: "rgba(0,0,0,0.06)", mb: 3 }} />

        {/* Notification list */}
        <NotificationList
          rankedNotifications={rankedNotifications}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
        />
      </Container>
    </Box>
  );
}
