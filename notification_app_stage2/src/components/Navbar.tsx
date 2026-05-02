/**
 * @module components/Navbar
 * @description Top navigation bar with routing links, active state highlighting,
 * unread count badge, and a logout button.
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../hooks/useAuth";

interface NavbarProps {
  /** The count of unread notifications to display in the badge. */
  unreadCount: number;
}

export function Navbar({ unreadCount }: NavbarProps): React.ReactElement {
  const { logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <AppBar position="sticky" elevation={1} sx={{ background: "#FFFFFF", color: "#0F172A" }}>
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationsIcon sx={{ color: "#4F46E5" }} />
          <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: "'Inter', sans-serif" }}>
            Campus Notifications
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Button
            component={Link}
            to="/priority"
            sx={{
              color: location.pathname === "/priority" ? "#4F46E5" : "text.secondary",
              fontWeight: location.pathname === "/priority" ? 700 : 500,
              fontFamily: "'Inter', sans-serif",
              textTransform: "none",
            }}
          >
            Priority Inbox
          </Button>
          <Button
            component={Link}
            to="/notifications"
            sx={{
              color: location.pathname === "/notifications" ? "#4F46E5" : "text.secondary",
              fontWeight: location.pathname === "/notifications" ? 700 : 500,
              fontFamily: "'Inter', sans-serif",
              textTransform: "none",
            }}
          >
            All Notifications
          </Button>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon sx={{ color: "text.secondary" }} />
          </Badge>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              ml: 2,
              fontFamily: "'Inter', sans-serif",
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
