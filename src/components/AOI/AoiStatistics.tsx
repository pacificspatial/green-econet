import { Box, styled, Typography, useTheme, Skeleton } from "@mui/material";
import { useTranslation } from "react-i18next";
import AOIStatsDataWrapper from "./AOIStatsData";
import { useAppSelector } from "@/hooks/reduxHooks";

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  textAlign: "center",
  padding: theme.spacing(0),
}));

const StyledBox = styled(Box)(({ theme }) => ({
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
  height: "100%",
  overflowY: "scroll",
  overflowX: "hidden",
}));

const AoiStatistics = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  // Get current AOI status

  // const loading = currentAoiStats?.loading || false;
  // const error = currentAoiStats?.error || null;
  // const statsDatas = currentAoiStats?.data || null;
  const loading =  false;
  const error =  null;
  const statsDatas =  null;

  // Transform the data if it exists and is not "no_stats"
  const transformedData =
    statsDatas && statsDatas !== "no_stats"
      ? Object.entries(statsDatas).map(([title, value]) => ({
          title,
          value: value as number,
        }))
      : [];

  return (
    <Box
      sx={{
        maxWidth: "400px",
        height: "90%",
        margin: "0 auto",
        padding: "20px",
        color: theme.palette.mode === "light" ? "#333" : "#fff",
      }}
    >
      <StyledTypography
        variant="h6"
        fontSize={20}
        gutterBottom
        fontWeight={"bold"}
      >
        {t("app.aoiStatisticsHeading")}
      </StyledTypography>
      <StyledBox>
        {loading ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="start"
            paddingLeft={3}
          >
            <Skeleton variant="text" width="30%" height={30} />
            <Skeleton
              variant="text"
              width="80%"
              height={30}
              sx={{ marginTop: 2 }}
            />
            <Skeleton
              variant="text"
              width="30%"
              height={30}
              sx={{ marginTop: 2 }}
            />
            <Skeleton
              variant="text"
              width="80%"
              height={30}
              sx={{ marginTop: 2 }}
            />
            <Skeleton
              variant="text"
              width="30%"
              height={30}
              sx={{ marginTop: 2 }}
            />
            <Skeleton
              variant="text"
              width="80%"
              height={30}
              sx={{ marginTop: 2 }}
            />
            <Skeleton
              variant="text"
              width="30%"
              height={30}
              sx={{ marginTop: 2 }}
            />
            <Skeleton
              variant="text"
              width="80%"
              height={30}
              sx={{ marginTop: 2 }}
            />
            <Skeleton
              variant="text"
              width="30%"
              height={30}
              sx={{ marginTop: 2 }}
            />
            <Skeleton
              variant="text"
              width="80%"
              height={30}
              sx={{ marginTop: 2 }}
            />
            <Skeleton
              variant="text"
              width="30%"
              height={30}
              sx={{ marginTop: 2 }}
            />
            <Skeleton
              variant="text"
              width="80%"
              height={30}
              sx={{ marginTop: 2 }}
            />
          </Box>
        ) : error ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            pt={15}
          >
            <StyledTypography textAlign="center" color="error">
              {t("app.errorFetchingStatistics")}
            </StyledTypography>
          </Box>
        ) : statsDatas && statsDatas !== "no_stats" ? (
          <AOIStatsDataWrapper items={transformedData} />
        ) : (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            pt={15}
          >
            <StyledTypography textAlign="center">
              {t("app.staticsticsAreNotAvailable")}
            </StyledTypography>
          </Box>
        )}
      </StyledBox>
    </Box>
  );
};

export default AoiStatistics;
