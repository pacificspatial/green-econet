import { useCallback, useEffect, useRef, useState } from "react";
import { initializeMap } from "@/utils/map/mapUtils";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useBasemap } from "@/hooks/useBasemap";
import { useParams } from "react-router-dom";
import { getMergedBuffer125GreenResult, getMergedGreenResult } from "@/api/result";
import type { Feature, Geometry } from "geojson";
import type { ClippedBuffer125Green } from "@/types/ClippedData";
import { addLayer, removeLayer } from "@/utils/map/addLayer";
import {
  MERGED_BUFFER125_LAYER_CONFIG,
  MERGED_GREEN_LAYER_CONFIG,
  PROJECT_LAYER_CONFIG,
  PROJECT_POLYGONS_LAYER_CONFIG,
} from "@/constants/layerConfig";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/hooks/reduxHooks";
import AlertBox from "../utils/AlertBox";
import Loader from "../common/Loader";
import type { AlertState } from "@/types/AlertState";
import { fitMapToFeatures } from "@/utils/map/fitMapToFeature";
import type { AlertColor } from "@mui/material";
import type {
  MergedItemsMapProp,
  PolygonFeatureProperties,
  PolygonGeoJSON,
  AddLayerOptions,
} from "@/types/Map";

// 🆕 map sync helpers
import {
  registerRightMap,
  syncFromRight,
} from "@/utils/map/mapSync";

export const MergedItemsMap: React.FC<MergedItemsMapProp> = ({ center, zoom }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { basemap } = useBasemap();
  const { projectId } = useParams();
  const { t } = useTranslation();
  const { selectedProject } = useAppSelector((state) => state.project);
  const { polygons: storedPolygons } = useAppSelector((state) => state.aoi);

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>("");
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "info",
  });

  const handleSetAlert = useCallback(
    (message: string, severity: AlertColor) => {
      setAlert({ open: true, message, severity });
    },
    []
  );

  /**
   * Load and add merged layers in correct order
   * Order: Green (bottom) -> Buffer125 -> Project Boundary (top of data layers)
   */
  const getMergedLayers = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !projectId) return null;

    setLoading(true);
    setLoadingText(t("app.loadingResult") || "Loading results...");

    try {
      // Fetch both layers in parallel
      const [buffer125Response, greenResponse] = await Promise.all([
        getMergedBuffer125GreenResult(projectId as string),
        getMergedGreenResult(projectId as string),
      ]);

      let allFeatures: Feature<Geometry>[] = [];

      // === LAYER 1 (BOTTOM): ADD GREEN LAYER ===
      if (greenResponse.success && greenResponse.data) {
        const records = Array.isArray(greenResponse.data)
          ? greenResponse.data
          : [greenResponse.data];

        const layerData = (records as ClippedBuffer125Green[])
          .filter((record) => record.geom)
          .map((record) => ({
            geom: record.geom!,
            properties: {
              id: record.id,
              project_id: record.project_id,
              src_id: record.src_id,
              uid: record.uid,
              ...record.properties,
            },
          }));

        if (layerData.length > 0) {
          const features = layerData.map((data) => ({
            type: "Feature" as const,
            geometry: data.geom,
            properties: data.properties,
          }));
          allFeatures = [...allFeatures, ...features];

          // Add green layer (no beforeId - becomes bottom layer)
          addLayer(
            map,
            `layer-${MERGED_GREEN_LAYER_CONFIG.id}`,
            {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: layerData.map((d) => ({
                  type: "Feature",
                  geometry: d.geom,
                  properties: d.properties,
                })),
              },
            },
            {
              type: MERGED_GREEN_LAYER_CONFIG.type,
              paint: MERGED_GREEN_LAYER_CONFIG.paint,
            }
          );

          // Wait for layer to be added
          await new Promise<void>((resolve) => {
            if (
              map.loaded() &&
              map.getLayer(`layer-${MERGED_GREEN_LAYER_CONFIG.id}`)
            ) {
              resolve();
            } else {
              map.once("idle", () => resolve());
            }
          });
        }
      }

      // === LAYER 2 (MIDDLE): ADD BUFFER125 LAYER ===
      if (buffer125Response.success && buffer125Response.data) {
        const records = Array.isArray(buffer125Response.data)
          ? buffer125Response.data
          : [buffer125Response.data];

        const layerData = (records as ClippedBuffer125Green[])
          .filter((record) => record.geom)
          .map((record) => ({
            geom: record.geom!,
            properties: {
              id: record.id,
              project_id: record.project_id,
              src_id: record.src_id,
              uid: record.uid,
              ...record.properties,
            },
          }));

        if (layerData.length > 0) {
          const features = layerData.map((data) => ({
            type: "Feature" as const,
            geometry: data.geom,
            properties: data.properties,
          }));
          allFeatures = [...allFeatures, ...features];

          // Add buffer layer (will be above green)
          addLayer(
            map,
            `layer-${MERGED_BUFFER125_LAYER_CONFIG.id}`,
            {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: layerData.map((d) => ({
                  type: "Feature",
                  geometry: d.geom,
                  properties: d.properties,
                })),
              },
            },
            {
              type: MERGED_BUFFER125_LAYER_CONFIG.type,
              paint: MERGED_BUFFER125_LAYER_CONFIG.paint,
            }
          );

          // Wait for layer to be added
          await new Promise<void>((resolve) => {
            if (
              map.loaded() &&
              map.getLayer(`layer-${MERGED_BUFFER125_LAYER_CONFIG.id}`)
            ) {
              resolve();
            } else {
              map.once("idle", () => resolve());
            }
          });
        }
      }

      // === LAYER 3: ADD PROJECT BOUNDARY LAYER ===
      if (selectedProject?.geom) {
        const boundaryLayerData = [
          {
            geom: selectedProject.geom,
            properties: {
              id: selectedProject.id,
              name: selectedProject.name,
            },
          },
        ];

        // Wait for map to be idle before adding boundary layer
        await new Promise<void>((resolve) => {
          if (map.loaded()) {
            resolve();
          } else {
            map.once("idle", () => resolve());
          }
        });

        // Add boundary layer (will be above buffer)
        addLayer(
          map,
          `layer-${PROJECT_LAYER_CONFIG.id}`,
          {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: boundaryLayerData.map((d) => ({
                type: "Feature",
                geometry: d.geom,
                properties: d.properties,
              })),
            },
          },
          {
            type: PROJECT_LAYER_CONFIG.type,
            paint: PROJECT_LAYER_CONFIG.paint,
          }
        );

        // Wait for boundary layer to be added
        await new Promise<void>((resolve) => {
          if (
            map.loaded() &&
            map.getLayer(`layer-${PROJECT_LAYER_CONFIG.id}`)
          ) {
            resolve();
          } else {
            map.once("idle", () => resolve());
          }
        });
      }

      return allFeatures.length > 0 ? allFeatures : null;
    } catch (error) {
      console.error("Error in fetching merged layers", error);
      setAlert({
        open: true,
        message: t("app.errorLoadingLayers") || "Error loading layers",
        severity: "error",
      });
      return null;
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  }, [projectId, selectedProject, t]);

  /**
   * Load and add project polygons as layers
   * This should be added LAST to appear on top
   */
  const addProjectPolygonsLayer = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    try {
      // Get polygons from Redux store
      const polygonData = storedPolygons;

      if (polygonData && polygonData.length > 0) {
        // Add layer using the generic addLayer function
        addLayer(
          map as maplibregl.Map,
          `layer-${PROJECT_POLYGONS_LAYER_CONFIG.id}`,
          {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: polygonData.map((d: {
                id: string;
                geom: Feature | Geometry;
              }) => {
                // Handle both Feature and Geometry types
                const geometry: Geometry =
                  "geometry" in d.geom
                    ? (d.geom.geometry as Geometry)
                    : (d.geom as Geometry);
                const properties: PolygonFeatureProperties =
                  "properties" in d.geom
                    ? (d.geom.properties as PolygonFeatureProperties)
                    : { id: d.id };

                return {
                  type: "Feature",
                  geometry: geometry,
                  properties: properties,
                };
              }),
            } as PolygonGeoJSON,
          },
          {
            type: PROJECT_POLYGONS_LAYER_CONFIG.type,
            paint: PROJECT_POLYGONS_LAYER_CONFIG.paint,
          } as AddLayerOptions
        );

        // Wait for layer to be added
        await new Promise<void>((resolve) => {
          if (
            map.loaded() &&
            map.getLayer(`layer-${PROJECT_POLYGONS_LAYER_CONFIG.id}`)
          ) {
            resolve();
          } else {
            map.once("idle", () => resolve());
          }
        });

        // Store features for fitting bounds
        interface PolygonLayerItem {
          geom: Feature | Geometry;
          properties?: {
            id: string;
            name: string;
          };
          area?: number;
          perimeter?: number;
        }

        const features: Feature<Geometry>[] = polygonData.map(
          (data: PolygonLayerItem) => {
            // Handle both Feature and Geometry types
            const geometry =
              "geometry" in data.geom
                ? data.geom.geometry
                : data.geom;
            const properties =
              "properties" in data.geom
                ? (data.geom as any).properties
                : data.properties;

            return {
              type: "Feature" as const,
              geometry: geometry as Geometry,
              properties: properties || {},
            };
          }
        );

        return features;
      }
      return null;
    } catch (error) {
      console.error("Error adding project polygons layer", error);
      handleSetAlert(t("app.errorFetchingPolygons"), "error");
      return null;
    }
  }, [storedPolygons, t, handleSetAlert]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map using the helper function
    const map = initializeMap({
      container: mapContainerRef.current,
      center: center,
      zoom: zoom,
      basemap: basemap,
      highResolution: true,
    });

    mapRef.current = map;

    // 🆕 register this as the RIGHT map and attach sync listener
    registerRightMap(map);
    map.on("move", () => {
      syncFromRight();
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        // 🆕 unregister on cleanup
        registerRightMap(null);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [basemap]);

  /**
   * Load project data when projectId changes
   * Order: Merged layers first (green, buffer, boundary), then polygons on top
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!projectId) return;

    // Load all layers if map exists
    if (map) {
      const loadAllLayers = async () => {
        // Ensure map is fully loaded before adding layers
        const ensureMapReady = () =>
          new Promise<void>((resolve) => {
            if (map.isStyleLoaded() && map.loaded()) {
              resolve();
            } else {
              map.once("idle", () => resolve());
            }
          });

        await ensureMapReady();

        const allFeatures: Feature<Geometry>[] = [];

        // === STEP 1: Load merged layers (green, buffer, boundary) ===
        const mergedFeatures = await getMergedLayers();
        if (mergedFeatures) {
          allFeatures.push(...mergedFeatures);
        }

        // === STEP 2: Load project polygons layer (will be on top) ===
        const polygonFeatures = await addProjectPolygonsLayer();
        if (polygonFeatures) {
          allFeatures.push(...polygonFeatures);
        }

        // Fit map to project boundary
        if (
          allFeatures.length > 0 &&
          selectedProject?.geom &&
          map.loaded()
        ) {
          const projectFeature: Feature<Geometry> = {
            type: "Feature",
            geometry: selectedProject.geom,
            properties: {
              id: selectedProject.id,
              name: selectedProject.name,
            },
          };

          fitMapToFeatures(map, [projectFeature]);
        }
      };

      loadAllLayers();
    }

    // Cleanup: remove all layers
    return () => {
      try {
        if (map && map.getStyle()) {
          // Remove in reverse order
          if (map.getLayer(`layer-${PROJECT_POLYGONS_LAYER_CONFIG.id}`)) {
            removeLayer(map, `layer-${PROJECT_POLYGONS_LAYER_CONFIG.id}`);
          }
          if (map.getLayer(`layer-${PROJECT_LAYER_CONFIG.id}`)) {
            removeLayer(map, `layer-${PROJECT_LAYER_CONFIG.id}`);
          }
          if (map.getLayer(`layer-${MERGED_BUFFER125_LAYER_CONFIG.id}`)) {
            removeLayer(map, `layer-${MERGED_BUFFER125_LAYER_CONFIG.id}`);
          }
          if (map.getLayer(`layer-${MERGED_GREEN_LAYER_CONFIG.id}`)) {
            removeLayer(map, `layer-${MERGED_GREEN_LAYER_CONFIG.id}`);
          }
        }
      } catch (error) {
        console.debug("Could not remove layers on cleanup:", error);
      }
    };
  }, [projectId, basemap, addProjectPolygonsLayer, getMergedLayers, selectedProject]);

  return (
    <>
      {loading && <Loader text={t(loadingText)} />}
      {alert.open && (
        <AlertBox
          open={alert.open}
          onClose={() => setAlert({ ...alert, open: false })}
          message={alert.message}
          severity={alert.severity}
        />
      )}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      />
    </>
  );
};