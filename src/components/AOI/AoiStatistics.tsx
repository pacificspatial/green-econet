import { Box, styled, Typography, useTheme, Divider } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/hooks/reduxHooks";
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

const StatItem = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: theme.spacing(1, 0),
  borderBottom: `1px solid ${theme.palette.divider}`,
  "&:last-child": {
    borderBottom: "none",
  },
}));

interface AoiStatisticsProps {
  showResultMetrics?: boolean;
}

const AoiStatistics = ({ showResultMetrics = false }: AoiStatisticsProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const aoiPolygons = useAppSelector((state) => state.aoi.polygons);
  const selectedProject = useAppSelector(
    (state) => state.project.selectedProject
  );

  // Get indices from selected project
  const indexBA = selectedProject?.indexba
    ? parseFloat(selectedProject.indexba)
    : 0;
  const indexA = selectedProject?.indexa
    ? parseFloat(selectedProject.indexa)
    : 0;
  const indexB = selectedProject?.indexb
    ? parseFloat(selectedProject.indexb)
    : 0;

  // Total values now come from stored area/perimeter
  const totalArea = aoiPolygons
    ? aoiPolygons.reduce((sum, p) => sum + Number(p.area || 0), 0)
    : 0;

  const totalPerimeter = aoiPolygons
    ? aoiPolygons.reduce((sum, p) => sum + Number(p.perimeter || 0), 0)
    : 0;

  // Calculate height for scrollbox based on whether metrics are shown
  const scrollBoxHeight = showResultMetrics
    ? "calc(100% - 240px)"
    : "calc(100% - 100px)";

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
        {t("app.statsTitle")}
      </StyledTypography>

      {/* Scrollable shape list */}
      <ScrollBox sx={{ height: scrollBoxHeight }}>
        {aoiPolygons.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            pt={10}
          >
            <StyledTypography>{t("app.statsAreNotAvailable")}</StyledTypography>
          </Box>
        ) : (
          aoiPolygons.map((polygon, idx) => {
            const area = polygon.area;
            const perimeter = polygon.perimeter;

            const rawName = polygon.geom?.properties?.name || "";
            console.log(polygon);

            const [label, number] = rawName.split(" ");
            const translatedLabel = t(`app.${label?.toLowerCase()}`);

            return (
              <Box
                key={polygon.geom.id || idx}
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
                    <ListItemText
                      primaryTypographyProps={{
                        fontSize: "16px",
                        color: theme.palette.text.primary,
                      }}
                      primary={`${t("app.area")}: ${Number(area).toFixed(
                        2
                      )} m²`}
                    />
                  </ListItem>

                  <ListItem disableGutters sx={{ py: 0.3 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <CircleIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText
                      primaryTypographyProps={{
                        fontSize: "16px",
                        color: theme.palette.text.primary,
                      }}
                      primary={`${t("app.perimeter")}: ${Number(
                        perimeter
                      ).toFixed(2)} m`}
                    />
                  </ListItem>
                </List>

                {idx !== aoiPolygons.length - 1 && <Divider sx={{ mt: 3 }} />}
              </Box>
            );
          })
        )}
      </ScrollBox>

      {/* Fixed TOTAL section */}
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
            minHeight: showResultMetrics ? "180px" : "auto",
          }}
        >
          {/* Heading */}
          <StyledTypography
            sx={{ fontWeight: "bold", fontSize: "17px", pb: 1 }}
          >
            {t("app.total")}
          </StyledTypography>

          {/* Items list (uniform size) */}
          <List disablePadding>
            <ListItem disableGutters sx={{ py: 0.3 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <CircleIcon sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{
                  fontSize: "16px",
                  color: theme.palette.text.primary,
                }}
                primary={`${t("app.area")}: ${Number(totalArea).toFixed(2)} m²`}
              />
            </ListItem>

            <ListItem disableGutters sx={{ py: 0.3 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                <CircleIcon sx={{ fontSize: 8 }} />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{
                  fontSize: "16px",
                  color: theme.palette.text.primary,
                }}
                primary={`${t("app.perimeter")}: ${Number(
                  totalPerimeter
                ).toFixed(2)} m`}
              />
            </ListItem>
          </List>

          {showResultMetrics && (
            <>
              <Divider sx={{ my: 2 }} />

              {/* Secondary heading */}
              <StyledTypography
                sx={{ fontWeight: "bold", fontSize: "17px", pb: 1 }}
              >
                {t("app.indexValue")}
              </StyledTypography>

              {/* Metric rows – same font size for labels + values */}
              <StatItem>
                <Typography
                  sx={{ fontSize: "16px", color: theme.palette.text.primary }}
                >
                  {t("app.indexba")}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                >
                  {indexBA.toFixed(3)}
                </Typography>
              </StatItem>

              <StatItem>
                <Typography
                  sx={{ fontSize: "16px", color: theme.palette.text.primary }}
                >
                  {t("app.indexa")}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                >
                  {indexA.toFixed(3)}
                </Typography>
              </StatItem>

              <StatItem>
                <Typography
                  sx={{ fontSize: "14px", color: theme.palette.text.primary }}
                >
                  {t("app.indexb")}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                  }}
                >
                  {indexB.toFixed(3)}
                </Typography>
              </StatItem>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default AoiStatistics;
