import { Box, styled } from "@mui/system";
import React from "react";
import AoiRightPanel from "../AOI/AoiRightPanel";

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

const RightPanel: React.FC = () => {
  return (
    <StyledBox>
      <ContentBox>
        <AoiRightPanel />
      </ContentBox>
    </StyledBox>
  );
};

export default RightPanel;
