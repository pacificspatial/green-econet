import RightPanel from "@/components/common/RightPanel";
import Map from "@/components/maps/Map";
import { useAppDispatch } from "@/hooks/reduxHooks";
import { clearAoiPolygons } from "@/redux/slices/aoiSlice";
import { setSelectedProject } from "@/redux/slices/projectSlice";
import Grid from "@mui/material/Grid";
import { Box, styled } from "@mui/system";
import { useEffect } from "react";

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
  const dispatch = useAppDispatch();
  const center: [number, number] = [139.7545870646046, 35.68260566814629];
  const zoom = 10;

  useEffect(() => {
    return () => {
      dispatch(setSelectedProject(null));
      dispatch(clearAoiPolygons());
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
        <PanelGrid sx={{ height: "calc(100vh - 64px)" }}>
          <RightPanel />
        </PanelGrid>
      </Container>
    </Box>
  );
};

export default Project;
