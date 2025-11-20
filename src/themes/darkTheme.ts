import { createTheme } from "@mui/material/styles";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
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
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#ffffff",
      secondary: "#aaaaaa",
    },
    divider: "#444444",
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
          backgroundColor: "#444444",
          borderWidth: "1px", // White shade for divider in dark theme
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
            boxShadow: "0px 3px 5px rgba(0, 0, 0, 0.4)",
          },
        },
        containedSecondary: {
          backgroundColor: "#EB3228",
          color: "#004d40",
          "&:hover": {
            backgroundColor: "#338a3e",
            boxShadow: "0px 3px 5px rgba(0, 0, 0, 0.4)",
          },
        },
        outlinedPrimary: {
          borderColor: "#356CB6",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "rgba(53, 108, 182, 0.1)",
            borderColor: "#356CB6",
          },
        },
        outlinedSecondary: {
          borderColor: "#EB3228",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "rgba(235, 50, 40, 0.1)",
            borderColor: "#EB3228",
          },
        },
        textPrimary: {
          color: "#356CB6",
          "&:hover": {
            backgroundColor: "rgba(53, 108, 182, 0.1)",
          },
        },
        textSecondary: {
          color: "#004d40",
          "&:hover": {
            backgroundColor: "rgba(0, 77, 64, 0.2)",
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
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.4)",
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          "&.Mui-selected": {
            backgroundColor: "#333333",
            "& .MuiListItemIcon-root": {
              color: "#356CB6",
            },
          },
          "&:hover": {
            backgroundColor: "#444444",
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
