import { Box } from "@mui/system";
import AoiStatistics from "./AoiStatistics";
import { styled, useTheme } from "@mui/material/styles";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Typography } from "@mui/material";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { useParams } from "react-router-dom";
import AlertBox from "../utils/AlertBox";
import { AlertState } from "@/types/AlertState";

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

const StyledGrid = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  minHeight: "70px",
  maxHeight: "75px",
  paddingTop: theme.spacing(0),
  paddingBottom: theme.spacing(0),
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  backgroundColor: theme.palette.info.light + "22", // subtle tint (added transparency)
  borderLeft: `4px solid ${theme.palette.info.main}`,
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.shape.borderRadius,
  fontSize: "0.9rem",
  color: theme.palette.text.secondary,
  lineHeight: 1.5,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
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
  minHeight: "50px",
  maxHeight: "70px",
  position: "relative",
  bottom: 5,
}));

const AoiRightPanel = () => {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "info",
  });
  const [emptyAoiMessage, setEmptyAoiMessage] = useState("");
  
  const dispatch = useAppDispatch();
  const { projectId } = useParams();
  const { t } = useTranslation();
  const theme = useTheme();

  const handleSetAlert = useCallback(
    (message: string, severity: "success" | "error" | "info") => {
      setAlert({ open: true, message, severity });
    },
    []
  );


  const handleConfirmClick = async () => {
    console.log("Confirm clicked");
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

      <Typography color="red" fontSize={14}>
        {emptyAoiMessage}
      </Typography>
      <StyledConfirmBox>
        <Button
          sx={{ position: "fixed", bottom: 5 }}
          color="primary"
          variant="contained"
          onClick={handleConfirmClick}
          disabled={false}
        >
          {t("app.confirmAOI")}
        </Button>
      </StyledConfirmBox>
    </StyledBox>
  );
};

export default AoiRightPanel;
