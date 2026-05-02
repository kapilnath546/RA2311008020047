/**
 * @module components/Pagination
 * @description Wrapper around MUI Pagination for the All Notifications page.
 */

import React from "react";
import MuiPagination from "@mui/material/Pagination";
import Box from "@mui/material/Box";
import { Log } from "../middleware/logger";

interface PaginationProps {
  /** The current active page. */
  page: number;
  /** Total number of pages available. */
  count: number;
  /** Callback fired when the page changes. */
  onChange: (page: number) => void;
}

/**
 * Renders pagination controls.
 * Logs page change events.
 */
export function Pagination({ page, count, onChange }: PaginationProps): React.ReactElement {
  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    Log("frontend", "info", "component", `Pagination: page changed to ${value}`);
    onChange(value);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
      <MuiPagination
        count={count}
        page={page}
        onChange={handleChange}
        color="primary"
        shape="rounded"
        sx={{
          "& .MuiPaginationItem-root": {
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
          },
        }}
      />
    </Box>
  );
}
