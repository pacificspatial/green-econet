import RightPanel from "@/components/common/RightPanel";
import Map from "@/components/maps/Map";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { setSelectedProject } from "@/redux/slices/projectSlice";
import Grid from "@mui/material/Grid";
import { Box, styled } from "@mui/system";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

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
  const { projects } = useAppSelector((state) => state.project);
  const dispatch = useAppDispatch();
  const { projectId } = useParams()
  const center: [number, number] = [138.2529, 36.2048];
  const zoom = 5.5;

  useEffect(() => {
    const availableProjectIds = projects.map((project) =>
      project.id?.toString()
    );
    if (!availableProjectIds.includes(projectId as string)) {
      window.location.href = "/";
    }
  }, [projectId, projects]);

  useEffect(() => {
    return () => {
      dispatch(setSelectedProject(null));
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
          <Map center={center} zoom={zoom} />
        </MapGrid>
        <PanelGrid sx={{ height: "calc(100vh-64px)" }}>
          <RightPanel />
        </PanelGrid>
      </Container>
    </Box>
  );
};

export default Project;
