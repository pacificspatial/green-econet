import { Box } from "@mui/system";
import AoiStatistics from "./AoiStatistics";
import { styled } from "@mui/material/styles";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Tooltip,
  CircularProgress,
  Typography,
  Alert,
} from "@mui/material";
import { useAppSelector } from "@/hooks/reduxHooks";
import {
  MAX_AOI_POLYGON_COUNT,
  MIN_AOI_POLYGON_COUNT,
} from "@/constants/numberConstants";
import { useParams } from "react-router-dom";
import { setProjectAoiMock } from "@/api/project";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
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

// keep padding so button row has breathing room
const StyledGridBottom = styled("div")(({ theme }) => ({
  flex: 1,
  width: "100%",
  minHeight: "0px",
  paddingBottom: theme.spacing(6),
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
  const { projectId } = useParams<{ projectId: string }>();
  const socket = useSocket();
  const { t } = useTranslation();

  const aoiPolygons = useAppSelector((state) => state.aoi.polygons);

  const [pipelineStatus, setPipelineStatus] =
    useState<PipelineStatus>("idle");
  const [stages, setStages] = useState<LocalStage[]>([]);
  const [summary, setSummary] = useState<PipelineSummary | null>(null);
  const [currentPipelineId, setCurrentPipelineId] =
    useState<string | null>(null);

  // loading just for the initial POST /mock-set-aoi call
  const [loading, setLoading] = useState(false);

  const isRunning = pipelineStatus === "running";
  const isSuccess = pipelineStatus === "success";
  const isFailed =
    pipelineStatus === "failed" || pipelineStatus === "partial_failure";

  const totalSteps = useMemo(() => {
    if (stages.length > 0) {
      return stages[0].totalSteps ?? stages.length;
    }
    return 6; // default mock total
  }, [stages]);

  // number of completed stages (success or failed) – starts at 0
  const completedSteps = useMemo(() => {
    if (stages.length === 0) return 0;
    return stages.filter((s) => s.status !== "pending").length;
  }, [stages]);

  // Socket listeners for AOI events specific to this project
  useEffect(() => {
    if (!socket || !projectId) return;

    console.log(
      "[AOI RIGHT] using socket:",
      socket.id,
      "for project:",
      projectId
    );

    const handleStarted = (payload: any) => {
      console.log("[AOI RIGHT] aoi:pipeline_started:", payload);
      if (payload.projectId !== projectId) return;

      setCurrentPipelineId(payload.pipelineId);
      setPipelineStatus("running");
      setSummary(null);

      const steps = payload.totalSteps ?? 6;
      const initialStages: LocalStage[] = Array.from(
        { length: steps },
        (_, idx) => ({
          stageKey: `STEP_${idx + 1}`,
          label: `Stage ${idx + 1}`,
          status: "pending",
          step: idx + 1,
          totalSteps: steps,
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
        const steps = payload.totalSteps ?? prev[0]?.totalSteps ?? 6;
        const stepIndex = (payload.step ?? 1) - 1;

        const copy: LocalStage[] =
          prev.length === steps
            ? [...prev]
            : Array.from({ length: steps }, (_, idx) => {
                const existing = prev[idx];
                return (
                  existing || {
                    stageKey: `STEP_${idx + 1}`,
                    label: `Stage ${idx + 1}`,
                    status: "pending" as const,
                    step: idx + 1,
                    totalSteps: steps,
                  }
                );
              });

        copy[stepIndex] = {
          stageKey: payload.stageKey ?? copy[stepIndex].stageKey,
          label: payload.label ?? copy[stepIndex].label,
          status: payload.status === "failed" ? "failed" : "success",
          step: payload.step,
          totalSteps: steps,
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
      console.warn(
        "[AOI RIGHT] No project selected, ignoring Set AOI click"
      );
      return;
    }

    if (pipelineStatus === "running") {
      console.log("[AOI RIGHT] Ignoring click: pipeline already running");
      return;
    }

    try {
      console.log("[AOI RIGHT] Calling setProjectAoiMock with:", projectId);
      setPipelineStatus("running");
      setStages([]);
      setSummary(null);
      setCurrentPipelineId(null);
      setLoading(true);

      await setProjectAoiMock(projectId);
      // pipeline events handled via socket
    } catch (err) {
      console.error("[AOI RIGHT] Error starting AOI pipeline:", err);
      setPipelineStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledBox>
      {/* Stats */}
      <StyledGridBottom>
        <AoiStatistics />
        {/* no extra stage UI – progress is shown as X/Y next to spinner */}
      </StyledGridBottom>

      {/* Set AOI button + overall status + stage counter */}
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
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{ width: "100%" }}
          >
            {/* Inline info alert from incoming branch */}
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
                isRunning ||
                aoiPolygons.length < MIN_AOI_POLYGON_COUNT ||
                aoiPolygons.length > MAX_AOI_POLYGON_COUNT ||
                loading
              }
            >
              {t("app.setAOI")}
            </Button>
          </Box>
        </Tooltip>

        <Box sx={{ ml: 2, display: "flex", alignItems: "center" }}>
          {isRunning && (
            <>
              <CircularProgress size={22} />
              <Typography variant="body2" sx={{ ml: 1, minWidth: 48 }}>
                {completedSteps}/{totalSteps}
              </Typography>
            </>
          )}
          {isSuccess && <CheckCircleIcon color="success" />}
          {isFailed && <ErrorIcon color="error" />}
        </Box>
      </StyledConfirmBox>
    </StyledBox>
  );
};

export default AoiRightPanel;
