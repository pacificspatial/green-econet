import { ClippedItemsMap } from "@/components/result/ClippedItemsMap";
import { MergedItemsMap } from "@/components/result/MergedItemsMap";
import { ResultRightPanel } from "@/components/result/ResultRightpanel";
import { Box, Grid, styled } from "@mui/system";

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
  flex: "0 0 37.5%",
});

const PanelGrid = styled(Grid)({
  flex: "0 0 25%",
  overflow: "hidden",
});

export const Result = () => {
  const center: [number, number] = [138.2529, 36.2048];
  const zoom = 5.5;

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
          <ClippedItemsMap center={center} zoom={zoom} />
        </MapGrid>
        <MapGrid >
          <MergedItemsMap center={center} zoom={zoom} />
        </MapGrid>
        <PanelGrid sx={{ height: "calc(100vh - 64px)" }}>
          <ResultRightPanel />
        </PanelGrid>
      </Container>
    </Box>
  )
};