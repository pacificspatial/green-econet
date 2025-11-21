import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  SxProps,
  Theme,
} from "@mui/material";

interface LoaderProps {
  text?: string;
  sx?: SxProps<Theme>;
}

const Loader: React.FC<LoaderProps> = ({ text = "Loading...", sx = {} }) => {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        ...sx,
      }}
    >
      <CircularProgress size={60} sx={{ color: "white", mb: 2 }} />
      {text && (
        <Typography
          variant="h6"
          sx={{
            color: "white",
            textAlign: "center",
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );
};

export default Loader;
