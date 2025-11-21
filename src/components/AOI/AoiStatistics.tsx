import { Box, styled, Typography, useTheme, Divider } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/hooks/reduxHooks";
import { calculateArea } from "@/utils/geometery/calculateArea";
import { calculatePerimeter } from "@/utils/geometery/calculatePerimeter";
import { List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

const ScrollBox = styled(Box)(({ theme }) => ({
  "&::-webkit-scrollbar": {
    width: "2px",
    backgroundColor: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "transparent",
    borderRadius: "4px",
  },
  "&:hover::-webkit-scrollbar": {
    backgroundColor: theme.palette.action.disabledBackground,
  },
  "&:hover::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.primary.light,
  },
  height: "calc(100% - 100px)", 
  overflowY: "auto",
  overflowX: "hidden",
}));

const AoiStatistics = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const aoiPolygons = useAppSelector((state) => state.aoi.polygons);

  const totalArea = aoiPolygons.reduce(
    (sum, p) => sum + calculateArea(p),
    0
  );

  const totalPerimeter = aoiPolygons.reduce(
    (sum, p) => sum + calculatePerimeter(p),
    0
  );

  return (
    <Box
      sx={{
        maxWidth: "400px",
        height: "100%",
        margin: "0 auto",
        padding: "20px",
        pb: "100px",
        position: "relative",
      }}
    >
      {/* Heading */}
      <StyledTypography
        variant="h6"
        fontSize={20}
        fontWeight="bold"
        textAlign="center"
        gutterBottom
      >
        {t("app.shapeStatistics")}
      </StyledTypography>

      {/* Scrollable shape list */}
      <ScrollBox>
        {aoiPolygons.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            pt={10}
          >
            <StyledTypography>
              {t("app.statsAreNotAvailable")}
            </StyledTypography>
          </Box>
        ) : (
          aoiPolygons.map((polygon, idx) => {
            const area = calculateArea(polygon);
            const perimeter = calculatePerimeter(polygon);  
            const rawName = polygon?.properties?.name; 
            const [label, number] = rawName.split(" ");          
            const translatedLabel = t(`app.${label.toLowerCase()}`); 
            return (
              <Box 
                key={polygon.id || idx} 
                sx={{
                  px: 3,
                  py: 2,
                }}
              >
                <StyledTypography fontWeight="bold" fontSize={17} pb={1}>
                  {translatedLabel} {number}
                </StyledTypography>
                <List disablePadding>
                  <ListItem disableGutters sx={{ py: 0.3 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={`${t("app.area")}: ${area.toFixed(2)} m²`} />
                  </ListItem>

                  <ListItem disableGutters sx={{ py: 0.3 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={`${t("app.perimeter")}: ${perimeter.toFixed(2)} m`} />
                  </ListItem>
                </List>
                {idx !== aoiPolygons.length - 1 && <Divider sx={{ mt: 3}}/>}
              </Box>
            );
          })
        )}
      </ScrollBox>

      {/* Fixed TOTAL section */}
      {aoiPolygons.length > 0 && (
        <Box
          sx={{
            width: "100%",
            px: 3,
            py: 3,
            background:
              theme.palette.mode === "light"
                ? "#fff"
                : theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Total heading */}
          <StyledTypography fontWeight="bold" fontSize={17} pb={1}>
            {t("app.total")}
          </StyledTypography>

          {/* Make it like list items */}
          <List disablePadding>
            <ListItem disableGutters sx={{ py: 0.3 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <CircleIcon sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText
                primary={`${t("app.area")}: ${totalArea.toFixed(2)} m²`}
              />
            </ListItem>

            <ListItem disableGutters sx={{ py: 0.3 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <CircleIcon sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText
                primary={`${t("app.perimeter")}: ${totalPerimeter.toFixed(2)} m`}
              />
            </ListItem>
          </List>
        </Box>
      )}
    </Box>
  );
};

export default AoiStatistics;
