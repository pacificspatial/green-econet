import { Box } from "@mui/system";
import AoiStatistics from "./AoiStatistics";
import { styled } from "@mui/material/styles";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Typography } from "@mui/material";
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
  const { t } = useTranslation();

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
