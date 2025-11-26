import { Box } from "@mui/system";
import { styled } from "@mui/material/styles";
import {
  Button,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AoiStatistics from "../AOI/AoiStatistics";
import { useTranslation } from "react-i18next";
import DownloadPopover from "./DownloadPopover";

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "light" ? "#fff" : theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "center",
  height: "100%",
  width: "100%",
  position: "relative",
}));

const StyledGridBottom = styled("div")(({ theme }) => ({
  flex: 1,
  width: "100%",
  minHeight: 0,
  paddingBottom: theme.spacing(6),
}));

const ResultRightPanel = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // For dropdown
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleDownloadClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDownloadSelect = (type: "pdf" | "xlsx") => {
    console.log(`Downloading as ${type}`);
    // Add your download logic here based on the type
    handleClose();
  };

  return (
    <StyledBox>
      {/* Header */}
      <Box
        sx={{
          height: 60,
          width: "100%",
          display: "flex",
          alignItems: "center",
          px: 1,
          gap: 1,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Back button */}
        <IconButton onClick={() => navigate(-1)} sx={{ p: 0.5 }}>
          <ArrowBackIcon fontSize="medium" />
        </IconButton>

        {/* Download button */}
        <Button
          variant="outlined"
          sx={{ ml: "auto", mr: 1, textTransform: "none", px: 2, py: 0.5 }}
          onClick={handleDownloadClick}
          endIcon={
            open ? (
              <ArrowDropUpIcon fontSize="small" />
            ) : (
              <ArrowDropDownIcon fontSize="small" />
            )
          }
        >
          {t("app.download")}
        </Button>

        <DownloadPopover 
          anchorEl={anchorEl}
          onClose={handleClose}
          onSelect={handleDownloadSelect}
        />
      </Box>

      {/* Stats area */}
      <StyledGridBottom>
        <AoiStatistics />
      </StyledGridBottom>
    </StyledBox>
  );
};

export default ResultRightPanel;