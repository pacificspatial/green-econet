import { Box, styled } from "@mui/system";
import React from "react";
import AoiRightPanel from "../AOI/AoiRightPanel";
import SimulationRightPanel from "../simulation/SimulationRightPanel";
import ResultStats from "../result/ResultStats";

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "light" ? "#fff" : theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
  height: "100%",
  width: "100%",
  overflow: "hidden",
}));

const ContentBox = styled(Box)({
  flex: 1,
  width: "100%",
  overflowY: "auto",
});

interface RightPanelProps {
  selectedTab: string;
}

const RightPanel: React.FC<RightPanelProps> = ({ selectedTab }) => {
  return (
    <StyledBox>
      <ContentBox>
        {selectedTab === "aoi" && <AoiRightPanel />}
        {selectedTab === "simulation" && <SimulationRightPanel />}
        {selectedTab === "result" && <ResultStats />}
      </ContentBox>
    </StyledBox>
  );
};

export default RightPanel;
