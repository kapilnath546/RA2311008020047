import React from "react";
/**
 * @module components/ErrorBanner
 * @description Full-width error banner with an optional retry button.
 * Displayed when API calls fail or the application encounters an error state.
 */

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import RefreshIcon from "@mui/icons-material/Refresh";
import Box from "@mui/material/Box";
import { useEffect } from "react";
import { Log } from "../middleware/logger";

interface ErrorBannerProps {
  /** The error message to display. */
  message: string;
  /** Optional callback to retry the failed operation. */
  onRetry?: () => void;
  /** Optional title override. Defaults to "Something went wrong". */
  title?: string;
}

/**
 * Renders a Material UI Alert banner with a descriptive error message
 * and an optional Retry button.
 *
 * @param props - ErrorBannerProps
 */
export function ErrorBanner({
  message,
  onRetry,
  title = "Something went wrong",
}: ErrorBannerProps): React.ReactElement {
  useEffect(() => {
    Log(
      "frontend",
      "info",
      "component",
      `ErrorBanner mounted. message=${message}`
    );
  }, [message]);

  return (
    <Box sx={{ width: "100%", my: 2 }}>
      <Alert
        severity="error"
        sx={{
          borderRadius: 2,
          alignItems: "flex-start",
        }}
        action={
          onRetry ? (
            <Button
              color="error"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              sx={{ whiteSpace: "nowrap", mt: 0.5 }}
            >
              Retry
            </Button>
          ) : undefined
        }
      >
        <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
}

