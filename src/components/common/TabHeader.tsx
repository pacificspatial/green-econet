import React from "react";
import { AppBar, Box, Button, styled } from "@mui/material";
import ToggleButtons from "../utils/ToggleButton";
import { getHeaderToggleButtons } from "@/constants/headerToggleButtons";
import { useTranslation } from "react-i18next";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  paddingLeft: theme.spacing(2.5),
  paddingRight: theme.spacing(1),
  top: 0,
  minHeight: "45px",
  boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)", // Subtle shadow
}));

interface TabHeaderProps {
  onToggleChange: (value: string) => void;
  defaultToggle?: string;
}

const TabHeader: React.FC<TabHeaderProps> = ({
  onToggleChange,
  defaultToggle = "aoi",
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate()
  const handleProjectsClick = ()=>{
    navigate('/')
  }
  return (
    <StyledAppBar position="static" sx={{ zIndex: '100px' }}>
      {/* Left Button */}
      <Button startIcon={<ArrowBackIcon />} variant="contained" color="primary" onClick={handleProjectsClick}>
        {t('app.projects')}
      </Button>
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        <ToggleButtons
          //imported toggle buttons from constants
          buttons={getHeaderToggleButtons(t)}
          onChange={onToggleChange}
          defaultValue={defaultToggle}
          tabStyle={true}
        />
      </Box>
      <Box sx={{minWidth:"100px"}}>
      </Box>
    </StyledAppBar>
  );
};

export default TabHeader;
