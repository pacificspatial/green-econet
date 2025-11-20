import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
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
import { styled, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import DialogueBox from "../utils/DialogueBox";
import { removeProject, fetchProjects } from "@/api/project";
import ProjectModal from "./ProjectModal";
import { Project } from "@/types/ProjectData";
import AlertBox from "../utils/AlertBox";
import { AlertState } from "@/types/AlertState";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import {
  addProjectDirect,
  clearError,
  removeProjectDirect,
} from "@/redux/slices/projectSlice";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface LeftPanelProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
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

const LeftPanel: React.FC<LeftPanelProps> = ({ collapsed, setCollapsed }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: "success",
  });
  // New state to track job status per project
  const [projectJobStatuses, setProjectJobStatuses] = useState<Record<string, string>>({});

  const { projects, loading, error } = useAppSelector((state) => state.projects);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const iconColor = useMemo(
    () => (theme.palette.mode === "dark" ? "#ffffff" : "inherit"),
    [theme.palette.mode]
  );
  const socketRef = useRef<Socket | null>(null);

  // Set up socket connection to listen for jobStatus events
  useEffect(() => {
    const socket = io(process.env.REACT_APP_RG_SOCKET_PORT);
    socketRef.current = socket;

    socket.on("jobStatus", (data) => {
      if (data && data.projectId && data.status) {
        setProjectJobStatuses((prev) => ({
          ...prev,
          [data.projectId]: data.status,
        }));
      }
    });

    socket.on("newProject", (project) => {
      if (project.clientId !== socket.id) {
        dispatch(addProjectDirect(project.newProject));
      }
    });

    socket.on("deleteProject", (data) => {
      if (data.clientId !== socket.id) {
        dispatch(removeProjectDirect(data.projectId));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  const handleAlert = useCallback(
    (message: string, severity: "success" | "error") => {
      setAlertState({
        open: true,
        message,
        severity,
      });
    },
    []
  );

  useEffect(() => {
    const fetchProjectsData = async () => {
      try {
        await dispatch(fetchProjects()).unwrap();
      } catch (err) {
        handleAlert(
          err instanceof Error ? err.message : t("app.fetchProjectsFailed"),
          "error"
        );
      }
    };
    fetchProjectsData();
  }, [dispatch]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await dispatch(
        removeProject({
          cartodb_id: selectedProject?.project_id || "",
          socketId: socketRef.current?.id || "",
        })
      ).unwrap();
      handleAlert(t("app.deleteProjectSuccess"), "success");
      setSelectedProject(null);
    } catch (err) {
      handleAlert(
        err instanceof Error ? err.message : t("app.deleteProjectFailed"),
        "error"
      );
    } finally {
      setDialogOpen(false);
      setSelectedProject(null);
    }
  }, [dispatch, handleAlert, selectedProject, t]);

  useEffect(() => {
    if (error) {
      handleAlert(error, "error");
      dispatch(clearError());
    }
  }, [error, dispatch, handleAlert]);

  const filteredProjects = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      projects?.filter(
        (project) =>
          project &&
          project.name &&
          project.name.toLowerCase().includes(lowerCaseSearchTerm)
      ) || []
    );
  }, [projects, searchTerm]);

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
    setSelectedProject(null);
  }, []);

  const handleEditProject = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, project: Project) => {
      e.stopPropagation();
      setSelectedProject(project);
      setModalOpen(true);
    },
    []
  );

  const handleDeleteIconClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, project: Project) => {
      e.stopPropagation();
      setSelectedProject(project);
      setDialogOpen(true);
    },
    []
  );

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setSelectedProject(null);
  }, []);

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

      {loading ? (
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
            // Determine status indicator for this project (if any)
            const status = project.project_id
              ? projectJobStatuses[project.project_id]
              : undefined;
            let statusIndicator = null;
            if (status === "initiating" || status === "running") {
              statusIndicator = <CircularProgress size={20} />;
            } else if (status === "success") {
              statusIndicator = (
                <CheckCircleIcon style={{ color: "green", fontSize: 20 }} />
              );
            }
            return (
              <ListItem
                key={project.project_id}
                component="li"
                sx={{ marginBottom: "5px" }}
                onClick={() => handleListItemClick(project.project_id || "")}
              >
                <Tooltip title={project.name} arrow>
                  <ListItemText
                    primary={project.name}
                    sx={{
                      width: "100%",
                      "& .MuiTypography-root": {
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        cursor: "pointer",
                      },
                    }}
                  />
                </Tooltip>
                {statusIndicator && (
                  <Box sx={{ ml: 1, display: "flex", alignItems: "center" }}>
                    {statusIndicator}
                  </Box>
                )}
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
        onSuccess={() => {}}
        setAlertState={setAlertState}
        socketId={socketRef.current?.id || ""}
      />

      <AlertBox
        open={alertState.open}
        onClose={() =>
          setAlertState((prev) => ({ ...prev, open: false, message: "" }))
        }
        message={alertState.message}
        severity={alertState.severity}
      />
    </StyledBox>
  );
};

export default LeftPanel;
