import { Box } from "@mui/system";
import AoiStatistics from "./AoiStatistics";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Tooltip } from "@mui/material";
import AlertBox from "../utils/AlertBox";
import type { AlertState } from "@/types/AlertState";
import { useAppSelector } from "@/hooks/reduxHooks";
import { MAX_AOI_POLYGON_COUNT, MIN_AOI_POLYGON_COUNT } from "@/constants/numberConstants";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadPopover from "./DownloadPopover";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { useNavigate } from "react-router-dom";
import { setProjectAoi } from "@/api/project";
import { Alert } from "@mui/material";

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

const StyledGridBottom = styled("div")(() => ({
  flex: 1,
  width: "100%",
  minHeight: "0px",
}));

const StyledConfirmBox = styled(Box)(() => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  position: "relative",
  paddingBottom: 20
}));

const AoiRightPanel = () => {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "info",
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const aoiPolygons = useAppSelector((state) => state.aoi.polygons);
  const { selectedProject } = useAppSelector((state) => state.project);
  const { t } = useTranslation();
  const [ loading, setLoading ] = useState(false);

  //Set AOI handler
  const handleConfirmClick = async () => {
    try {
      setLoading(true);
      const response = await setProjectAoi(selectedProject!.id);      
      if(response.success && response.data) {
        //logic after successful AOI set can be added here
        setAlert({
          open: true,
          message: t("app.aoiSetSuccessMessage"),
          severity: "success",
        });
      }
      
    } catch (error) {
      console.error("Error setting AOI:", error);
      setAlert({
        open: true,
        message: t("app.errorSettingAOI"),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownloadClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSelectDownload = (type: "pdf" | "csv") => {
    console.log("Selected:", type);
    setAnchorEl(null);
  };

  return (
    <StyledBox>
      {alert.open && (
        <AlertBox
          open={alert.open}
          onClose={() => setAlert({ ...alert, open: false })}
          message={alert.message}
          severity={alert.severity}
        />
      )}
      <Box 
        sx={{ 
          height: 60, 
          width: "100%", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "flex-start",
          px: 1,
          gap: 1,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`
        }} 
      >
        {/* Back Button with Icon */}
        <IconButton onClick={() => navigate(-1)} sx={{ p: 0.5 }}>
          <ArrowBackIcon fontSize="medium" />
        </IconButton>

        {/* Download Button */}
        <Button
          variant="outlined"
          sx={{ ml: "auto", mr: 1, textTransform: "none", px: 2, py: 0.5 }}
          onClick={handleDownloadClick}
          endIcon={
            anchorEl ? (
              <ArrowDropUpIcon fontSize="small" />
            ) : (
              <ArrowDropDownIcon fontSize="small" />
            )
          }
        >
          {t("app.download")}
        </Button>
      </Box>

      {/* This section takes the remaining space */}
      <StyledGridBottom>
        <AoiStatistics />
      </StyledGridBottom>

      <StyledConfirmBox>
        <Tooltip
          title={
            aoiPolygons.length < MIN_AOI_POLYGON_COUNT ||
            aoiPolygons.length > MAX_AOI_POLYGON_COUNT
              ? t("app.aoiPolygonsLimitMessage", { minCount: MIN_AOI_POLYGON_COUNT, maxCount: MAX_AOI_POLYGON_COUNT })
              : ""
          }
          disableHoverListener={
            !(
              aoiPolygons.length < MIN_AOI_POLYGON_COUNT ||
              aoiPolygons.length > MAX_AOI_POLYGON_COUNT
            )
          }
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >

            {/* Indicator message with balanced spacing */}
            {loading && (
              <Alert
                severity="info"
                sx={{
                  width: "100%",
                  mb: 3.5,
                  textAlign: "center",
                }}
              >
                {t("app.settingAoiMessage")}
              </Alert>
            )}
            <Button
              sx={{ px: 4, py: 2 }}
              color="primary"
              variant="contained"
              onClick={handleConfirmClick}
              disabled={
                aoiPolygons.length < MIN_AOI_POLYGON_COUNT ||
                aoiPolygons.length > MAX_AOI_POLYGON_COUNT ||
                loading
              }
            >
              {t("app.setAOI")}
            </Button>
          </Box>
        </Tooltip>
      </StyledConfirmBox>
      <DownloadPopover
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        onSelect={handleSelectDownload}
      />
    </StyledBox>
  );
};

export default AoiRightPanel;
