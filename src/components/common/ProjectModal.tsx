import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  useTheme,
} from "@mui/material";
import type { ProjectData } from "@/types/ProjectData";
import { formatDate } from "@/utils/common/formateDate";
import { useTranslation } from "react-i18next";
import type { AlertState } from "@/types/AlertState";
import { createProject, updateProject } from "@/api/project";
import type { ProjectParam } from "@/types/ApiHandlers";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { addProject, setSelectedProject, updateProjectById } from "@/redux/slices/projectSlice";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ProjectData | null;
  onSuccess: (project: ProjectData) => void;
  setAlertState: React.Dispatch<React.SetStateAction<AlertState>>;
  socketId: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
  setAlertState,
}) => {
  const isEditMode = !!initialData;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<
    Pick<ProjectData, "name" | "description">
  >({
    name: "",
    description: "",
  });  

  const [nameError, setNameError] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
      });
    }
  }, [initialData]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Remove error when the user starts typing in the project name field
      if (name === "name" && value.trim() !== "") {
        setNameError(false);
      }
    },
    []
  );

  const handleModalClose = useCallback(() => {
    setFormData({
      name: "",
      description: "",
    });
    setNameError(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    // Validate name before submitting
    if (formData.name.trim() === "") {
      setNameError(true);
      return;
    }

    setLoading(true);

    try {
      const projectData: ProjectParam = {
        name: formData.name.trim(),
        description: formData?.description?.trim(),
      };

      if (isEditMode && initialData?.id) {
        // Update existing project
        const updatedProject = await updateProject(initialData.id, projectData);
        dispatch(updateProjectById(updatedProject.data));
        setAlertState({
          open: true,
          message: t("app.updateProjectSuccess"),
          severity: "success",
        });
        dispatch(setSelectedProject(null));
      } else {
        // Create new project
        const newProject = await createProject(projectData);
        dispatch(addProject(newProject.data));

        setAlertState({
          open: true,
          message: t("app.createProjectSuccess"),
          severity: "success",
        });
        onSuccess(newProject.data);
      }
      
      handleModalClose();
    } catch (err) {
      setAlertState({
        open: true,
        message:
          err instanceof Error 
            ? err.message 
            : isEditMode 
              ? t("app.updateProjectFailed") 
              : t("app.createProjectFailed"),
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    isEditMode,
    initialData,
    onSuccess,
    handleModalClose,
    t,
    setAlertState,
  ]);

  const handleNameBlur = useCallback(() => {
    setNameError(formData.name.trim() === "");
  }, [formData.name]);

  const isSubmitDisabled = useMemo(
    () => formData.name.trim() === "" || loading,
    [formData.name, loading]
  );

  return (
    <Modal
      open={isOpen}
      onClose={(_event, reason) => {
        if (reason !== "backdropClick" && !loading) {
          handleModalClose();
        }
      }}
      aria-labelledby="project-modal-title"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 500,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography
          id="project-modal-title"
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 3, color: "primary.main" }}
        >
          {isEditMode ? t("app.editProject") : t("app.addProject")}
        </Typography>

        <Grid container spacing={2}>
          {/* Project Name */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label={t("app.projectName")}
              name="name"
              id="projectName"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleNameBlur}
              required
              error={nameError}
              helperText={nameError ? t("app.projectNameRequired") : ""}
              autoComplete="off"
              disabled={loading}
            />
          </Grid>

          {/* Project Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label={t("app.projectDescription")}
              name="description"
              id="projectDescription"
              value={formData.description}
              onChange={handleChange}
              multiline
              minRows={3}
              maxRows={5}
              autoComplete="off"
              disabled={loading}
              sx={{
                "& textarea": {
                  resize: "none",
                  height: "70px",
                  overflow: "auto",
                },
              }}
              slotProps={{
                input: {
                  inputComponent: "textarea",
                },
              }}
            />
          </Grid>

          {/* Display additional info when in edit mode */}
          {isEditMode && initialData && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ color: theme.palette.text.secondary, mt: 1 }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {t("app.dateCreated")}:
                  </span>{" "}
                  {formatDate(initialData.createdAt || "")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <span style={{ fontWeight: "bold" }}>
                    {t("app.dateModified")}:
                  </span>{" "}
                  {formatDate(initialData.updatedAt || "")}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>

        {/* Footer */}
        <Box
          sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          <Button
            onClick={handleModalClose}
            variant="outlined"
            color="secondary"
            disabled={loading}
          >
            {t("app.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={isSubmitDisabled}
          >
            {loading ? t("app.processing") : t("app.save")}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ProjectModal;