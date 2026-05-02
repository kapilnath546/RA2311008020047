import React from "react";
/**
 * @module components/TopNSelector
 * @description Dropdown selector for choosing how many top-priority
 * notifications to display (5, 10, 20, 50).
 */

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useCallback } from "react";
import { Log } from "../middleware/logger";
import { TOP_N_OPTIONS } from "../config/constants";
import type { TopNOption } from "../types";

interface TopNSelectorProps {
  /** Currently selected top-N value. */
  value: TopNOption;
  /** Called when the user selects a different N value. */
  onChange: (value: TopNOption) => void;
}

/**
 * Renders a MUI Select dropdown for choosing the top-N display count.
 * Logs user interaction on every change.
 *
 * @param props - TopNSelectorProps
 */
export function TopNSelector({
  value,
  onChange,
}: TopNSelectorProps): React.ReactElement {
  const handleChange = useCallback(
    (event: SelectChangeEvent<number>) => {
      const newValue = Number(event.target.value) as TopNOption;
      Log(
        "frontend",
        "info",
        "component",
        `TopNSelector: top-N changed to ${newValue}.`
      );
      onChange(newValue);
    },
    [onChange]
  );

  return (
    <FormControl
      size="small"
      sx={{
        minWidth: 130,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <InputLabel
        id="top-n-label"
        sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
      >
        Show Top
      </InputLabel>
      <Select
        labelId="top-n-label"
        id="top-n-selector"
        value={value}
        label="Show Top"
        onChange={handleChange}
        sx={{ fontWeight: 600 }}
      >
        {TOP_N_OPTIONS.map((option) => (
          <MenuItem
            key={option}
            value={option}
            id={`top-n-option-${option}`}
            sx={{ fontFamily: "'Inter', sans-serif" }}
          >
            Top {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

