import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent,

} from "@mui/material";

import { Project } from "@/types/ProjectData";
import { formatDate } from "@/utils/formateDate";
import { addProject, updateProject } from "@/api/project";
import { useTranslation } from "react-i18next";
import { AlertState } from "@/types/AlertState";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { usageTypes } from "@/constants/usageTypes";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Project | null;
  onSuccess: () => void;
  setAlertState: React.Dispatch<React.SetStateAction<AlertState>>;
  socketId: string
}

const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
  setAlertState,
  socketId
}) => {
  const isEditMode = !!initialData;

  const loading = useAppSelector((state) => state.projects.loading);
  const [formData, setFormData] = useState<
    Pick<Project, "name" | "description" | "note" | "usage_type">
  >({
    name: "",
    description: "",
    note: "",
    usage_type: ""
  });

  const [nameError, setNameError] = useState<boolean>(false);
  const [usageTypeTouched, setUsageTypeTouched] = useState(false);

  const { t } = useTranslation();
  const theme = useTheme();

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        note: initialData.note || "",
        usage_type: initialData.usage_type || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        note: "",
        usage_type: "",
      });
    }
  }, [initialData]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // const fieldMapping: { [key: string]: keyof typeof formData } = {
      //   projectName: "name",
      //   projectDescription: "description",
      //   note: "note",
      // };

      // const fieldName = fieldMapping[name] || name;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Remove error when the user starts typing in the project name field
      if (name === "name" && value.trim() !== "") {
        setNameError(false);
      }
    },
    []
  );

  const handleUsageChange = (e: SelectChangeEvent<string>) => {
    setFormData((prev) => ({ ...prev, usage_type: e.target.value as string }));
  };

  const handleModalClose = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      note: "",
      usage_type: ""
    });
    setNameError(false);
    setUsageTypeTouched(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    try {
      const updatedData: Project = {
        ...initialData,
        ...formData,
      };

      if (isEditMode) {
        const response = await dispatch(
          updateProject({
            cartodb_id: initialData!.project_id as string,
            projectData: updatedData,
          })
        );
        if (response.type === "projects/update/rejected") {
          if (response.payload === "EXISTING_PROJECT") {
            throw new Error(`${t("app.alreadyExistError")}`);
          } else {
            throw new Error(`${t("app.updateProjectFailed")}`);
          }
        } else if (response.type === "projects/update/fulfilled") {
          setAlertState({
            open: true,
            message: `${t("app.updateProjectSuccess")}`,
            severity: "success",
          });
          // Refresh the project list
          onSuccess();
          handleModalClose();
        }
      } else {
        const response = await dispatch(addProject({
          project:  updatedData,
          socketId: socketId,
        }));
        if (response.type === "projects/create/rejected") {
          if (response.payload === "EXISTING_PROJECT") {
            throw new Error(`${t("app.alreadyExistError")}`);
          } else {
            throw new Error(`${t("app.createProjectFailed")}`);
          }
        } else if (response.type === "projects/create/fulfilled") {
          setAlertState({
            open: true,
            message: `${t("app.createProjectSuccess")}`,
            severity: "success",
          });
          // Refresh the project list
          onSuccess();
          handleModalClose();
        }
      }
    } catch (err) {
      setAlertState({
        open: true,
        message:
          err instanceof Error ? err.message : `${t("app.unexpectedError")}`,
        severity: "error",
      });
    }
  }, [
    initialData,
    formData,
    isEditMode,
    onSuccess,
    handleModalClose,
    dispatch,
    t,
  ]);

  const handleNameBlur = useCallback(() => {
    setNameError(formData.name.trim() === "");
  }, [formData.name]);

  const isSubmitDisabled = useMemo(
    () =>
      formData.name.trim() === "" ||
      formData.usage_type.trim() === "" ||
      loading,
    [formData.name, formData.usage_type, loading]
  );

  return (
    <>
      <Modal
        open={isOpen}
        onClose={(event, reason) => {
          if (reason !== "backdropClick") {
            onClose();
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
            sx={{ fontWeight: "bold", mb: 5, color: "primary.main" }}
          >
            {isEditMode ? `${t("app.editProject")}` : `${t("app.addProject")}`}
          </Typography>

          <Grid container spacing={2} >
            {/* Usage type */}
            <Grid item xs={12}>
              <FormControl
                fullWidth
                required
                error={usageTypeTouched && formData.usage_type.trim() === ""}
                disabled={isEditMode}
              >
                <InputLabel id="usage-type-label">{t("app.usageType")}</InputLabel>
                <Select
                  labelId="usage-type-label"
                  id="usage_type"
                  value={formData.usage_type}
                  onChange={handleUsageChange}
                  onBlur={() => setUsageTypeTouched(true)}
                  label={t("app.usageType")}
                  disabled={isEditMode}
                >
                  {
                    usageTypes && Object.entries(usageTypes).map(([key, { value, langKey }]) => (
                      <MenuItem key={key} value={value}>{t(`app.${langKey}`)}</MenuItem>
                    ))
                  }
                </Select>
                {usageTypeTouched && formData.usage_type.trim() === "" && (
                  <FormHelperText>{t("app.usageTypeRequired")}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Project Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                // autoFocus
                label={t("app.projectName")}
                name="name"
                id="projectName"
                value={formData.name}
                onChange={handleChange}
                // Trigger error validation on blur
                onBlur={handleNameBlur}
                required
                // Show error when name is empty
                error={nameError}
                helperText={nameError ? `${t("app.projectNameRequired")}` : ""}
                autoComplete="off"
              />
            </Grid>

            {/* Project Description */}
            <Grid item xs={12}>
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
                sx={{
                  "& textarea": {
                    resize: "none",
                    height: "70px",
                    overflow: "auto",
                  }}}
                slotProps={{
                  input: {
                    inputComponent: "textarea",
                  },
                }}
              />
            </Grid>

            {/* Note */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t("app.note")}
                name="note"
                id="note"
                value={formData.note}
                onChange={handleChange}
                multiline
                minRows={3}
                maxRows={5}
                autoComplete="off"
                sx={{
                  "& textarea": {
                    resize: "none",
                    height: "70px",
                    overflow: "auto",
                  }}}
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
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    <span style={{ fontWeight: "bold" }}>
                      {t("app.owner")}:
                    </span>{" "}
                    {initialData.owner}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    <span style={{ fontWeight: "bold" }}>
                      {t("app.dateCreated")}:
                    </span>{" "}
                    {formatDate(initialData.date_created || "")}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    component="div"
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    <span style={{ fontWeight: "bold" }}>
                      {t("app.dateModified")}:
                    </span>{" "}
                    {formatDate(initialData.date_modified || "")}
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
              disabled={isSubmitDisabled || loading}
            >
              {loading ? `${t("app.processing")}` : `${t("app.save")}`}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Alert Box */}
      {/* <AlertBox
                open={alertState.open}
                onClose={() => setAlertState((prev) => ({ ...prev, open: false }))}
                message={alertState.message}
                severity={alertState.severity}
            /> */}
    </>
  );
};

export default ProjectModal;
