import { useCallback, useEffect, useRef, useState } from "react";
import { initializeMap } from "@/utils/map/mapUtils";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useBasemap } from "@/hooks/useBasemap";
import { useParams } from "react-router-dom";
import { getClippedBuffer125GreenResult, getClippedGreenResult } from "@/api/result";
import type { Feature, Geometry } from "geojson";
import type { ClippedBuffer125Green } from "@/types/ClippedData";
import { addLayer, removeLayer } from "@/utils/map/addLayer";
import {
  CLIPPED_BUFFER125_LAYER_CONFIG,
  CLIPPED_GREEN_LAYER_CONFIG,
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
  ClippedItemsMapProp,
  PolygonFeatureProperties,
  PolygonGeoJSON,
  AddLayerOptions,
} from "@/types/Map";

// 🆕 map sync helpers
import {
  registerLeftMap,
  syncFromLeft,
} from "@/utils/map/mapSync";

export const ClippedItemsMap: React.FC<ClippedItemsMapProp> = ({ center, zoom }) => {
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
   * Load and add project polygons as layers from Redux store
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

  /**
   * Load and add clipped buffer 125 green layer to map
   */
  const getClippedLayers = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !projectId) return null;

    setLoading(true);
    setLoadingText(t("app.loadingResult") || "Loading results...");

    try {
      // Fetch both layers in parallel
      const [buffer125Response, greenResponse] = await Promise.all([
        getClippedBuffer125GreenResult(projectId as string),
        getClippedGreenResult(projectId as string),
      ]);

      let allFeatures: Feature<Geometry>[] = [];

      // Process clipped-buffer-125-green layer
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
          // Store features for fitting map bounds
          const features = layerData.map((data) => ({
            type: "Feature" as const,
            geometry: data.geom,
            properties: data.properties,
          }));
          allFeatures = [...allFeatures, ...features];

          // Add layer using new generic function
          addLayer(
            map,
            `layer-${CLIPPED_BUFFER125_LAYER_CONFIG.id}`,
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
              type: CLIPPED_BUFFER125_LAYER_CONFIG.type,
              paint: CLIPPED_BUFFER125_LAYER_CONFIG.paint,
            }
          );
          // Wait for layer to be added
          await new Promise<void>((resolve) => {
            if (
              map.loaded() &&
              map.getLayer(`layer-${CLIPPED_BUFFER125_LAYER_CONFIG.id}`)
            ) {
              resolve();
            } else {
              map.once("idle", () => resolve());
            }
          });
        }
      }

      // Process clipped-green layer
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
          // Store features for fitting map bounds
          const features = layerData.map((data) => ({
            type: "Feature" as const,
            geometry: data.geom,
            properties: data.properties,
          }));
          allFeatures = [...allFeatures, ...features];

          // Add layer using new generic function
          addLayer(
            map,
            `layer-${CLIPPED_GREEN_LAYER_CONFIG.id}`,
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
              type: CLIPPED_GREEN_LAYER_CONFIG.type,
              paint: CLIPPED_GREEN_LAYER_CONFIG.paint,
            }
          );

          // Wait for layer to be added
          await new Promise<void>((resolve) => {
            if (
              map.loaded() &&
              map.getLayer(`layer-${CLIPPED_GREEN_LAYER_CONFIG.id}`)
            ) {
              resolve();
            } else {
              map.once("idle", () => resolve());
            }
          });
        }
      }

      // ADD PROJECT BOUNDARY LAYER
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

        // Add layer using new generic function
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
      console.error("Error in fetching clipped layers", error);
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

    // 🆕 register this as the LEFT map and attach sync listener
    registerLeftMap(map);
    map.on("move", () => {
      syncFromLeft();
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        // 🆕 unregister on cleanup
        registerLeftMap(null);
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [basemap]);

  /**
   * Load project data when projectId changes
   * - Load project polygons layer
   * - Load clipped buffer layer (for processed projects)
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

        // Load project polygons layer
        const polygonFeatures = await addProjectPolygonsLayer();
        if (polygonFeatures) {
          allFeatures.push(...polygonFeatures);
        }

        // Load clipped layers
        const clippedFeatures = await getClippedLayers();
        if (clippedFeatures) {
          allFeatures.push(...clippedFeatures);
        }

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
          // Remove project polygons layer
          if (map.getLayer(`layer-${PROJECT_POLYGONS_LAYER_CONFIG.id}`)) {
            removeLayer(map, `layer-${PROJECT_POLYGONS_LAYER_CONFIG.id}`);
          }
          // Remove other layers...
          if (map.getLayer(`layer-${CLIPPED_BUFFER125_LAYER_CONFIG.id}`)) {
            removeLayer(map, `layer-${CLIPPED_BUFFER125_LAYER_CONFIG.id}`);
          }
          if (map.getLayer(`layer-${CLIPPED_GREEN_LAYER_CONFIG.id}`)) {
            removeLayer(map, `layer-${CLIPPED_GREEN_LAYER_CONFIG.id}`);
          }
          if (map.getLayer(`layer-${PROJECT_LAYER_CONFIG.id}`)) {
            removeLayer(map, `layer-${PROJECT_LAYER_CONFIG.id}`);
          }
        }
      } catch (error) {
        console.debug("Could not remove layers on cleanup:", error);
      }
    };
  }, [projectId, basemap, addProjectPolygonsLayer, getClippedLayers, selectedProject]);

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
