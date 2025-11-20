import { createTheme } from "@mui/material/styles";

export const defaultTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#356CB6",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#EB3228",
      contrastText: "#004d40",
    },
    error: {
      main: "#EB3228",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f9f9f9", // Slightly off-white for a softer look
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#777777",
    },
    divider: "#e0e0e0",
  },
  typography: {
    h1: {
      fontSize: "2.5rem",
      fontWeight: 500,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 500,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 500,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 500,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 500,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
    },
    body2: {
      fontSize: "0.875rem",
    },
  },
  components: {
    MuiDivider: {
      styleOverrides: {
        root: {
          borderWidth: "1px",
          backgroundColor: "#e0e0e0", // Divider color for light theme
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "none",
          padding: "6px 16px",
        },
        containedPrimary: {
          backgroundColor: "#356CB6",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#388E3C",
            boxShadow: "0px 3px 5px rgba(0, 0, 0, 0.2)",
          },
        },
        containedSecondary: {
          backgroundColor: "#EB3228",
          color: "#004d40",
          "&:hover": {
            backgroundColor: "#338a3e",
            boxShadow: "0px 3px 5px rgba(0, 0, 0, 0.2)",
          },
        },
        outlinedPrimary: {
          borderColor: "#356CB6",
          color: "#356CB6",
          "&:hover": {
            backgroundColor: "rgba(76, 175, 80, 0.08)",
          },
        },
        outlinedSecondary: {
          borderColor: "#004d40",
          color: "#004d40",
          "&:hover": {
            backgroundColor: "rgba(0, 77, 64, 0.08)",
          },
        },
        textPrimary: {
          color: "#356CB6",
          "&:hover": {
            backgroundColor: "rgba(76, 175, 80, 0.08)",
          },
        },
        textSecondary: {
          color: "#004d40",
          "&:hover": {
            backgroundColor: "rgba(0, 77, 64, 0.08)",
          },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: "12px",
          width: 300,
          overflow: "visible",
          padding: "16px",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          "&.Mui-selected": {
            backgroundColor: "#e3f2fd",
            "& .MuiListItemIcon-root": {
              color: "#356CB6",
            },
          },
          "&:hover": {
            backgroundColor: "#f5f5f5",
            "& .MuiListItemIcon-root": {
              color: "#356CB6",
            },
          },
          padding: "10px",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: 64,
          height: 64,
          marginBottom: "10px",
        },
      },
    },
  },
});
