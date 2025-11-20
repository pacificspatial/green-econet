import React, { useState } from "react";
import { Box, Grid, Paper, IconButton, Tooltip } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import Map from "@/components/maps/Map";
import LeftPanel from "@/components/common/LeftPanel";

const ProjectsList = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const theme = useTheme();
  const { t } = useTranslation();
  const center: [number, number] = [139.6917, 35.6895];
  const zoom = 12;

  return (
    <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <Grid container sx={{ flex: 1 }}>
        {/* Left Panel */}
        {!collapsed && (
          <Grid
            item
            xs={12}
            md={3}
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
              <LeftPanel collapsed={collapsed} setCollapsed={setCollapsed} />
            </Paper>
          </Grid>
        )}
        {/* Map Component */}
        <Grid
          item
          xs={12}
          md={collapsed ? 12 : 9}
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
              <Map center={center} zoom={zoom} collapsed={collapsed} />
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
    </Box>
  );
};

export default ProjectsList;
