 import { Box } from "@mui/system";
import { styled } from "@mui/material/styles";
import { IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AoiStatistics from "../AOI/AoiStatistics";

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "light" ? "#fff" : theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "center",
  height: "100%",
  width: "100%",
  position: "relative",
}));

const StyledGridBottom = styled("div")(({ theme }) => ({
  flex: 1,
  width: "100%",
  minHeight: "0px",
  paddingBottom: theme.spacing(6),
}));

const ResultRightPanel = () => {
  const navigate = useNavigate();

  return (
    <StyledBox>
      <IconButton 
        onClick={() => navigate(-1)}
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
        }}
      >
        <ArrowBackIcon fontSize="medium" />
      </IconButton>

      {/* Stats area - This contains the area, perimeter, and total sections */}
      <StyledGridBottom>
        <AoiStatistics />
      </StyledGridBottom>
    </StyledBox>
  );
};

export default ResultRightPanel;