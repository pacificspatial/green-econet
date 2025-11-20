import React, { useEffect, useState } from "react";
import { fetchResultStats } from "@/api/result";
import { useParams } from "react-router-dom";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  styled,
} from "@mui/material";
import { useAppSelector } from "@/hooks/reduxHooks";
import { ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { roundToTwoDecimals } from "@/utils/roundNumber";
import { AOIStatsDataI } from "@/types/AOIStatsData";

// Define types
interface RainGardenType {
  area: number;
  cost: number;
  count: number;
  waterRetention: number;
}

interface Habitat {
  lizard: number;
  dragonfly: number;
  whiteEye: number;
}

interface ResultStats {
  typeA: RainGardenType;
  typeB: RainGardenType;
  typeC: RainGardenType;
  temperature: number;
  landPrice: number;
  habitat: Habitat;
}

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

const ResultStats = () => {
  const [stats, setStats] = useState<ResultStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { projectId } = useParams();
  const aoiStatistics = useAppSelector((state) => state.aoiStatistics);
  const { savedAoi } = useAppSelector((state) => state.savedAoi);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const data = await fetchResultStats(projectId || "");
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchStats();
    }
  }, [projectId]);

  if (isLoading)
    return <CircularProgress sx={{ display: "block", mx: "auto", mt: 4 }} />;
  if (!stats)
    return (
      <Typography sx={{ textAlign: "center", mt: 4 }}>
        {t("app.noResultsAvailable")}...
      </Typography>
    );

  const getComparisonArrow = (
    aoiStatsValue: number,
    resultsStatsValue: number,
    type: string
  ) => {
    if (resultsStatsValue === 0) return <> (0)</>;

    let difference = 0;
    let percentageDiff = 0;
    let displayValue = "";

    switch (type) {
      case "money":
        difference = Math.round(resultsStatsValue) - Math.round(aoiStatsValue);
        percentageDiff = roundToTwoDecimals(
          Math.abs((difference / Math.round(resultsStatsValue)) * 100)
        );
        displayValue = `${percentageDiff}%`;
        break;
      case "temperature":
        difference = resultsStatsValue - aoiStatsValue;
        percentageDiff = roundToTwoDecimals(
          Math.abs(resultsStatsValue - aoiStatsValue)
        );
        displayValue = `${percentageDiff}°C`;
        break;
      case "area":
      default:
        difference = resultsStatsValue - aoiStatsValue;
        percentageDiff = roundToTwoDecimals(
          Math.abs(
            ((resultsStatsValue - aoiStatsValue) / resultsStatsValue) * 100
          )
        );
        displayValue = `${percentageDiff}%`;
        break;
    }

    return (
      <>
        &nbsp;({" "}
        {difference > 0 && <ArrowUpward sx={{ fontSize: 20, paddingTop: 1 }} />}
        {difference < 0 && (
          <ArrowDownward sx={{ fontSize: 20, paddingTop: 1 }} />
        )}
        <Typography component="span">{displayValue}</Typography> )
      </>
    );
  };

  const rainGardenLabels: Record<string, string> = {
    typeA: t("app.typeARainGarden"),
    typeB: t("app.typeBRainGarden"),
    typeC: t("app.typeCRainGarden"),
  };

  const roundedLandPrice = Math.round(stats.landPrice);

  return (
    <Box sx={{ height: "100%", overflow: "auto" }}>
      <StyledBox sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {t("app.resultOfSimulation")}
        </Typography>

        <Typography>[{savedAoi?.aoi_type === 2 && savedAoi.s_name}]</Typography>

        <List sx={{ padding: 0, marginTop: 1 }}>
          <ListItem
            sx={{
              flexDirection: "column",
              alignItems: "flex-start",
              padding: 0,
              py: 0,
            }}
          >
            <List>
              <ListItem sx={{ py: 0 }}>
                <ListItemText
                  primary={` ${t("app.resultsSumOfAreaOfRainGarden")}: ${(
                    stats.typeA.area +
                    stats.typeB.area +
                    stats.typeC.area
                  ).toLocaleString()} m² (${
                    stats.typeA.count + stats.typeB.count + stats.typeC.count
                  } グリッド)`}
                />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemText
                  primary={`${t("app.resultsSumOfThePrice")}: ${(
                    stats.typeA.cost +
                    stats.typeB.cost +
                    stats.typeC.cost
                  ).toLocaleString()} 円`}
                />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemText
                  primary={`${t("app.resultSumOfTheStorageVolume")}: ${(
                    stats.typeA.waterRetention +
                    stats.typeB.waterRetention +
                    stats.typeC.waterRetention
                  ).toLocaleString()} ㎥`}
                />
              </ListItem>
            </List>
          </ListItem>
        </List>

        {/* Potential area for rain garden */}
        <List sx={{ padding: 0, marginTop: 1 }}>
          {(["typeA", "typeB", "typeC"] as const).map((typeKey) => {
            const typeStats = stats[typeKey] as RainGardenType;

            return (
              <ListItem
                key={typeKey}
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  py: 0,
                }}
              >
                <Typography fontWeight="bold">
                  {rainGardenLabels[typeKey]}
                </Typography>
                <List sx={{ pl: 2 }}>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemText
                      primary={` ${t(
                        "app.area"
                      )}: ${typeStats.area.toLocaleString()} m² (${
                        typeStats.count
                      } グリッド)`}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemText
                      primary={`${t(
                        "app.cost"
                      )}: ${typeStats.cost.toLocaleString()} 円`}
                    />
                  </ListItem>
                  <ListItem sx={{ py: 0 }}>
                    <ListItemText
                      primary={`${t(
                        "app.waterRetention"
                      )}: ${typeStats.waterRetention.toLocaleString()} ㎥`}
                    />
                  </ListItem>
                </List>
              </ListItem>
            );
          })}
        </List>

        <List>
          {/* Average temperature */}
          <ListItem sx={{ py: 0 }}>
            <ListItemText
              primary={
                <>
                  <Typography variant="h6" fontWeight="bold">
                    {t("app.heatReliefEffectLabel")}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ pl: 3 }}>
                    {t("app.averageTemperature")}
                  </Typography>
                  <Typography sx={{ pl: 6, display: "inline" }}>
                    {stats.temperature.toFixed(2)}°C
                  </Typography>
                  {savedAoi?.aoi_type &&
                    aoiStatistics[savedAoi?.aoi_type] &&
                    getComparisonArrow(
                      (aoiStatistics[savedAoi?.aoi_type].data as AOIStatsDataI)
                        .minimum_average_temperature,
                      stats.temperature,
                      "temperature"
                    )}
                </>
              }
            />
          </ListItem>

          {/* Inheritance tax street price */}
          <ListItem sx={{ py: 0 }}>
            <ListItemText
              primary={
                <>
                  <Typography variant="h6" fontWeight="bold">
                    {t("app.realEstateValueLabel")}
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" sx={{ pl: 3 }}>
                    {t("app.inheritanceTaxStreetPrice")}
                  </Typography>
                  <Typography sx={{ pl: 6, display: "inline" }}>
                    {roundedLandPrice.toLocaleString()} {t("app.yen")}
                  </Typography>
                  {savedAoi?.aoi_type &&
                    aoiStatistics[savedAoi?.aoi_type] &&
                    getComparisonArrow(
                      (aoiStatistics[savedAoi?.aoi_type].data as AOIStatsDataI)
                        .inheritance_tax_street_price,
                      roundedLandPrice,
                      "money"
                    )}
                </>
              }
            />
          </ListItem>
        </List>

        <Typography variant="h6" fontWeight="bold" sx={{ pl: 2 }}>
          {t("app.ecologicalNetworkConnectivity")}
        </Typography>
        <List>
          <ListItem sx={{ py: 0 }}>
            <ListItemText
              sx={{ pl: 6 }}
              primary={
                <>
                  {t("app.whiteEye")}:{" "}
                  {roundToTwoDecimals(stats.habitat.whiteEye).toLocaleString()}
                  {savedAoi?.aoi_type &&
                    aoiStatistics[savedAoi?.aoi_type] &&
                    getComparisonArrow(
                      (aoiStatistics[savedAoi?.aoi_type].data as AOIStatsDataI)
                        .white_eye_habitat_area,
                      stats.habitat.whiteEye,
                      "area"
                    )}
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ py: 0 }}>
            <ListItemText
              sx={{ pl: 6 }}
              primary={
                <>
                  {t("app.shiokaraDragonfly")}:{" "}
                  {roundToTwoDecimals(stats.habitat.dragonfly).toLocaleString()}
                  {savedAoi?.aoi_type &&
                    aoiStatistics[savedAoi?.aoi_type] &&
                    getComparisonArrow(
                      (aoiStatistics[savedAoi?.aoi_type].data as AOIStatsDataI)
                        .shiokara_dragonfly_habitat_area,
                      stats.habitat.dragonfly,
                      "area"
                    )}
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ py: 0 }}>
            <ListItemText
              sx={{ pl: 6 }}
              primary={
                <>
                  {t("app.japaneseLizard")}:{" "}
                  {roundToTwoDecimals(stats.habitat.lizard).toLocaleString()}
                  {savedAoi?.aoi_type &&
                    aoiStatistics[savedAoi?.aoi_type] &&
                    getComparisonArrow(
                      (aoiStatistics[savedAoi?.aoi_type].data as AOIStatsDataI)
                        .japanese_lizard_habitat_area,
                      stats.habitat.lizard,
                      "area"
                    )}
                </>
              }
            />
          </ListItem>
        </List>
      </StyledBox>
    </Box>
  );
};

export default ResultStats;
