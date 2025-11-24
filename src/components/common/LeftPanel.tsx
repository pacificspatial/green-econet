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
import ProjectModal from "./ProjectModal";
import AlertBox from "../utils/AlertBox";
import type { AlertState } from "@/types/AlertState";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import type { ProjectData } from "@/types/ProjectData";
import { deleteProject, getAllProjects } from "@/api/project";
import { deleteProjectById, setProjects, setSelectedProject } from "@/redux/slices/projectSlice";

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
  const { projects, selectedProject } = useAppSelector((state) => state.project);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isProjectListLoading, setIsProjectListLoading] = useState<boolean>(true);
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: "success",
  });

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const iconColor = useMemo(
    () => (theme.palette.mode === "dark" ? "#ffffff" : "inherit"),
    [theme.palette.mode]
  );
  const socketRef = useRef<Socket | null>(null);
  
  const filteredProjects = useMemo(() => {
    return projects.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  // Set up socket connection to listen for jobStatus events
  useEffect(() => {
    const socket = io(import.meta.env.VITE_EP_SOCKET_PORT);
    socketRef.current = socket;
    // socket event listeners can be added here
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
        setIsProjectListLoading(true);
        const response = await getAllProjects();
        const projects: ProjectData[] = response.data;
        dispatch(setProjects(projects));
      } catch (err) {
        handleAlert(
          err instanceof Error ? err.message : t("app.fetchProjectsFailed"),
          "error"
        );
      } finally {
        setIsProjectListLoading(false); 
      }
    };
    fetchProjectsData();
  }, [dispatch]);

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
  }, []);

  const handleEditProject = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, project: ProjectData) => {
      e.stopPropagation();
      dispatch(setSelectedProject(project));
      setModalOpen(true);
    },
    []
  );

  const handleDeleteIconClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, project: ProjectData) => {
      e.stopPropagation();
      dispatch(setSelectedProject(project));
      setDialogOpen(true);
    },
    []
  );

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    dispatch(setSelectedProject(null));
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
            return (
              <ListItem
                key={project.id}
                component="li"
                sx={{ marginBottom: "5px" }}
                onClick={() => handleListItemClick(project.id)}
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
