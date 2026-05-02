import React from "react";
/**
 * @module components/LoadingSpinner
 * @description Full-page and inline loading spinner using Material UI CircularProgress.
 */

import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { Log } from "../middleware/logger";

interface LoadingSpinnerProps {
  /** Optional label shown below the spinner. */
  label?: string;
  /** If true, the spinner fills its container and centres vertically. */
  fullPage?: boolean;
}

/**
 * Displays an animated circular progress indicator.
 * Used as a loading state for both page-level and inline contexts.
 *
 * @param props - LoadingSpinnerProps
 */
export function LoadingSpinner({
  label = "Loading…",
  fullPage = false,
}: LoadingSpinnerProps): React.ReactElement {
  useEffect(() => {
    Log("frontend", "info", "component", `LoadingSpinner mounted. label=${label}`);
  }, [label]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        ...(fullPage
          ? { minHeight: "60vh", width: "100%" }
          : { py: 4 }),
      }}
    >
      <CircularProgress
        size={48}
        thickness={4}
        sx={{ color: "primary.main" }}
      />
      {label && (
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      )}
    </Box>
  );
}

