import { ClippedItemsMap } from "@/components/result/ClippedItemsMap";
import { MergedItemsMap } from "@/components/result/MergedItemsMap";
import ResultRightPanel from "@/components/result/ResultRightPanel";
import { Box, Grid, styled, useTheme } from "@mui/system";
import { useEffect, useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { getPolygonsByProject } from "@/api/project";
import type { ProjectPolygon } from "@/types/ProjectData";
import type { Feature } from "geojson";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { setAoiPolygons } from "@/redux/slices/aoiSlice";
import { IconButton } from "@mui/material";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

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
  transition: "flex 0.35s ease",
});

const PanelGrid = styled(Grid)({
  overflow: "hidden",
  transition: "flex 0.35s ease",
});

export const Result = () => {
  const center: [number, number] = [138.2529, 36.2048];
  const zoom = 5.5;
  const { projectId } = useParams();
  const dispatch = useAppDispatch();
  const { polygons: storedPolygons } = useAppSelector((state) => state.aoi);
  const theme = useTheme();

  const [panelOpen, setPanelOpen] = useState(true);

  const fetchProjectPolygons = useCallback(async () => {
    if (!projectId) return;

    if (storedPolygons && storedPolygons.length > 0) return;

    try {
      const response = await getPolygonsByProject(projectId);

      if (response.success && response.data.polygons) {
        const polygonData = response.data.polygons.map(
          (polygon: ProjectPolygon, index: number) => ({
            id: polygon.id,
            geom: {
              type: "Feature",
              id: polygon.id,
              geometry: polygon.geom,
              properties: {
                name: `Shape ${index + 1}`,
                _id: polygon.id,
              },
            } as Feature,
            area: polygon.area_m2,
            perimeter: polygon.perimeter_m,
          })
        );

        if (polygonData.length > 0) dispatch(setAoiPolygons(polygonData));
      }
    } catch (error) {
      console.error("Error fetching project polygons:", error);
    }
  }, [projectId, storedPolygons, dispatch]);

  useEffect(() => {
    fetchProjectPolygons();
  }, [fetchProjectPolygons]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
      }}
    >
      <Container>

        {/* First Map */}
        <MapGrid 
          sx={{ 
            borderRight: "2px solid #d1d1d1",
            flex: panelOpen ? "0 0 37.5%" : "0 0 50%",
          }}
        >
          <ClippedItemsMap center={center} zoom={zoom} />
        </MapGrid>

        {/* Second Map */}
        <MapGrid
          sx={{
            flex: panelOpen ? "0 0 37.5%" : "0 0 50%",
          }}
        >
          <MergedItemsMap center={center} zoom={zoom} />
        </MapGrid>

        {/* Right Panel */}
        <PanelGrid
          sx={{
            flex: panelOpen ? "0 0 25%" : "0 0 0%",
            position: "relative",
          }}
        >
          {panelOpen && <ResultRightPanel />}
        </PanelGrid>

        {/* COLLAPSE BUTTON */}
        <Box
          sx={{
            position: "absolute",
            right: panelOpen ? "25%" : "0px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 50,
            transition: "right 0.35s ease",
          }}
        >
          <IconButton
            onClick={() => setPanelOpen((prev) => !prev)}
            sx={{
              backgroundColor: theme.palette.background.paper,
              border: "1px solid #ccc",
              borderRadius: 0,
              borderRight: panelOpen ? "none" : "1px solid #ccc",
              borderLeft: panelOpen ? "1px solid #ccc" : "none",
              "&:hover": { backgroundColor: "#f5f5f5" },
              padding: "10px 0px",
            }}
          >
            {panelOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      </Container>
    </Box>
  );
};