import React from "react";
/**
 * @module components/FilterBar
 * @description Category filter tab bar for the notification inbox.
 * Allows switching between All, Placement, Result, and Event views.
 */

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { useCallback } from "react";
import { Log } from "../middleware/logger";
import { CATEGORY_FILTERS } from "../config/constants";
import type { CategoryFilter } from "../types";

interface FilterBarProps {
  /** Currently active category filter. */
  activeFilter: CategoryFilter;
  /** Called when the user selects a different filter. */
  onFilterChange: (filter: CategoryFilter) => void;
  /** Notification counts per category for display in the tab labels. */
  counts: Record<string, number>;
}

/** Maps category labels to accent colours for the active indicator. */
const FILTER_COLORS: Record<string, string> = {
  All: "#7C3AED",
  Placement: "#1565C0",
  Result: "#2E7D32",
  Event: "#E65100",
};

/**
 * Renders a horizontal tab bar with category filter options.
 * Logs user interaction on every tab change.
 *
 * @param props - FilterBarProps
 */
export function FilterBar({
  activeFilter,
  onFilterChange,
  counts,
}: FilterBarProps): React.ReactElement {
  const handleChange = useCallback(
    (_: React.SyntheticEvent, value: CategoryFilter) => {
      Log(
        "frontend",
        "info",
        "component",
        `FilterBar: category changed to "${value}".`
      );
      onFilterChange(value);
    },
    [onFilterChange]
  );

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        mb: 2,
        background: "rgba(0,0,0,0.04)",
        borderRadius: "12px 12px 0 0",
        px: 1,
        flex: "1 1 auto",
      }}
    >
      <Tabs
        value={activeFilter}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          "& .MuiTabs-indicator": {
            backgroundColor: FILTER_COLORS[activeFilter] ?? "#7C3AED",
            height: 3,
            borderRadius: 2,
          },
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            fontFamily: "'Inter', sans-serif",
            minHeight: 56,
            gap: 1,
          },
          "& .Mui-selected": {
            color: `${FILTER_COLORS[activeFilter]} !important`,
          },
        }}
      >
        {CATEGORY_FILTERS.map((filter) => (
          <Tab
            key={filter}
            value={filter}
            id={`filter-tab-${filter.toLowerCase()}`}
            aria-controls={`filter-panel-${filter.toLowerCase()}`}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {filter}
                {counts[filter] !== undefined && (
                  <Chip
                    label={counts[filter]}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      backgroundColor:
                        activeFilter === filter
                          ? FILTER_COLORS[filter] ?? "#7C3AED"
                          : "rgba(0,0,0,0.08)",
                      color: activeFilter === filter ? "#fff" : "text.secondary",
                      transition: "all 0.2s ease",
                    }}
                  />
                )}
              </Box>
            }
          />
        ))}
      </Tabs>
    </Box>
  );
}
