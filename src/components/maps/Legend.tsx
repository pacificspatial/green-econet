import React, { useEffect, useState } from "react";
import { Box, Typography, Switch, IconButton } from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { hazardColors, layerColors } from "@/constants/aoiLayerColors";
import { useTranslation } from "react-i18next";
import { layerConfigs } from "@/config/layers/aoiLayers";
import {
  getColorForRainGardenType,
  getColorForHabitatType,
} from "@/config/layers/resultLayer";
import { moveDrawLayersToTop } from "@/utils/map/displayShape";
import { useAppSelector } from "@/hooks/reduxHooks";
import {
  landUseRegionUsageTypes,
  parkUsageTypes,
} from "@/constants/usageTypes";

interface LegendProps {
  map: mapboxgl.Map | null;
  selectedTab: string | undefined;
  selectedAoi: number;
}

const Legend: React.FC<LegendProps> = ({ map, selectedTab, selectedAoi }) => {
  const { currentUsageType } = useAppSelector((state) => state?.projects);
  const [expanded, setExpanded] = useState(true);

  const defaultLegendStates = {
    locations: true,
    watershed: true,
    parkLayer: true,
    landUseRegion: true,
    roads: true,
    hazardAll: false,
    "layer-hazard-1": false,
    "layer-hazard-2": false,
    "layer-hazard-3": false,
    "layer-hazard-4": false,
    habitatAll: false,
    lizardHabitat: false,
    dragonflyHabitat: false,
    whiteyeHabitat: false,
    typeA: true,
    typeB: true,
    typeC: true,
    // habitat polygon types
    habitatPolygonsAll: false,
    habitatType1: false,
    habitatType2: false,
    habitatType3: false,
  };
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>(
    () => defaultLegendStates
  );

  const { t } = useTranslation();

  const hazardRanges = {
    "layer-hazard-1": "0 - 0.5",
    "layer-hazard-2": "0.5 - 3.0",
    "layer-hazard-3": "3.0 - 5.0",
    "layer-hazard-4": "5.0 - 10.0",
  };

  const habitatLayers = ["lizardHabitat", "dragonflyHabitat", "whiteyeHabitat"];

  useEffect(() => {
    setVisibleLayers(defaultLegendStates);

    Object.keys(visibleLayers).forEach((layerId) => {
      if (map?.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", "visible");
      }
    });

    const raingardenLayerId = "layer-raingarden-points";
    if (selectedTab === "result" && map?.getLayer(raingardenLayerId)) {
      map.setFilter(raingardenLayerId, [
        "match",
        ["get", "raingarden_type"],
        [1, 2, 3],
        true,
        false,
      ]);
      map.setLayoutProperty(raingardenLayerId, "visibility", "visible");
    }

    const habitatPolygonsLayerId = "layer-habitat-polygons";
    if (selectedTab === "result" && map?.getLayer(habitatPolygonsLayerId)) {
      map.setFilter(habitatPolygonsLayerId, [
        "match",
        ["get", "habitat_type"],
        [1, 2, 3],
        true,
        false,
      ]);
      map.setLayoutProperty(habitatPolygonsLayerId, "visibility", "visible");
    }

    // Ensure water hazard layers are visible by default in results tab
    if (selectedTab === "result") {
      Object.keys(hazardRanges).forEach((hazardLayer) => {
        if (map?.getLayer(hazardLayer)) {
          map.setLayoutProperty(hazardLayer, "visibility", "visible");
        }
      });
    }
  }, [selectedTab]);

  const toggleLayer = (
    layerId:
      | keyof typeof layerConfigs
      | "hazardAll"
      | "habitatAll"
      | "habitatPolygonsAll"
      | string
  ) => {
    setVisibleLayers((prev) => {
      const newVisibleLayers = { ...prev };

      if (layerId === "hazardAll") {
        const newState = !prev.hazardAll;
        newVisibleLayers.hazardAll = newState;

        Object.keys(hazardRanges).forEach((hazardLayer) => {
          newVisibleLayers[hazardLayer] = newState;
          if (map?.getLayer(hazardLayer)) {
            map.setLayoutProperty(
              hazardLayer,
              "visibility",
              newState ? "visible" : "none"
            );
          }
        });
      } else if (
        layerId === "typeA" ||
        layerId === "typeB" ||
        layerId === "typeC"
      ) {
        const newState = !prev[layerId];
        newVisibleLayers[layerId] = newState;

        const raingardenLayerId = "layer-raingarden-points";

        if (map?.getLayer(raingardenLayerId)) {
          const activeTypes = ["typeA", "typeB", "typeC"]
            .filter((type) => {
              if (type === layerId) return newState;
              return prev[type];
            })
            .map((type) => {
              if (type === "typeA") return 1;
              if (type === "typeB") return 2;
              if (type === "typeC") return 3;
              return null;
            })
            .filter((t) => t !== null);

          map.setFilter(raingardenLayerId, [
            "match",
            ["get", "raingarden_type"],
            activeTypes,
            true,
            false,
          ]);

          map.setLayoutProperty(
            raingardenLayerId,
            "visibility",
            activeTypes.length > 0 ? "visible" : "none"
          );
        }
      } else if (layerId === "habitatPolygonsAll") {
        const newState = !prev.habitatPolygonsAll;
        newVisibleLayers.habitatPolygonsAll = newState;

        // Update all habitat type toggles to match the master toggle
        newVisibleLayers.habitatType1 = newState;
        newVisibleLayers.habitatType2 = newState;
        newVisibleLayers.habitatType3 = newState;

        const habitatPolygonsLayerId = "layer-habitat-polygons";

        if (map?.getLayer(habitatPolygonsLayerId)) {
          if (newState) {
            // Show all habitat types
            map.setFilter(habitatPolygonsLayerId, [
              "match",
              ["get", "habitat_type"],
              [1, 2, 3],
              true,
              false,
            ]);
          } else {
            // Hide all habitat types
            map.setFilter(habitatPolygonsLayerId, [
              "==",
              ["get", "habitat_type"],
              "none",
            ]);
          }

          map.setLayoutProperty(
            habitatPolygonsLayerId,
            "visibility",
            newState ? "visible" : "none"
          );
        }
      } else if (
        layerId === "habitatType1" ||
        layerId === "habitatType2" ||
        layerId === "habitatType3"
      ) {
        const newState = !prev[layerId];
        newVisibleLayers[layerId] = newState;

        const habitatPolygonsLayerId = "layer-habitat-polygons";

        if (map?.getLayer(habitatPolygonsLayerId)) {
          const activeTypes = ["habitatType1", "habitatType2", "habitatType3"]
            .filter((type) => {
              if (type === layerId) return newState;
              return prev[type];
            })
            .map((type) => {
              if (type === "habitatType1") return 1;
              if (type === "habitatType2") return 2;
              if (type === "habitatType3") return 3;
              return null;
            })
            .filter((t) => t !== null);

          map.setFilter(habitatPolygonsLayerId, [
            "match",
            ["get", "habitat_type"],
            activeTypes,
            true,
            false,
          ]);

          map.setLayoutProperty(
            habitatPolygonsLayerId,
            "visibility",
            activeTypes.length > 0 ? "visible" : "none"
          );

          // Update the master toggle based on individual toggles
          newVisibleLayers.habitatPolygonsAll = activeTypes.length === 3;
        }
      } else if (layerId === "habitatAll") {
        const newState = !prev.habitatAll;
        newVisibleLayers.habitatAll = newState;

        habitatLayers.forEach((habitatLayer) => {
          newVisibleLayers[habitatLayer] = newState;
          const layerName = `layer-${habitatLayer}`;
          if (map?.getLayer(layerName)) {
            map.setLayoutProperty(
              layerName,
              "visibility",
              newState ? "visible" : "none"
            );
          }
        });
      } else if (Object.keys(hazardRanges).includes(layerId)) {
        const newState = !prev[layerId];
        newVisibleLayers[layerId] = newState;

        if (map?.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            "visibility",
            newState ? "visible" : "none"
          );
        }

        if (newState) {
          newVisibleLayers.hazardAll = true;
        } else {
          newVisibleLayers.hazardAll = Object.keys(hazardRanges).some(
            (layer) => (layer === layerId ? newState : newVisibleLayers[layer])
          );
        }
      } else {
        const newState = !prev[layerId];
        newVisibleLayers[layerId] = newState;

        const layerName = `layer-${layerId}`;

        if (map?.getLayer(layerName)) {
          map.setLayoutProperty(
            layerName,
            "visibility",
            newState ? "visible" : "none"
          );
        }

        if (habitatLayers.includes(layerId)) {
          if (newState) {
            newVisibleLayers.habitatAll = true;
          } else {
            newVisibleLayers.habitatAll = habitatLayers.some((layer) =>
              layer === layerId ? newState : newVisibleLayers[layer]
            );
          }
        }
      }
      if (map) moveDrawLayersToTop(map);
      return newVisibleLayers;
    });
  };

  return (
    <>
      {(selectedTab === "aoi" || selectedTab === "simulation") && (
        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            right: 10,
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            maxWidth: "220px",
            width: "fit-content",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontSize: "12px", fontWeight: "bold" }}
            >
              {t("app.legendTitle")}
            </Typography>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
          </Box>

          {expanded && (
            <Box sx={{ mt: 1 }}>
              {/* Potential Area for Raingarden */}
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Switch
                  id="location-switch"
                  size="small"
                  checked={visibleLayers.locations}
                  onChange={() => toggleLayer("locations")}
                />
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    backgroundColor: layerColors.locations,
                    borderRadius: "3px",
                    mr: 1,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "10px" }}>
                  {t("app.potentialAreaofRainGarden")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Switch
                  id="watershed-switch"
                  size="small"
                  checked={visibleLayers.watershed}
                  onChange={() => toggleLayer("watershed")}
                />
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    border: `2px solid ${layerColors.roads}`,
                    borderRadius: "3px",
                    mr: 1,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "10px" }}>
                  {t("app.watershed")}
                </Typography>
              </Box>

              {/*PARK LAYER */}
              {selectedTab === "aoi" &&
                currentUsageType &&
                parkUsageTypes.includes(currentUsageType.value) &&
                selectedAoi === 2 && (
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Switch
                      id="park-switch"
                      size="small"
                      checked={visibleLayers.parkLayer}
                      onChange={() => toggleLayer("parkLayer")}
                    />
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        backgroundColor: layerColors.parkLayer,
                        borderRadius: "3px",
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "10px" }}>
                      {t("app.parks")}
                    </Typography>
                  </Box>
                )}

              {/*LAND USE REGIONS LAYER */}
              {selectedTab === "aoi" &&
                currentUsageType &&
                landUseRegionUsageTypes.includes(currentUsageType.value) &&
                selectedAoi === 2 && (
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Switch
                      id="landUseRegion-switch"
                      size="small"
                      checked={visibleLayers.landUseRegion}
                      onChange={() => toggleLayer("landUseRegion")}
                    />
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        backgroundColor: layerColors.landUseRegion,
                        borderRadius: "3px",
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "10px" }}>
                      {t("app.landUseRegion")}
                    </Typography>
                  </Box>
                )}

              {/* ADD ROAD LAYER HERE */}
              {selectedTab === "aoi" &&
                currentUsageType?.value === "road_planning" && (
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Switch
                      id="roads-switch"
                      size="small"
                      checked={visibleLayers.roads}
                      onChange={() => toggleLayer("roads")}
                    />
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "3px",
                        mr: 1,
                        backgroundColor: layerColors.watershed,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "10px" }}>
                      {t("app.roads")}
                    </Typography>
                  </Box>
                )}

              {/* Water Hazard Map */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Switch
                    id="hazardAll-switch"
                    size="small"
                    checked={visibleLayers.hazardAll}
                    onChange={() => toggleLayer("hazardAll")}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "10px", fontWeight: "bold" }}
                  >
                    {t("app.waterHazardMap")}
                  </Typography>
                </Box>

                {Object.entries(hazardRanges).map(([layerId, range]) => (
                  <Box
                    key={layerId}
                    sx={{ display: "flex", alignItems: "center", ml: 2, mb: 1 }}
                  >
                    <Switch
                      id={`${layerId}-switch`}
                      size="small"
                      checked={visibleLayers[layerId]}
                      onChange={() => toggleLayer(layerId)}
                    />
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        backgroundColor: hazardColors[layerId.split("-")[2]],
                        borderRadius: "3px",
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "10px" }}>
                      {range} m
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Habitat Network */}
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Switch
                    id="habitatAll-switch"
                    size="small"
                    checked={visibleLayers.habitatAll}
                    onChange={() => toggleLayer("habitatAll")}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontSize: "10px", fontWeight: "bold" }}
                  >
                    {t("app.habitatNetwork")}
                  </Typography>
                </Box>

                {/* Japanese Lizard */}
                {habitatLayers.map((habitatLayer) => (
                  <Box
                    key={habitatLayer}
                    sx={{ display: "flex", alignItems: "center", ml: 2, mb: 1 }}
                  >
                    <Switch
                      id={`${habitatLayer}-switch`}
                      size="small"
                      checked={visibleLayers[habitatLayer]}
                      onChange={() => toggleLayer(habitatLayer)}
                    />
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        backgroundColor: layerColors[habitatLayer],
                        borderRadius: "3px",
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "10px" }}>
                      {t(`app.${habitatLayer}`)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {selectedTab === "result" && (
        <Box
          sx={{
            position: "absolute",
            bottom: 20,
            right: 10,
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            maxWidth: "220px",
            width: "fit-content",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontSize: "12px", fontWeight: "bold" }}
            >
              {t("app.legendTitle")}
            </Typography>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandMore /> : <ExpandLess />}
            </IconButton>
          </Box>

          {expanded && (
            <Box sx={{ mt: 1 }}>
              {/* Rain Garden Types Section */}
              <Typography variant="h6" sx={{ fontSize: "12px", mb: 1 }}>
                {t("app.resultLegendTitle")}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Switch
                  id="typeA-switch"
                  size="small"
                  checked={visibleLayers.typeA}
                  onChange={() => toggleLayer("typeA")}
                />
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "3px",
                    backgroundColor: getColorForRainGardenType(1),
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "10px", ml: 1 }}>
                  {t("app.typeALegend")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Switch
                  id="typeB-switch"
                  size="small"
                  checked={visibleLayers.typeB}
                  onChange={() => toggleLayer("typeB")}
                />
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "3px",
                    backgroundColor: getColorForRainGardenType(2),
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "10px", ml: 1 }}>
                  {t("app.typeBLegend")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Switch
                  id="typeC-switch"
                  size="small"
                  checked={visibleLayers.typeC}
                  onChange={() => toggleLayer("typeC")}
                />
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "3px",
                    backgroundColor: getColorForRainGardenType(3),
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "10px", ml: 1 }}>
                  {t("app.typeCLegend")}
                </Typography>
              </Box>

              {/* Water Hazard Map Section in Results */}

              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Switch
                  id="hazardAll-switch-res"
                  size="small"
                  checked={visibleLayers.hazardAll}
                  onChange={() => toggleLayer("hazardAll")}
                />
                <Typography
                  variant="h6"
                  sx={{ fontSize: "12px", mt: 2, mb: 1 }}
                >
                  {t("app.waterHazardMap")}
                </Typography>
              </Box>

              {Object.entries(hazardRanges).map(([layerId, range]) => (
                <Box
                  key={layerId}
                  sx={{ display: "flex", alignItems: "center", ml: 2, mb: 1 }}
                >
                  <Switch
                    id={`${layerId}-switch-res`}
                    size="small"
                    checked={visibleLayers[layerId]}
                    onChange={() => toggleLayer(layerId)}
                  />
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      backgroundColor: hazardColors[layerId.split("-")[2]],
                      borderRadius: "3px",
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontSize: "10px" }}>
                    {range} m
                  </Typography>
                </Box>
              ))}

              {/* Habitat Network Section in Results */}

              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Switch
                  id="habitatPolygonsAll-switch-res"
                  size="small"
                  checked={visibleLayers.habitatPolygonsAll}
                  onChange={() => toggleLayer("habitatPolygonsAll")}
                />
                <Typography
                  variant="h6"
                  sx={{ fontSize: "12px", mt: 2, mb: 1 }}
                >
                  {t("app.habitatNetwork")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 1, ml: 2 }}>
                <Switch
                  id="habitatType1-switch-res"
                  size="small"
                  checked={visibleLayers.habitatType1}
                  onChange={() => toggleLayer("habitatType1")}
                />
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "3px",
                    backgroundColor: getColorForHabitatType(1),
                    mr: 1,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "10px" }}>
                  {t("app.lizardHabitat")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 1, ml: 2 }}>
                <Switch
                  id="habitatType2-switch-res"
                  size="small"
                  checked={visibleLayers.habitatType2}
                  onChange={() => toggleLayer("habitatType2")}
                />
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "3px",
                    backgroundColor: getColorForHabitatType(2),
                    mr: 1,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "10px" }}>
                  {t("app.dragonflyHabitat")}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 1, ml: 2 }}>
                <Switch
                  id="habitatType3-switch-res"
                  size="small"
                  checked={visibleLayers.habitatType3}
                  onChange={() => toggleLayer("habitatType3")}
                />
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "3px",
                    backgroundColor: getColorForHabitatType(3),
                    mr: 1,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "10px" }}>
                  {t("app.whiteyeHabitat")}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </>
  );
};

export default Legend;
