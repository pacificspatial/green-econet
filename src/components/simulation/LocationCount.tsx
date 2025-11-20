import { Box, styled, Typography } from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";
const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
}));
interface LocationsCount {
  rain_type: number;
  sub_rain_type: number | null;
  total_area: number;
}
interface LocationCountProps {
  locationCount: LocationsCount;
}
const LocationCount: FC<LocationCountProps> = ({ locationCount }) => {
  const { t } = useTranslation();

  const getTypeLabel = (type: number | null) => {
    switch (type) {
      case 1: return t("app.typeA");
      case 2: return t("app.typeB");
      case 3: return t("app.typeC");
      case 4: return t("app.typeD");
      case 5: return t("app.typeE");
      case 6: return t("app.typeF");
      case 7: return t("app.typeG");
      default: return "";
    }
  };

  const rainTypeLabel = getTypeLabel(locationCount.rain_type);
  const subRainTypeLabel = getTypeLabel(locationCount.sub_rain_type);

  return (
    <Box mb={3} padding={1} paddingLeft={3}>
      <StyledTypography
        variant="subtitle1"
        fontWeight={510}
        gutterBottom
        display="flex"
        alignItems="center"
      >
        {rainTypeLabel}
        {subRainTypeLabel && (
          <>
            <span style={{ margin: "0 8px" }}>→</span>
            {subRainTypeLabel}
          </>
        )}
      </StyledTypography>
      <ul style={{ margin: 0, paddingLeft: "40px" }}>
        <li>
          <StyledTypography>
            {t("app.areaOfShapes")}: {locationCount.total_area.toFixed(2)} m<sup>2</sup>
          </StyledTypography>
        </li>
      </ul>
    </Box>
  );
};

export default LocationCount;
