import { Box } from "@mui/system";
import AoiStatistics from "./AoiStatistics";
import { styled } from "@mui/material/styles";
import { useState, useEffect, useMemo } from "react";
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
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useSocket } from "@/context/SocketContext";

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

// 👇 add bottom padding so content doesn't clash with Set AOI row
const StyledGridBottom = styled("div")(({ theme }) => ({
  flex: 1,
  width: "100%",
  minHeight: "0px",
  paddingBottom: theme.spacing(6), // reserve space above the button row
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

interface LocalStage {
  stageKey: string;
  label: string;
  status: "pending" | "success" | "failed";
  step: number;
  totalSteps: number;
}

interface PipelineSummary {
  totalSteps: number;
  succeeded: number;
  failed: number;
}

const AoiRightPanel = () => {
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "info",
  });

  const { projectId } = useParams<{ projectId: string }>();
  const socket = useSocket();

  const aoiPolygons = useAppSelector((state) => state.aoi.polygons);

  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("idle");
  const [stages, setStages] = useState<LocalStage[]>([]);
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(
    null
  );

  const { t } = useTranslation();

  const isRunning = pipelineStatus === "running";
  const isSuccess = pipelineStatus === "success";
  const isFailed =
    pipelineStatus === "failed" || pipelineStatus === "partial_failure";

  const runningStep = useMemo(() => {
    if (!isRunning || stages.length === 0) return undefined;
    const pending = stages.find((s) => s.status === "pending");
    return pending?.step;
  }, [isRunning, stages]);

  // Socket listeners for AOI events specific to this project
  useEffect(() => {
    if (!socket || !projectId) return;

    console.log("[AOI RIGHT] using socket:", socket.id, "for project:", projectId);

    const handleStarted = (payload: any) => {
      console.log("[AOI RIGHT] aoi:pipeline_started:", payload);
      if (payload.projectId !== projectId) return;

      setCurrentPipelineId(payload.pipelineId);
      setPipelineStatus("running");
      setSummary(null);

      const totalSteps = payload.totalSteps ?? 6;
      const initialStages: LocalStage[] = Array.from(
        { length: totalSteps },
        (_, idx) => ({
          stageKey: `STEP_${idx + 1}`,
          label: `Stage ${idx + 1}`,
          status: "pending",
          step: idx + 1,
          totalSteps,
        })
      );
      setStages(initialStages);
    };

    const handleStage = (payload: any) => {
      console.log("[AOI RIGHT] aoi:pipeline_stage:", payload);
      if (payload.projectId !== projectId) return;
      if (currentPipelineId && payload.pipelineId !== currentPipelineId) return;

      setPipelineStatus("running");
      setStages((prev) => {
        const totalSteps = payload.totalSteps ?? prev[0]?.totalSteps ?? 6;
        const stepIndex = (payload.step ?? 1) - 1;

        const copy: LocalStage[] =
          prev.length === totalSteps
            ? [...prev]
            : Array.from({ length: totalSteps }, (_, idx) => {
                const existing = prev[idx];
                return (
                  existing || {
                    stageKey: `STEP_${idx + 1}`,
                    label: `Stage ${idx + 1}`,
                    status: "pending" as const,
                    step: idx + 1,
                    totalSteps,
                  }
                );
              });

        copy[stepIndex] = {
          stageKey: payload.stageKey ?? copy[stepIndex].stageKey,
          label: payload.label ?? copy[stepIndex].label,
          status: payload.status === "failed" ? "failed" : "success",
          step: payload.step,
          totalSteps,
        };

        return copy;
      });
    };

    const handleCompleted = (payload: any) => {
      console.log("[AOI RIGHT] aoi:pipeline_completed:", payload);
      if (payload.projectId !== projectId) return;
      if (currentPipelineId && payload.pipelineId !== currentPipelineId) return;

      setPipelineStatus(payload.status as PipelineStatus);
      if (payload.summary) {
        setSummary({
          totalSteps: payload.summary.totalSteps,
          succeeded: payload.summary.succeeded,
          failed: payload.summary.failed,
        });
      }
    };

    socket.on("aoi:pipeline_started", handleStarted);
    socket.on("aoi:pipeline_stage", handleStage);
    socket.on("aoi:pipeline_completed", handleCompleted);

    return () => {
      socket.off("aoi:pipeline_started", handleStarted);
      socket.off("aoi:pipeline_stage", handleStage);
      socket.off("aoi:pipeline_completed", handleCompleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, projectId, currentPipelineId]);

  const handleConfirmClick = async () => {
    if (!projectId) {
      setAlert({
        open: true,
        message: t("app.noProjectSelected") || "No project selected",
        severity: "error",
      });
      return;
    }

    if (pipelineStatus === "running") {
      console.log("[AOI RIGHT] Ignoring click: pipeline already running");
      return;
    }

    try {
      setAlert({
        open: true,
        message: t("app.aoiProcessingStarted") || "AOI processing started",
        severity: "info",
      });

      console.log("[AOI RIGHT] Calling setProjectAoiMock with:", projectId);
      setPipelineStatus("running");
      setStages([]);
      setSummary(null);
      setCurrentPipelineId(null);

      await setProjectAoiMock(projectId);
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

      {/* Stats + compact timeline */}
      <StyledGridBottom>
        <AoiStatistics />

        {stages.length > 0 && (
          <Box
            sx={{
              width: "100%",
              px: 2,
              pt: 1,
              mb: 1, // 👈 extra margin so it's clearly above the button
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                maxWidth: 260,
              }}
            >
              {stages.map((stage, idx) => {
                const isCurrentRunning =
                  isRunning &&
                  stage.status === "pending" &&
                  stage.step === runningStep;

                let icon;
                if (stage.status === "success") {
                  icon = <CheckCircleIcon fontSize="small" color="success" />;
                } else if (stage.status === "failed") {
                  icon = <ErrorIcon fontSize="small" color="error" />;
                } else if (isCurrentRunning) {
                  icon = <CircularProgress size={16} />;
                } else {
                  icon = (
                    <FiberManualRecordIcon
                      sx={{ fontSize: 12, color: "text.disabled" }}
                    />
                  );
                }

                return (
                  <Box
                    key={stage.stageKey}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    {idx > 0 && (
                      <Box
                        sx={{
                          flex: 1,
                          height: 2,
                          bgcolor: "divider",
                          mx: 0.5,
                        }}
                      />
                    )}
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {icon}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </StyledGridBottom>

      {/* Confirm / Set AOI button + overall pipeline status icon */}
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
