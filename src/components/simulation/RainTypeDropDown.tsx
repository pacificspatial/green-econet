import React, { useMemo, useCallback, useState } from "react";
import {
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  FormHelperText,
  Typography,
} from "@mui/material";
import EastIcon from "@mui/icons-material/East";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface RainTypeDropDownProps<T> {
  options: T[];
  onSelect: (option: T | null) => void;
  onSubSelect?: (parentOption: T, subOption: T) => void;
  label: string;
  value: T | null;
  subValue?: T | null;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string | number;
  renderOption?: (option: T) => React.ReactNode;
  id?: string;
  className?: string;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  hasSubOptions?: (option: T) => boolean;
  getSubOptions?: (option: T) => T[];
}

const RainTypeDropDown = <T extends object>({
  options,
  onSelect,
  onSubSelect,
  label,
  value,
  subValue,
  getOptionLabel,
  getOptionValue,
  renderOption,
  id = "rain-garden-type-dropdown",
  className,
  error = false,
  helperText,
  placeholder = "",
  disabled = false,
  hasSubOptions,
  getSubOptions,
}: RainTypeDropDownProps<T>) => {
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set()
  );

  const processedOptions = useMemo(() => {
    return options.map((option) => ({
      label: getOptionLabel(option),
      value: getOptionValue(option).toString(),
      option,
      hasSubOptions: hasSubOptions ? hasSubOptions(option) : false,
      subOptions: getSubOptions ? getSubOptions(option) : [],
    }));
  }, [options, getOptionLabel, getOptionValue, hasSubOptions, getSubOptions]);

  // Auto-expand parent if a suboption is selected
  useMemo(() => {
    if (value && subValue) {
      const parentVal = getOptionValue(value).toString();
      setExpandedParents((prev) => new Set(prev).add(parentVal));
    }
  }, [value, subValue, getOptionValue]);

  const handleChange = (event: { target: { value: string } }) => {
    const selectedValue = event.target.value;

    // Guard against undefined or empty values
    if (!selectedValue || selectedValue === "") {
      onSelect(null);
      return;
    }

    if (selectedValue.includes("::")) {
      const [parentValue, subVal] = selectedValue.split("::");

      const parentItem = processedOptions.find((o) => o.value === parentValue);
      const subItem = parentItem?.subOptions?.find(
        (sub) => getOptionValue(sub).toString() === subVal
      );

      if (parentItem && subItem && onSubSelect) {
        onSubSelect(parentItem.option, subItem);
      }
      return;
    }

    const selectedOption = processedOptions.find(
      (item) => item.value === selectedValue
    )?.option;

    onSelect(selectedOption || null);
  };

  const handleParentClick = (
    parentValue: string,
    hasChildren: boolean,
    e: React.MouseEvent
  ) => {
    if (hasChildren) {
      e.stopPropagation();
      e.preventDefault();
      // Prevent the Select component from closing
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
      setExpandedParents((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(parentValue)) {
          newSet.delete(parentValue);
        } else {
          newSet.add(parentValue);
        }
        return newSet;
      });
    }
  };

  const currentValue = useMemo(() => {
    if (value && subValue) {
      const parentVal = getOptionValue(value).toString();
      const subVal = getOptionValue(subValue).toString();
      return `${parentVal}::${subVal}`;
    } else if (value) {
      return getOptionValue(value).toString();
    }
    return "";
  }, [value, subValue, getOptionValue]);

  const renderSelectedValue = useCallback(
    (selected: string) => {
      if (selected.includes("::")) {
        const [parentValue, subVal] = selected.split("::");
        const parentOption = processedOptions.find(
          (o) => o.value === parentValue
        );
        const subOption = parentOption?.subOptions?.find(
          (sub) => getOptionValue(sub).toString() === subVal
        );

        if (parentOption && subOption) {
          return (
            <Typography
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {getOptionLabel(parentOption.option)} <EastIcon />{" "}
              {getOptionLabel(subOption)}
            </Typography>
          );
        }
      }

      const foundOption = processedOptions.find(
        (item) => item.value === selected
      );
      return foundOption ? getOptionLabel(foundOption.option) : placeholder;
    },
    [processedOptions, getOptionLabel, getOptionValue, placeholder]
  );

  const renderMenuItems = useMemo(() => {
    const items: React.ReactNode[] = [];

    processedOptions.forEach((item) => {
      const isExpanded = expandedParents.has(item.value);
      const hasChildren = item.subOptions.length > 0;

      // Add parent - if it has children, make it non-selectable (just a toggle)
      items.push(
        <MenuItem
          key={item.value}
          value={hasChildren ? undefined : item.value}
          onClickCapture={
            hasChildren
              ? (e) => handleParentClick(item.value, hasChildren, e)
              : undefined
          }
          sx={{
            fontWeight: hasChildren ? 600 : 400,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: hasChildren ? "pointer" : "default",
            "&:hover": hasChildren
              ? {
                  backgroundColor: "action.hover",
                }
              : undefined,
          }}
        >
          <span>{item.label}</span>
          {hasChildren && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                marginLeft: "8px",
              }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </span>
          )}
        </MenuItem>
      );

      // Add suboptions (conditionally rendered based on expanded state)
      if (hasChildren && isExpanded) {
        item.subOptions.forEach((sub) => {
          const subVal = `${item.value}::${getOptionValue(sub)}`;
          items.push(
            <MenuItem key={subVal} value={subVal} sx={{ pl: 4 }}>
              {renderOption ? renderOption(sub) : getOptionLabel(sub)}
            </MenuItem>
          );
        });
      }
    });

    return items;
  }, [
    processedOptions,
    getOptionLabel,
    getOptionValue,
    renderOption,
    expandedParents,
  ]);

  return (
    <FormControl
      fullWidth
      className={className}
      error={error}
      disabled={disabled}
    >
      <InputLabel id={`${id}-label`} error={error}>
        {label}
      </InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={currentValue || ""}
        onChange={(e) => handleChange(e)}
        label={label}
        renderValue={renderSelectedValue}
        displayEmpty={!!placeholder}
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 400,
              overflowY: "auto",
              "&::-webkit-scrollbar": { display: "none" },
            },
          },
        }}
      >
        {renderMenuItems}
      </Select>

      {error && helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default RainTypeDropDown;
