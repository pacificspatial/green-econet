import React from "react";
import {
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  // Avatar,
  Typography,
  Box,
  Divider,
  styled,
} from "@mui/material";
import type { Theme } from "@mui/material"
import HomeIcon from "@mui/icons-material/Home";
import LanguageIcon from "@mui/icons-material/Language";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
// import { useAppSelector } from "@/hooks/reduxHooks";

// Props interface
interface NavDrawerProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  handleMenuItemClick: (item: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Styled components
const CustomPopover = styled(Popover)(({ theme }) => ({
  "& .MuiPopover-paper": {
    marginTop: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    minWidth: 240,
  },
}));

// const UserArea = styled(Box)(({ theme }) => ({
//   padding: theme.spacing(2),
//   backgroundColor: theme.palette.background.default,
//   color: theme.palette.text.primary,
//   display: "flex",
//   flexDirection: "column",
//   alignItems: "center",
//   borderBottom: `1px solid ${theme.palette.divider}`,
//   borderTopLeftRadius: theme.shape.borderRadius,
//   borderTopRightRadius: theme.shape.borderRadius,
// }));

const MinimalToggle = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: 60,
  height: 30,
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.grey[800]
      : theme.palette.grey[200],
  borderRadius: 15,
  position: "relative",
  cursor: "pointer",
  padding: "3px",
  boxShadow: theme.shadows[1],
}));

interface ToggleButtonProps {
  isDarkMode: boolean;
  theme?: Theme;
}

const ToggleButton = styled("div")<ToggleButtonProps>(
  ({ theme, isDarkMode }) => ({
    width: 24,
    height: 24,
    backgroundColor: theme?.palette.background.paper,
    borderRadius: "50%",
    position: "absolute",
    left: isDarkMode ? "calc(100% - 27px)" : "3px",
    transition: "left 0.3s ease",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: theme?.palette.text.primary,
    boxShadow: theme?.shadows[2],
  })
);

// CustomListItem component
interface CustomListItemProps {
  onClick?: () => void;
  selected?: boolean;
  children: React.ReactNode;
}

const CustomListItem = ({
  onClick,
  selected,
  children,
}: CustomListItemProps) => (
  <ListItem sx={{ p: 0 }}>
    <ListItemButton
      onClick={onClick}
      selected={selected}
      sx={{
        "&.Mui-selected": {
          backgroundColor: "action.selected",
        },
      }}
    >
      {children}
    </ListItemButton>
  </ListItem>
);

const NavDrawer: React.FC<NavDrawerProps> = ({
  anchorEl,
  open,
  onClose,
  handleMenuItemClick,
  isDarkMode,
  toggleTheme,
}) => {
  const { t } = useTranslation();
  // const userData = useAppSelector((state) => state.auth.userData);

  // const username = userData?.find(
  //   (attr) => attr.Name === "preferred_username"
  // )?.Value;
  // const email = userData?.find((attr) => attr.Name === "email")?.Value;
  // const isAdmin = useAppSelector((state) => state.auth.isAdmin);

  const id = open ? "nav-menu-popover" : undefined;

  return (
    <CustomPopover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
    >
      {/* <UserArea>
        <Avatar
          src="/path/to/your/avatar.jpg"
          sx={{ width: 56, height: 56, mb: 1 }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {username}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {email}
        </Typography>
      </UserArea> */}
      <List sx={{ py: 0, m: 0 }}>
        <CustomListItem onClick={() => handleMenuItemClick("Home")}>
          <ListItemIcon>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("app.home")} />
        </CustomListItem>
        {/* Only allow admin to access */}
        {/* {isAdmin && (
          <CustomListItem onClick={() => handleMenuItemClick("Dashboard")}>
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t("app.dashboard")} />
          </CustomListItem>
        )} */}
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemIcon>
            <LanguageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                  {t("app.language")}
                </Typography>
                <LanguageSwitcher />
              </Box>
            }
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemIcon>
            {isDarkMode ? (
              <Brightness4Icon fontSize="small" />
            ) : (
              <Brightness7Icon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText
            primary={isDarkMode ? t("app.darkMode") : t("app.lightMode")}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              ml: "auto",
            }}
          >
            <MinimalToggle onClick={toggleTheme}>
              <ToggleButton isDarkMode={isDarkMode}>
                {isDarkMode ? (
                  <Brightness4Icon fontSize="small" />
                ) : (
                  <Brightness7Icon fontSize="small" />
                )}
              </ToggleButton>
            </MinimalToggle>
          </Box>
        </ListItem>
        {/* <Divider sx={{ my: 1 }} />
        <CustomListItem onClick={() => handleMenuItemClick("Sign Out")}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t("app.signOut")} />
        </CustomListItem> */}
      </List>
    </CustomPopover>
  );
};

export default NavDrawer;
