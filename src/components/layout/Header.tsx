import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  MenuItem,
  Select,
  styled,
  useTheme,
  IconButton,
} from "@mui/material";
import type { SelectChangeEvent } from '@mui/material';
import { useTranslation } from "react-i18next";
import NavDrawer from "./NavDrawer";
import { useBasemap } from "@/hooks/useBasemap";
import { basemapStyles } from "@/constants/basemapStyles";
import { useThemeContext } from "@/hooks/useThemeContext";
import MenuIcon from "@mui/icons-material/Menu";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/reduxHooks";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "light" ? "#fff" : theme.palette.background.paper,
  color: theme.palette.mode === "light" ? "#333" : "#fff",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  borderBottom: `2px solid ${theme.palette.primary.main}`,
  borderTop: `1px solid ${theme.palette.primary.main}`,
}));

const HeaderContainer = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(1, 2),
}));

const FancyTypography = styled(Typography)(({ theme }) => ({
  fontWeight: "bold",
  color: theme.palette.text.primary,
}));

const RightContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(4),
  [theme.breakpoints.down("sm")]: {
    gap: theme.spacing(2),
  },
}));

const BasemapContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
  "& .MuiSelect-icon": {
    color: theme.palette.text.primary,
  },
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
}));

const Header = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const theme = useTheme();
  const { basemap, setBasemap } = useBasemap();
  const { theme: currentTheme, toggleTheme } = useThemeContext();
  const { selectedProject } = useAppSelector((state) => state.project);

  const isDarkMode = currentTheme === "dark";

  const handleBasemapChange = (event: SelectChangeEvent<unknown>) => {
    const newValue = event.target.value as string;
    if (basemapStyles.some((style) => style.value === newValue)) {
      setBasemap(newValue);
    }
  };

  const navigateHome = () => {
    navigate("/");
  };

  const handleDrawerToggle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuItemClick = (item: string) => {
    switch (item) {
      case "Home":
        navigate("/");
        break;
      case "Dashboard":
        navigate("/dashboard");
        break;
      case "About Us":
        navigate("/about");
        break;
      case "Sign Out":
        // logout(signOut);
        break;
      default:
        break;
    }
  };

  const getHeaderTitle = () => {
    if (pathname === "/") {
      return t("app.projectList");
    } else if (pathname.includes("/projectreport")) {
      return t("app.projectEvaluationResult");
    } else if (pathname === "/project") {
      return t("app.addProject");
    } else if (
      pathname.includes("/project") &&
      pathname.split("/").length > 2
    ) {
      return selectedProject?.name;
    }
    return "";
  };

  return (
    <StyledAppBar position="relative" sx={{ zIndex: "200px" }}>
      <Typography
        variant="h5"
        sx={{
          position: "absolute",
          left: "25%",
          top: "30%",
          fontWeight: "bold",
        }}
      >
        {getHeaderTitle()}
      </Typography>
      <HeaderContainer>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: theme.spacing(2) }}
          onClick={navigateHome}
        >
          <Typography
            sx={{
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Eco-Net
          </Typography>
        </Box>
        <RightContainer>
          <BasemapContainer>
            <FancyTypography variant="body1">
              {t("app.basemap")}
            </FancyTypography>
            <Box sx={{ minWidth: 120 }}>
              <StyledSelect
                id="basename"
                name="basename"
                value={basemap}
                onChange={handleBasemapChange}
                displayEmpty
                inputProps={{ "aria-label": "Basemap" }}
              >
                {basemapStyles.map((style) => (
                  <MenuItem key={style.value} value={style.value}>
                    {t(`app.${style.translationKey}`)}
                  </MenuItem>
                ))}
              </StyledSelect>
            </Box>
          </BasemapContainer>
          <Box onClick={handleDrawerToggle}>
            <IconButton edge="start" color="inherit" aria-label="menu">
              <MenuIcon />
            </IconButton>
          </Box>
        </RightContainer>
      </HeaderContainer>

      <NavDrawer
        anchorEl={anchorEl}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        handleMenuItemClick={handleMenuItemClick}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    </StyledAppBar>
  );
};

export default Header;
