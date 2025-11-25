import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  IconButton,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Tooltip,
  ButtonGroup,
  CircularProgress,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ClearIcon from "@mui/icons-material/Clear";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { styled, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import DialogueBox from "../utils/DialogueBox";
import ProjectModal from "./ProjectModal";
import type { AlertState } from "@/types/AlertState";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useNavigate } from "react-router-dom";
import type { ProjectData } from "@/types/ProjectData";
import { deleteProject } from "@/api/project";
import {
  deleteProjectById,
  setSelectedProject,
} from "@/redux/slices/projectSlice";
import {
  pipelineStarted,
  pipelineStageUpdated,
  pipelineCompleted,
} from "@/redux/slices/aoiPipelineSlice";
import { useSocket } from "@/context/SocketContext";

interface LeftPanelProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isProjectListLoading: boolean;
  setAlertState: React.Dispatch<React.SetStateAction<AlertState>>;
}

const StyledBox = styled(Box)(() => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "hidden",
}));

const StyledActionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadius,
    "& fieldset": {
      borderColor: theme.palette.grey[300],
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
  "& .MuiInputAdornment-root .MuiIconButton-root": {
    color: theme.palette.primary.main,
  },
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  "&:hover": {
    color: theme.palette.primary.main,
  },
  color: theme.palette.primary.main,
}));

const StyledList = styled(List)(({ theme }) => ({
  flex: 1,
  overflowY: "auto",
  padding: theme.spacing(1),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
  "&::-webkit-scrollbar": {
    width: "2px",
    backgroundColor: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "transparent",
    borderRadius: "4px",
  },
  "&:hover::-webkit-scrollbar": {
    backgroundColor: theme.palette.action.disabledBackground,
  },
  "&:hover::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.primary.light,
  },
  "& .MuiListItem-root": {
    transition: "background-color 0.2s ease",
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    "&:hover": {
      backgroundColor: theme.palette.action.selected,
    },
  },
}));

const LeftPanel: React.FC<LeftPanelProps> = ({
  collapsed,
  setCollapsed,
  isProjectListLoading,
  setAlertState,
}) => {
  const { projects, selectedProject } = useAppSelector(
    (state) => state.project
  );
  const aoiPipelineByProject = useAppSelector(
    (state) => state.aoiPipeline.byProjectId
  );

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // track completions only for this mount
  const [recentlyCompleted, setRecentlyCompleted] = useState<
    Record<string, boolean>
  >({});

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const socket = useSocket();

  const iconColor = useMemo(
    () => (theme.palette.mode === "dark" ? "#ffffff" : "inherit"),
    [theme.palette.mode]
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [projects, searchTerm]
  );

  // Socket → Redux mapping
  useEffect(() => {
    if (!socket) return;

    console.log("[LEFT PANEL] using socket:", socket.id);

    const handleStarted = (payload: any) => {
      console.log("[LEFT PANEL] aoi:pipeline_started:", payload);
      dispatch(
        pipelineStarted({
          projectId: payload.projectId,
          pipelineId: payload.pipelineId,
          totalSteps: payload.totalSteps,
          startedAt: payload.startedAt,
        })
      );
      // when a new run starts, clear previous completion flag for that project
      setRecentlyCompleted((prev) => {
        const copy = { ...prev };
        delete copy[payload.projectId];
        return copy;
      });
    };

    const handleStage = (payload: any) => {
      console.log("[LEFT PANEL] aoi:pipeline_stage:", payload);
      dispatch(
        pipelineStageUpdated({
          projectId: payload.projectId,
          pipelineId: payload.pipelineId,
          stageKey: payload.stageKey,
          label: payload.label,
          status: payload.status,
          step: payload.step,
          totalSteps: payload.totalSteps,
        })
      );
    };

    const handleCompleted = (payload: any) => {
      console.log("[LEFT PANEL] aoi:pipeline_completed:", payload);
      dispatch(
        pipelineCompleted({
          projectId: payload.projectId,
          pipelineId: payload.pipelineId,
          status: payload.status,
          completedAt: payload.completedAt,
        })
      );
      // mark this project as "recently completed" for this mount
      setRecentlyCompleted((prev) => ({
        ...prev,
        [payload.projectId]: true,
      }));
    };

    socket.on("aoi:pipeline_started", handleStarted);
    socket.on("aoi:pipeline_stage", handleStage);
    socket.on("aoi:pipeline_completed", handleCompleted);

    return () => {
      socket.off("aoi:pipeline_started", handleStarted);
      socket.off("aoi:pipeline_stage", handleStage);
      socket.off("aoi:pipeline_completed", handleCompleted);
    };
  }, [socket, dispatch]);

  const handleAlert = useCallback(
    (message: string, severity: "success" | "error") => {
      setAlertState({
        open: true,
        message,
        severity,
      });
    },
    [setAlertState]
  );

  const handleDeleteConfirm = useCallback(async () => {
    try {
      setLoading(true);
      await deleteProject(selectedProject!.id);
      dispatch(deleteProjectById(selectedProject!.id));
      handleAlert(t("app.deleteProjectSuccess"), "success");
      dispatch(setSelectedProject(null));
    } catch (err) {
      handleAlert(
        err instanceof Error ? err.message : t("app.deleteProjectFailed"),
        "error"
      );
    } finally {
      setLoading(false);
      setDialogOpen(false);
      dispatch(setSelectedProject(null));
    }
  }, [dispatch, handleAlert, selectedProject, t]);

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleAddNewProject = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    dispatch(setSelectedProject(null));
  }, [dispatch]);

  const handleEditProject = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, project: ProjectData) => {
      e.stopPropagation();
      dispatch(setSelectedProject(project));
      setModalOpen(true);
    },
    [dispatch]
  );

  const handleDeleteIconClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, project: ProjectData) => {
      e.stopPropagation();
      dispatch(setSelectedProject(project));
      setDialogOpen(true);
    },
    [dispatch]
  );

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    dispatch(setSelectedProject(null));
  }, [dispatch]);

  const toggleCollapse = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed]);

  const handleListItemClick = (itemId: string) => {
    navigate(`/project/${itemId}`);
  };

  return (
    <StyledBox>
      <StyledActionContainer
        sx={{
          borderBottom: `2px solid ${theme.palette.primary.main}`,
          paddingBottom: 2,
          flexDirection: "column",
        }}
      >
        {!collapsed && (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <Button
                onClick={handleAddNewProject}
                color="primary"
                aria-label="add project"
                sx={{ padding: "15px 10px" }}
              >
                <AddCircleIcon />
                <Typography fontWeight={"bold"} paddingLeft={1}>
                  {t("app.newProject")}
                </Typography>
              </Button>
              <Tooltip
                title={
                  collapsed ? t("app.expandPanel") : t("app.collapsePanel")
                }
                arrow
              >
                <IconButton
                  onClick={toggleCollapse}
                  sx={{ color: iconColor }}
                  aria-label="collapse panel"
                >
                  {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </IconButton>
              </Tooltip>
            </Box>
            <StyledTextField
              label={t("app.search")}
              id={t("app.search")}
              variant="outlined"
              value={searchTerm}
              onChange={handleSearch}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={clearSearch}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </>
        )}
      </StyledActionContainer>

      {isProjectListLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
        </Box>
      ) : !collapsed && filteredProjects.length > 0 ? (
        <StyledList sx={{ mx: 1 }}>
          {filteredProjects?.map((project) => {
            const pipelineInfo = aoiPipelineByProject[project.id];
            const aoiStatus = pipelineInfo?.status;
            const showCompletionIcon = recentlyCompleted[project.id];

            // derive counts from stages if available
            const totalSteps =
              pipelineInfo?.stages?.[0]?.totalSteps ??
              pipelineInfo?.totalSteps ??
              6;
            const completedSteps = pipelineInfo?.stages
              ? pipelineInfo.stages.filter(
                  (s: { status: string }) => s.status !== "pending"
                ).length
              : 0;

            return (
              <ListItem
                key={project.id}
                component="li"
                sx={{ marginBottom: "5px" }}
                onClick={() => handleListItemClick(project.id)}
              >
                <Tooltip title={project.name} arrow>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <span
                          style={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {project.name}
                        </span>

                        {/* AOI pipeline status for this project */}
                        {aoiStatus === "running" && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              ml: 1,
                            }}
                          >
                            <CircularProgress size={16} />
                            <Typography
                              variant="caption"
                              sx={{ ml: 0.5, minWidth: 32 }}
                            >
                              {completedSteps}/{totalSteps}
                            </Typography>
                          </Box>
                        )}

                        {showCompletionIcon && aoiStatus === "success" && (
                          <CheckCircleIcon
                            fontSize="small"
                            color="success"
                            sx={{ ml: 1 }}
                          />
                        )}

                        {showCompletionIcon &&
                          (aoiStatus === "failed" ||
                            aoiStatus === "partial_failure") && (
                            <ErrorIcon
                              fontSize="small"
                              color="error"
                              sx={{ ml: 1 }}
                            />
                          )}
                      </Box>
                    }
                    sx={{
                      width: "100%",
                      "& .MuiTypography-root": {
                        cursor: "pointer",
                      },
                    }}
                  />
                </Tooltip>
                <ButtonGroup sx={{ display: "flex", alignItems: "center" }}>
                  <Tooltip title={t("app.editProject")} arrow>
                    <span>
                      <StyledIconButton
                        aria-label="edit"
                        onClick={(e) => handleEditProject(e, project)}
                      >
                        <EditIcon />
                      </StyledIconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={t("app.delete")} arrow>
                    <span>
                      <StyledIconButton
                        aria-label="delete"
                        onClick={(e) => handleDeleteIconClick(e, project)}
                        sx={{
                          color: "#EB3228",
                          "&:hover": {
                            color: "#EB3228",
                            backgroundColor: "transparent",
                          },
                        }}
                      >
                        <DeleteIcon />
                      </StyledIconButton>
                    </span>
                  </Tooltip>
                </ButtonGroup>
              </ListItem>
            );
          })}
        </StyledList>
      ) : (
        !collapsed && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                marginTop: 4,
                fontWeight: "medium",
                color: "text.secondary",
                letterSpacing: "0.1rem",
              }}
            >
              {t("app.noProjectsMessage")}
            </Typography>
          </Box>
        )
      )}

      <DialogueBox
        open={dialogOpen}
        title={t("app.deleteDialogueTitle")}
        message={t("app.deleteDialogueMessage", {
          projectName: selectedProject?.name || "",
        })}
        onCancel={handleDialogClose}
        onOk={handleDeleteConfirm}
        isLoading={loading}
        cancelText={t("app.cancel")}
        okText={t("app.delete")}
      />

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialData={selectedProject || null}
        onSuccess={(project) => {
          navigate(`/project/${project.id}`);
        }}
        setAlertState={setAlertState}
        socketId={socket?.id ?? ""}
      />
    </StyledBox>
  );
};

export default LeftPanel;
