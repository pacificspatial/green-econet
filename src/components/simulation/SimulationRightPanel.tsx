import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Snackbar,
  Button,
  CircularProgress,
  Typography,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { styled } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import SimulationDetails from "./SimulationDetails";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useParams } from "react-router-dom";
import { executeSimulation, getSimulationDetails } from "../../api/simulation";
import { io } from "socket.io-client";
import SimulationTable from "./SimulationTable";
import SimulationInfoPopup from "./SimulationInfoPopup";
import AlertBox from "../utils/AlertBox";

const StyledBox = styled(Box)(({ theme }) => ({
  position: "relative",
  backgroundColor:
    theme.palette.mode === "light" ? "#f5f5f5" : theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  width: "100%",
}));

const StyledGridBottom = styled("div")(({ theme }) => ({
  flex: 1,
  backgroundColor:
    theme.palette.mode === "light" ? "#f5f5f5" : theme.palette.background.paper,
  width: "100%",
  overflowY: "scroll",

  // ✅ Adds right padding to push content away from the scrollbar
  paddingRight: theme.spacing(2),
  padding: `${theme.spacing(0)} ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)}`,
  paddingBottom: theme.spacing(15),
  "&::-webkit-scrollbar": {
    width: "6px", // Increased width to create space
    backgroundColor: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.primary.light,
    borderRadius: "4px",
    width: "1px", // Keeps thumb thinner to create a padding effect
  },

  "&:hover::-webkit-scrollbar": {
    backgroundColor: theme.palette.action.disabledBackground,
  },
  "&:hover::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.primary.light,
  },
}));

const StyledButtonContainer = styled("div")(({ theme }) => ({
  position: "absolute",
  bottom: 0,
  backgroundColor:
    theme.palette.mode === "light" ? "#f5f5f5" : theme.palette.background.paper,
  left: 0,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  paddingTop: theme.spacing(2),
}));

const StatusContainer = styled("div")({
  display: "flex",
  alignItems: "center",
});

const SimulationRightPanel = () => {
  const { t } = useTranslation();
  const { projectId } = useParams<{ projectId: string }>();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  // simulationStatus: "idle" | "initiating" | "running" | "success" | "error"
  const [simulationStatus, setSimulationStatus] = useState("idle");
  const [simulationProjectId, setSimulationProjectId] = useState(null);
  const { isProjectFrozen } = useAppSelector((state) => state.frozenProject);
  const { savedAoi } = useAppSelector((state) => state.savedAoi);
  const [simulationStartedIndication, setSimulationStartedIndication] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSavedAoiAvailable, setIsSavedAoiAvailable] = useState(false);
  const [simulationDetailsData, setSimulationDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);

  const handleOpenPopup = async () => {
    setDetailsLoading(true);
    setDetailsError("");
    setSimulationDetailsData(null);

    try {
      const response = await getSimulationDetails(projectId || "");      
      if (!response || Object.keys(response).length === 0) {
        throw new Error("NO_DATA");
      }

      setSimulationDetailsData(response);
      setIsPopupOpen(true);    
    } 
    catch (err) {
      console.error("Error loading simulation details", err);
      setDetailsError(t("simulationDetails.simulationDetailsFailedLoading"));
      setAlertOpen(true);
    } 
    finally {
      setDetailsLoading(false);
    }
  };

  // Set up socket connection (adjust URL as needed)
  const socket = useMemo(() => io(process.env.REACT_APP_RG_SOCKET_PORT), []);

  useEffect(() => {
    socket.on("jobStatus", (data) => {
      if (data?.projectId === projectId) {
        if (data?.status) {
          setSimulationStatus(data.status);
        }
        if (data?.projectId) {
          setSimulationProjectId(data.projectId);
        }
      }
    });
    return () => {
      socket.off("jobStatus");
    };
  }, [socket, projectId]);

  useEffect(() => {
    let timer: string | number | NodeJS.Timeout | undefined;
    if (simulationStartedIndication) {
      timer = setTimeout(() => {
        setSimulationStartedIndication(false);
      }, 5000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [simulationStartedIndication]);

  useEffect(() => {
    if (savedAoi && savedAoi.geom) {
      setIsSavedAoiAvailable(true)
    } else {
      setIsSavedAoiAvailable(false)
    }
  }, [savedAoi])

  const handleRunSimulation = async () => {
    try {
      setSimulationStartedIndication(true);
      const simulationResponse = await executeSimulation({
        project_id: projectId,
      });
      console.log("Simulation executed successfully", simulationResponse);
      setSnackbarMessage(t("app.simulationStarted"));
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error executing simulation", error);
      setSnackbarMessage(t("app.errorExecutingSimulation"));
      setSnackbarOpen(true);
      setSimulationStatus("error");
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Disable the button when simulation is in progress
  const isButtonDisabled =
    ["initiating", "running"].includes(simulationStatus) &&
    projectId === simulationProjectId;

  let statusIndicator = null;
  if (projectId === simulationProjectId) {
    switch (simulationStatus) {
      case "initiating":
      case "running":
        statusIndicator = (
          <StatusContainer>
            <CircularProgress size={24} />
            <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 500 }}>
              {t(`app.${simulationStatus}`)}
            </span>
          </StatusContainer>
        );
        break;
      case "success":
        statusIndicator = (
          <StatusContainer>
            <CheckCircleIcon style={{ color: "green" }} />
            <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 500 }}>
              {t("app.success")}
            </span>
          </StatusContainer>
        );
        break;
      case "error":
        statusIndicator = (
          <StatusContainer>
            <span style={{ color: "red", fontSize: 14, fontWeight: 500 }}>
              {t("app.error")}
            </span>
          </StatusContainer>
        );
        break;
    }
  }

  return (
    <StyledBox>
      <StyledGridBottom>
        <SimulationDetails />
        <SimulationTable />
      </StyledGridBottom>
      <StyledButtonContainer>
        <Tooltip
          title={
            !isSavedAoiAvailable
              ? t('app.noSavedAoiAvailable')
              : ''
          }
          disableHoverListener={isSavedAoiAvailable} // tooltip only active when false
        >
          <span>
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenPopup}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
              disabled={isButtonDisabled || isProjectFrozen || !isSavedAoiAvailable || detailsLoading}
              type="button"
            >
              {detailsLoading ? (
                <StatusContainer style={{ display: "flex", alignItems: "center" }}>
                  <CircularProgress size={18} sx={{ mr: 1 }} />
                  {t("simulationDetails.simulationDetailsLoading")}
                </StatusContainer>
              ) : (
                t("app.setConditions")
              )}
            </Button>
          </span>
        </Tooltip>
        {statusIndicator}
        {/* {simulationStartedIndication ? t("app.startSimulationIndicator") : ""} */}
        <Typography sx={{
          px: 2,
          pb: 1,
          textAlign: 'center',
          fontSize: 14.5
        }}>
          {t("app.startSimulationIndicator")}
        </Typography>
      </StyledButtonContainer>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
      <SimulationInfoPopup
        open={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onRunSimulation={handleRunSimulation}
        simulationDetails={simulationDetailsData}   
      />
      <AlertBox
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={detailsError}
        severity="error"
      />
    </StyledBox>
  );
};

export default SimulationRightPanel;
