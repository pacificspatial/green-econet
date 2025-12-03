import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

interface ToggleButtonProps {
  buttons: {
    value: string;
    label: string;
    isSaved?: boolean;
    isDisabled: boolean;
  }[];
  onChange: (value: string) => void;
  defaultValue?: string;
  tabStyle?: boolean;
}

const StyledButtonGroup = styled("div")(({ theme }: { theme: Theme }) => ({
  display: "flex",
  justifyContent: "space-around",
  alignItems: "center",
  width: "100%",
  flexWrap: "wrap",
  paddingLeft: 20,
  paddingRight: 20,
  "& .MuiButton-root": {
    borderRadius: "8px",
    border: "1px solid",
    textTransform: "none",
    boxShadow: "none",
    position: "relative",
    // properties for text overflow
    "& .button-content": {
      width: "100%",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      display: "block",
    },
  },
  "&:hover": {
    backgroundColor: "inherit",
  },
  "& .MuiButton-contained:hover": {
    backgroundColor: theme.palette.primary.main,
    boxShadow: "none",
  },
}));

const StyledTabGroup = styled("div")(({ theme }: { theme: Theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  marginTop: "2px",
  "& .tab-item": {
    padding: "10px 20px",
    cursor: "pointer",
    textTransform: "none",
    fontSize: "16px",
    color: theme.palette.text.primary,
    borderBottom: `3px solid transparent`,
    transition: "border-color 0.3s",
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  "& .tab-item.active": {
    borderBottom: `3px solid ${theme.palette.primary.main}`,
    fontWeight: "bold",
    color: theme.palette.primary.main,
  },
}));

const Checkmark = () => (
  <img
    src="/src/assets/checkMark.png"
    alt="Checkmark"
    style={{
      position: "absolute",
      top: "-5px",
      right: "-5px",
      width: "20px",
      height: "20px",
      backgroundColor: "white",
      borderRadius: "50%",
    }}
  />
);

const ToggleButtons: React.FC<ToggleButtonProps> = ({
  buttons,
  onChange,
  defaultValue,
  tabStyle = false,
}) => {
  const [selectedValue, setSelectedValue] = useState<string>(buttons[0].value);

  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue);
    }
  }, [defaultValue]);

  const handleClick = (value: string) => {
    if (value !== selectedValue) {
      setSelectedValue(value);
      onChange(value);
    }
  };

  if (tabStyle) {
    return (
      <StyledTabGroup aria-label="tab-group">
        {buttons.map((button) => (
          <div
            key={button.value}
            className={`tab-item ${
              selectedValue === button.value ? "active" : ""
            }`}
            onClick={() => handleClick(button.value)}
            title={button.label}
          >
            {button.label}
          </div>
        ))}
      </StyledTabGroup>
    );
  }

  return (
    <StyledButtonGroup aria-label="button-group">
      {buttons.map((button) => (
        <Button
          disabled={button.isDisabled}
          key={button.value}
          variant={selectedValue === button.value ? "contained" : "outlined"}
          color="primary"
          onClick={() => handleClick(button.value)}
          style={{ position: "relative" }}
          sx={{
            width: "100px",
          }}
          title={button.label}
        >
          <span className="button-content">{button.label}</span>
          {button.isSaved && <Checkmark />}
        </Button>
      ))}
    </StyledButtonGroup>
  );
};

export default ToggleButtons;
