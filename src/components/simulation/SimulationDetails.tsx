import {
  getLocationArea,
} from "@/api/project";
import {
  Box,
  Typography,
  styled,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LocationCount from "./LocationCount";
import { useAppSelector } from "@/hooks/reduxHooks";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/system";

// Styled components
const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

interface LocationsCount {
  rain_type: number;
  sub_rain_type: number | null;
  total_area: number;
}

const SimulationDetails = () => {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { shapes } = useAppSelector((state) => state.shapes);
  const [locationAreas, setLocationArea] = useState<LocationsCount[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const fetchLocationArea = async (projectId: string) => {
    setIsLoading(true);
    try {
      const res = await getLocationArea(projectId);
      setLocationArea(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchLocationArea(projectId);
    }
  }, [shapes, projectId]);

  return (
    <Box sx={{ height: "auto" }}>
      <StyledTypography
        variant="h6"
        fontSize={20}
        gutterBottom
        fontWeight={"bold"}
        padding={3}
        paddingBottom={0}
      >
        {t("app.addedRainGardenTypes")}
      </StyledTypography>

      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "auto",
            padding: theme.spacing(3),
          }}
        >
          <CircularProgress size={24} />
          <StyledTypography sx={{ ml: 2 }}>
            {t("app.loadingLocationArea")}
          </StyledTypography>
        </Box>
      ) : locationAreas && locationAreas.length > 0 ? (
        locationAreas.map((locationArea, index) => (
          <LocationCount locationCount={locationArea} key={index} />
        ))
      ) : (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "auto",
            paddingBottom: theme.spacing(1),
            paddingTop: theme.spacing(1)
          }}
        >
          <StyledTypography textAlign="center">
            {t("app.noRaigardernType")}
          </StyledTypography>
        </Box>
      )}
    </Box>
  );
};

export default SimulationDetails;