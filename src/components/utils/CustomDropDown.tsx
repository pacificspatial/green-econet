import React, { useMemo } from "react";
import {
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";

interface CustomDropDownProps<T> {
  options: T[];
  onSelect: (option: T | null) => void;
  label: string;
  value: T | null;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string | number;
  renderOption?: (option: T) => React.ReactNode;
  id?: string;
  className?: string;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
}

const CustomDropDown = <T extends object>({
  options,
  onSelect,
  label,
  value,
  getOptionLabel,
  getOptionValue,
  renderOption,
  id = "custom-dropdown",
  className,
  error = false,
  helperText,
  placeholder = "",
  disabled = false,
}: CustomDropDownProps<T>) => {
  // Memoize options to prevent unnecessary re-renders
  const processedOptions = useMemo(() => {
    return options.map((option) => ({
      label: getOptionLabel(option),
      value: getOptionValue(option).toString(),
      option,
    }));
  }, [options, getOptionLabel, getOptionValue]);

  const handleChange = (event: SelectChangeEvent) => {
    const selectedValue = event.target.value;

    // Handle clear/placeholder case
    if (selectedValue === "") {
      onSelect(null);
      return;
    }

    // Find the selected option
    const selectedOption = processedOptions.find(
      (item) => item.value === selectedValue
    )?.option;

    // Call onSelect with the found option or null
    onSelect(selectedOption || null);
  };

  // Determine the current value
  const currentValue = useMemo(() => {
    if (!value) return "";

    const foundOption = processedOptions.find(
      (item) => item.value === getOptionValue(value).toString()
    );

    return foundOption ? foundOption.value : "";
  }, [value, processedOptions, getOptionValue]);

  return (
    <FormControl
      fullWidth
      className={className}
      error={error}
      disabled={disabled}
    >
      <InputLabel id={`${id}-label`} error={error} htmlFor={`${id}-input`}>
        {label}
      </InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={currentValue}
        label={label}
        onChange={handleChange}
        error={error}
        displayEmpty={!!placeholder}
        inputProps={{ "aria-label": "language", id: `${id}-input` }}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: "60%",
              overflowY: "auto",
            },
            sx: {
              "&::-webkit-scrollbar": {
                display: "none",
              },
            },
          },
        }}
      >
        {placeholder && (
          <MenuItem value="" disabled={!placeholder}>
            {placeholder}
          </MenuItem>
        )}
        {processedOptions.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            {renderOption ? renderOption(item.option) : item.label}
          </MenuItem>
        ))}
      </Select>
      {error && helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default CustomDropDown;
