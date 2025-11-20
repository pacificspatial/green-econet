import { fetchSavedAoiThunk } from "@/api/project";
import RightPanel from "@/components/common/RightPanel";
import TabHeader from "@/components/common/TabHeader";
import Map from "@/components/maps/Map";
import AlertBox from "@/components/utils/AlertBox";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { Alert } from "@mui/material";
import Grid from "@mui/material/Grid";
import { Box, styled } from "@mui/system";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import frozenProjects from "@/assets/frozenProjects.json";
import { fetchAOIStatistics } from "@/api/lookup";

const Container = styled(Box)({
  display: "flex",
  justifyContent: "center",
  alignItems: "stretch",
  width: "100%",
  position: "sticky",
  top: 0,
  height: "100%",
});

const MapGrid = styled(Grid)({
  flex: 3,
});

const PanelGrid = styled(Grid)({
  flex: 1,
  overflow: "hidden",
});

const Project = () => {
  const center: [number, number] = [138.2529, 36.2048];
  const zoom = 5.5;
  const { projectId } = useParams();
  const projects = useAppSelector((state) => state.projects.projects);

  // useEffect(() => {
  //   const availableProjectIds = projects.map((project) =>
  //     project.project_id?.toString()
  //   );
  //   if (!availableProjectIds.includes(projectId)) {
  //     window.location.href = "/";
  //   }
  // }, [projectId, projects]);

  useEffect(() => {
    return () => {
      //clean up on project page unmount
    };
  }, []);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        position: "sticky",
        top: 0,
      }}
    >
      <Container>
        <MapGrid>
          <Map center={center} zoom={zoom}/>
        </MapGrid>
        <PanelGrid sx={{ height: "85vh" }}>
          <RightPanel/>
        </PanelGrid>
      </Container>
    </Box>
  );
};

export default Project;
