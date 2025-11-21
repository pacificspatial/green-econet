import React from "react";
import { Snackbar, Alert } from "@mui/material";
import type { AlertColor } from "@mui/material";

interface AlertBoxProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity?: AlertColor;
  duration?: number;
}

const AlertBox: React.FC<AlertBoxProps> = ({
  open,
  onClose,
  message,
  severity = "info",
  duration = 5000,
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{ zIndex: "500px" }}
    >
      <Alert
        onClose={() => onClose()}
        severity={severity}
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AlertBox;
