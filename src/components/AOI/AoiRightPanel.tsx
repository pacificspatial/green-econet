import { Box } from "@mui/system";
import AoiStatistics from "./AoiStatistics";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Tooltip } from "@mui/material";
import AlertBox from "../utils/AlertBox";
import type { AlertState } from "@/types/AlertState";
import { useAppSelector } from "@/hooks/reduxHooks";
import { MAX_AOI_POLYGON_COUNT, MIN_AOI_POLYGON_COUNT } from "@/constants/numberConstants";

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
  const aoiPolygons = useAppSelector((state) => state.aoi.polygons)
  const { t } = useTranslation();

  const handleConfirmClick = async () => {
    // Here handle the set AOI action
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
          <span>
            <Button
              sx={{ px: 4, py: 2 }}
              color="primary"
              variant="contained"
              onClick={handleConfirmClick}
              disabled={
                aoiPolygons.length < MIN_AOI_POLYGON_COUNT ||
                aoiPolygons.length > MAX_AOI_POLYGON_COUNT
              }
            >
              {t("app.setAOI")}
            </Button>
          </span>
        </Tooltip>
      </StyledConfirmBox>
    </StyledBox>
  );
};

export default AoiRightPanel;
