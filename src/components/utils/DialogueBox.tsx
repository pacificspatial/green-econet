import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  CircularProgress,
  Box,
} from "@mui/material";

interface ReusableDialogProps {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onOk: () => void;
  isLoading?: boolean;
  cancelText?: string;
  okText?: string;
}

const DialogueBox: React.FC<ReusableDialogProps> = ({
  open,
  title,
  message,
  onCancel,
  onOk,
  isLoading = false,
  cancelText = "Cancel",
  okText = "OK",
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>{title}</DialogTitle>
      <Divider />
      <DialogContent>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isLoading}
          color="secondary"
        >
          {cancelText}
        </Button>
        <Button
          variant="contained"
          onClick={onOk}
          disabled={isLoading}
          color="primary"
          autoFocus
        >
          {isLoading ? (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="100%"
            >
              <CircularProgress size={20} color="inherit" />
            </Box>
          ) : (
            okText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DialogueBox;
