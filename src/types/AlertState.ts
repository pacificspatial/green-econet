import type { AlertColor } from "@mui/material";

export interface AlertState {
  open: boolean;
  message: string;
  severity: AlertColor;
}
