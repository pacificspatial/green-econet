import { Box } from "@mui/system";
import AoiStatistics from "./AoiStatistics";
import { styled } from "@mui/material/styles";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button, Tooltip, CircularProgress } from "@mui/material";
import AlertBox from "../utils/AlertBox";
import type { AlertState } from "@/types/AlertState";
import { useAppSelector } from "@/hooks/reduxHooks";
import {
  MAX_AOI_POLYGON_COUNT,
  MIN_AOI_POLYGON_COUNT,
} from "@/constants/numberConstants";
import { useParams } from "react-router-dom";
import { setProjectAoiMock } from "@/api/project";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { io, Socket } from "socket.io-client";

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
  paddingBottom: 20,
}));

type PipelineStatus = "idle" | "running" | "success" | "failed" | "partial_failure";

const AoiRightPanel = () => {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "info",
  });

  const { projectId } = useParams<{ projectId: string }>();

  const aoiPolygons = useAppSelector((state) => state.aoi.polygons);

  // Local status just for this panel
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const socketRef = useRef<Socket | null>(null);

  const { t } = useTranslation();

  const isRunning = pipelineStatus === "running";
  const isSuccess = pipelineStatus === "success";
  const isFailed =
    pipelineStatus === "failed" || pipelineStatus === "partial_failure";

  // 🔌 Socket listeners for AOI events (filtered by projectId)
  useEffect(() => {
    console.log(
      "[AOI RIGHT] Connecting socket to:",
      import.meta.env.VITE_EP_SOCKET_PORT
    );
    const socket = io(import.meta.env.VITE_EP_SOCKET_PORT, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[AOI RIGHT] Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("[AOI RIGHT] Socket disconnected");
    });

    socket.on("aoi:pipeline_started", (payload) => {
      console.log("[AOI RIGHT] pipeline_started:", payload);
      if (!projectId) return;
      if (payload.projectId !== projectId) return;
      setPipelineStatus("running");
    });

    socket.on("aoi:pipeline_stage", (payload) => {
      console.log("[AOI RIGHT] pipeline_stage:", payload);
      if (!projectId) return;
      if (payload.projectId !== projectId) return;
      // we keep status as "running" here; you could also show stage info if needed
    });

    socket.on("aoi:pipeline_completed", (payload) => {
      console.log("[AOI RIGHT] pipeline_completed:", payload);
      if (!projectId) return;
      if (payload.projectId !== projectId) return;
      // status from backend: "success" | "failed" | "partial_failure"
      setPipelineStatus(payload.status);
    });

    return () => {
      console.log("[AOI RIGHT] Disconnecting socket…");
      socket.disconnect();
    };
  }, [projectId]);

  const handleConfirmClick = async () => {
    if (!projectId) {
      setAlert({
        open: true,
        message: t("app.noProjectSelected") || "No project selected",
        severity: "error",
      });
      return;
    }

    try {
      setAlert({
        open: true,
        message: t("app.aoiProcessingStarted") || "AOI processing started",
        severity: "info",
      });

      console.log("[AOI RIGHT] Calling setProjectAoiMock with:", projectId);
      setPipelineStatus("running"); // immediately show spinner + disable button
      await setProjectAoiMock(projectId);
      // socket events will finalize the status
    } catch (err) {
      console.error("[AOI RIGHT] Error starting AOI pipeline:", err);
      setPipelineStatus("idle");
      setAlert({
        open: true,
        message:
          err instanceof Error
            ? err.message
            : t("app.aoiProcessingFailed") || "Failed to start AOI processing",
        severity: "error",
      });
    }
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
              ? t("app.aoiPolygonsLimitMessage", {
                  minCount: MIN_AOI_POLYGON_COUNT,
                  maxCount: MAX_AOI_POLYGON_COUNT,
                })
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
                isRunning ||
                aoiPolygons.length < MIN_AOI_POLYGON_COUNT ||
                aoiPolygons.length > MAX_AOI_POLYGON_COUNT
              }
            >
              {t("app.setAOI")}
            </Button>
          </span>
        </Tooltip>

        {/* Status indicator beside the button */}
        <Box sx={{ ml: 2, display: "flex", alignItems: "center" }}>
          {isRunning && <CircularProgress size={22} />}
          {isSuccess && <CheckCircleIcon color="success" />}
          {isFailed && <ErrorIcon color="error" />}
        </Box>
      </StyledConfirmBox>
    </StyledBox>
  );
};

export default AoiRightPanel;
