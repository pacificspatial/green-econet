import React, { useEffect, useState } from "react";
import { Box, Paper, IconButton, Tooltip } from "@mui/material";
import Grid from "@mui/material/Grid";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import Map from "@/components/maps/Map";
import LeftPanel from "@/components/common/LeftPanel";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { getAllProjects } from "@/api/project";
import { setProjects } from "@/redux/slices/projectSlice";
import type { AlertState } from "@/types/AlertState";
import AlertBox from "@/components/utils/AlertBox";
import { mapCenter, mapZoom } from "@/constants/mapConstants";

const ProjectsList: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isProjectListLoading, setIsProjectListLoading] = useState(true);
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: "success",
  });
  const theme = useTheme();
  const { t } = useTranslation();

  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsProjectListLoading(true);

        const response = await getAllProjects();
        dispatch(setProjects(response.data));
      } catch (err: any) {
        setAlertState({
          open: true,
          message: err?.response?.data?.message || "Failed to load projects",
          severity: "error",
        });
      } finally {
        setIsProjectListLoading(false);
      }
    };

    fetchAll();
  }, [dispatch]);

  return (
    <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <Grid container sx={{ flex: 1 }}>
        {/* Left Panel */}
        {!collapsed && (
          <Grid
            size={{ xs: 12, md: 3 }}
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Paper
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "hidden",
              }}
            >
              <LeftPanel
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                isProjectListLoading={isProjectListLoading}
                setAlertState={setAlertState}
              />            
            </Paper>
          </Grid>
        )}
        {/* Map Component */}
        <Grid
          size={{ xs: 12, md: collapsed ? 12 : 9 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Paper sx={{ p: 0, flex: 1, width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                flex: 1,
                height: "100%",
                width: "100%",
              }}
            >
              <Map center={mapCenter} zoom={mapZoom} collapsed={collapsed} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Toggle Button with Vertical White Space */}
      {collapsed && (
        <Box
          sx={{
            position: "fixed",
            left: 0,
            top: "15%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            backgroundColor: "background.paper",
            boxShadow: 3,
            borderRadius: "0 8px 8px 0",
            zIndex: 1300,
            paddingY: 2,
            width: "40px",
          }}
        >
          <Tooltip title={t("app.expandPanel")} arrow>
            <IconButton
              onClick={() => setCollapsed(false)}
              sx={{
                color: theme.palette.mode === "dark" ? "#ffffff" : "inherit",
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <AlertBox
        open={alertState.open}
        onClose={() =>
          setAlertState((prev) => ({ ...prev, open: false, message: "" }))
        }
        message={alertState.message}
        severity={alertState.severity}
      />
    </Box>
  );
};

export default ProjectsList;
