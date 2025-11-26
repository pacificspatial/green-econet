import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import MaplibreDraw from "maplibre-gl-draw";
import "maplibre-gl-draw/dist/mapbox-gl-draw.css";

import { Box } from "@mui/material";
import type { AlertColor, SxProps, Theme } from "@mui/material";
import { useBasemap } from "@/hooks/useBasemap";

import { initializeMap } from "@/utils/map/mapUtils";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { useParams } from "react-router-dom";
import Loader from "../common/Loader";
import { useTranslation } from "react-i18next";
import AlertBox from "../utils/AlertBox";
import type { AlertState } from "@/types/AlertState";
import { useTheme } from "@mui/system";
import { cleanupDrawTool } from "@/utils/draw/drawToolCleanUp";
import { initializeDrawTool } from "@/utils/draw/initilizeDrawtool";
import {
  handleDrawCreate,
  handleDrawDelete,
  handleDrawUpdate,
} from "@/utils/draw/drawHandlers";
import type {
  DrawCreateHandlerParams,
  DrawDeleteHandlerParams,
  DrawUpdateHandlerParams,
} from "@/utils/draw/drawHandlers";
import { layerConfigs } from "@/config/layers/layerStyleConfig";
import { addStyledLayer, addLayer, removeLayer } from "@/utils/map/addLayer";
import Legend from "./Legend";
import { getPolygonsByProject } from "@/api/project";
import { setAoiPolygons } from "@/redux/slices/aoiSlice";
import type { ProjectPolygon } from "@/types/ProjectData";
import {
  getClippedBuffer125GreenResult,
  getClippedGreenResult,
} from "@/api/result";
import {
  CLIPPED_BUFFER125_LAYER_CONFIG,
  CLIPPED_GREEN_LAYER_CONFIG,
  PROJECT_LAYER_CONFIG,
} from "@/constants/layerConfig";
import type { ClippedBuffer125Green } from "@/types/ClippedData";
import type { Feature, Geometry } from "geojson";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface MapProps {
  center?: [number, number];
  zoom?: number;
  highResolution?: boolean;
  collapsed?: boolean;
  sx?: SxProps<Theme>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Map: React.FC<MapProps> = ({
  highResolution = false,
  collapsed = false,
  sx = {},
  zoom = 12,
  center = [139.652424, 35.652423],
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "info",
  });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // Use `any` so it’s compatible with Draw*HandlerParams (which still reference MapboxDraw types)
  const drawInstance = useRef<any>(null);

  const aoiPolygons = useAppSelector((state) => state.aoi.polygons);
  const { selectedProject } = useAppSelector((state) => state.project);
  const [clippedBufferFeatures, setClippedBufferFeatures] = useState<
    Feature<Geometry>[]
  >([]);

  const { basemap } = useBasemap();
  const theme = useTheme();
  const { projectId } = useParams();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // -------------------------------------------------------------------------
  // Alert helper
  // -------------------------------------------------------------------------
  const handleSetAlert = useCallback(
    (message: string, severity: AlertColor) => {
      setAlert({ open: true, message, severity });
    },
    []
  );

  // -------------------------------------------------------------------------
  // Draw handlers (sync wrappers → call async handlers)
  // -------------------------------------------------------------------------
  const handleDrawCreateSync = useCallback(
    (e: any) => {
      const params: DrawCreateHandlerParams = {
        event: e,
        projectId: projectId || "",
        drawInstance,
        dispatch,
        handleSetAlert,
        setLoading,
        setLoadingText,
      };
      handleDrawCreate(params).catch(console.error);
    },
    [projectId, dispatch, handleSetAlert]
  );

  const handleDrawUpdateSync = useCallback(
    (e: any) => {
      const params: DrawUpdateHandlerParams = {
        event: e,
        projectId: projectId || "",
        drawInstance,
        mapRef,
        dispatch,
        handleSetAlert,
        setLoading,
        setLoadingText,
      };
      handleDrawUpdate(params).catch(console.error);
    },
    [projectId, dispatch, handleSetAlert]
  );

  const handleDrawDeleteSync = useCallback(
    (e: any) => {
      const params: DrawDeleteHandlerParams = {
        event: e,
        projectId: projectId || "",
        drawInstance,
        mapRef,
        dispatch,
        handleSetAlert,
        setLoading,
        setLoadingText,
      };
      handleDrawDelete(params).catch(console.error);
    },
    [projectId, dispatch, handleSetAlert]
  );

  // -------------------------------------------------------------------------
  // Fetch project AOI polygons
  // -------------------------------------------------------------------------
  const fetchProjectPolygons = useCallback(async () => {
    if (selectedProject?.processed === false) {
      setLoading(true);
      setLoadingText(t("app.loadingProjectPolygons"));
    }

    try {
      const response = await getPolygonsByProject(projectId as string);
      if (response.success && response.data.polygons) {
        const polygonData = response.data.polygons.map(
          (polygon: ProjectPolygon, index: number) => {
            return {
              id: polygon.id,
              geom: {
                type: "Feature",
                id: polygon.id,
                geometry: polygon.geom,
                properties: {
                  name: `Shape ${index + 1}`,
                  _id: polygon.id,
                },
              } as Feature,
              area: polygon.area_m2,
              perimeter: polygon.perimeter_m,
            };
          }
        );

        dispatch(setAoiPolygons(polygonData));
      } else {
        handleSetAlert(t("errorFetchingPolygons"), "error");
      }
    } catch (error) {
      console.error("Error in fetching polygons", error);
      handleSetAlert(t("errorFetchingPolygons"), "error");
    } finally {
      if (selectedProject?.processed === false) {
        setLoading(false);
        setLoadingText("");
      }
    }
  }, [projectId, dispatch, t, handleSetAlert, selectedProject?.processed]);

  // -------------------------------------------------------------------------
  // Load clipped layers (buffer + green + project boundary)
  // -------------------------------------------------------------------------
  const getClippedLayers = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !projectId) return null;

    if (selectedProject?.processed === true) {
      setLoading(true);
      setLoadingText(t("app.loadingResult") || "Loading results...");
    }

    try {
      const [buffer125Response, greenResponse] = await Promise.all([
        getClippedBuffer125GreenResult(projectId as string),
        getClippedGreenResult(projectId as string),
      ]);

      let allFeatures: Feature<Geometry>[] = [];

      // clipped-buffer-125-green
      if (buffer125Response.success && buffer125Response.data) {
        const records = Array.isArray(buffer125Response.data)
          ? buffer125Response.data
          : [buffer125Response.data];

        const features = (records as ClippedBuffer125Green[])
          .filter((record) => record.geom)
          .map((record) => ({
            type: "Feature" as const,
            geometry: record.geom!,
            properties: {
              id: record.id,
              project_id: record.project_id,
              src_id: record.src_id,
              uid: record.uid,
              ...record.properties,
            },
          }));

        if (features.length > 0) {
          allFeatures = [...allFeatures, ...features];

          const geojsonData = {
            type: "FeatureCollection" as const,
            features,
          };

          addLayer(
            map as any,
            CLIPPED_BUFFER125_LAYER_CONFIG.id,
            {
              type: "geojson",
              data: geojsonData,
            },
            {
              type: CLIPPED_BUFFER125_LAYER_CONFIG.type,
              paint: CLIPPED_BUFFER125_LAYER_CONFIG.paint,
            }
          );

          await new Promise<void>((resolve) => {
            if (map.loaded()) resolve();
            else map.once("idle", () => resolve());
          });
        }
      }

      // clipped-green
      if (greenResponse.success && greenResponse.data) {
        const records = Array.isArray(greenResponse.data)
          ? greenResponse.data
          : [greenResponse.data];

        const features = (records as ClippedBuffer125Green[])
          .filter((record) => record.geom)
          .map((record) => ({
            type: "Feature" as const,
            geometry: record.geom!,
            properties: {
              id: record.id,
              project_id: record.project_id,
              src_id: record.src_id,
              uid: record.uid,
              ...record.properties,
            },
          }));

        if (features.length > 0) {
          allFeatures = [...allFeatures, ...features];

          const geojsonData = {
            type: "FeatureCollection" as const,
            features,
          };

          addLayer(
            map as any,
            CLIPPED_GREEN_LAYER_CONFIG.id,
            {
              type: "geojson",
              data: geojsonData,
            },
            {
              type: CLIPPED_GREEN_LAYER_CONFIG.type,
              paint: CLIPPED_GREEN_LAYER_CONFIG.paint,
            }
          );
        }
      }

      // project boundary
      if (selectedProject?.geom) {
        const boundaryFeature = {
          type: "Feature" as const,
          geometry: selectedProject.geom,
          properties: {
            id: selectedProject.id,
            name: selectedProject.name,
          },
        };

        const boundaryData = {
          type: "FeatureCollection" as const,
          features: [boundaryFeature],
        };

        await new Promise<void>((resolve) => {
          if (map.loaded()) resolve();
          else map.once("idle", () => resolve());
        });

        addLayer(
          map as any,
          PROJECT_LAYER_CONFIG.id,
          {
            type: "geojson",
            data: boundaryData,
          },
          {
            type: PROJECT_LAYER_CONFIG.type,
            paint: PROJECT_LAYER_CONFIG.paint,
          }
        );
      }

      return allFeatures.length > 0 ? allFeatures : null;
    } catch (error) {
      console.error("Error in fetching clipped layers", error);
    } finally {
      if (selectedProject?.processed === true) {
        setLoading(false);
        setLoadingText("");
      }
    }

    return null;
  }, [projectId, selectedProject?.processed, selectedProject?.geom, t]);

  // -------------------------------------------------------------------------
  // Initialize map (once)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    mapRef.current = initializeMap({
      container: mapContainerRef.current,
      center,
      zoom,
      basemap,
      highResolution,
    });

    mapRef.current.once("style.load", () => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [139.652424, 35.652423],
          zoom: 12,
        });
        setMapReady(true);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [basemap, highResolution, collapsed, center, zoom]);

  // -------------------------------------------------------------------------
  // Add pmtiles layers (green + bufferGreen) once map is ready
  // -------------------------------------------------------------------------
  const addLayers = () => {
    const layers = [
      { name: "Green Layers", config: layerConfigs.green },
      { name: "BufferGreen Layers", config: layerConfigs.bufferGreen },
    ];

    layers.forEach(({ config }) => {
      addStyledLayer(mapRef.current as any, config, config.fileName || "");
    });
  };

  useEffect(() => {
    if (projectId && mapRef.current && mapReady) {
      addLayers();
    }
  }, [projectId, basemap, mapReady]);

  // -------------------------------------------------------------------------
  // Draw tool: create ONE instance per project
  // -------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!projectId) return;

    // If project is processed, AOI is read-only: ensure draw is removed
    if (selectedProject?.processed) {
      if (drawInstance.current) {
        cleanupDrawTool({
          mapRef,
          drawInstance: drawInstance.current,
          handleDrawCreate: handleDrawCreateSync,
          handleDrawUpdate: handleDrawUpdateSync,
          handleDrawDelete: handleDrawDeleteSync,
        });
        drawInstance.current = null;
      }
      return;
    }

    // Already initialized for this project
    if (drawInstance.current) return;

    // Initialize draw tool once
    drawInstance.current = initializeDrawTool(
      map,
      true,
      handleDrawCreateSync,
      handleDrawUpdateSync,
      handleDrawDeleteSync,
      theme
    );

    // Cleanup when effect deps change/unmount
    return () => {
      if (drawInstance.current) {
        cleanupDrawTool({
          mapRef,
          drawInstance: drawInstance.current,
          handleDrawCreate: handleDrawCreateSync,
          handleDrawUpdate: handleDrawUpdateSync,
          handleDrawDelete: handleDrawDeleteSync,
        });
        drawInstance.current = null;
      }
    };
  }, [
    projectId,
    selectedProject?.processed,
    theme,
    handleDrawCreateSync,
    handleDrawUpdateSync,
    handleDrawDeleteSync,
  ]);

  // -------------------------------------------------------------------------
  // Sync AOI polygons into current draw instance
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!drawInstance.current) return;
    if (selectedProject?.processed) return;

    const draw = drawInstance.current;

    // Clear existing features
    const current = draw.getAll();
    if (current && current.features.length > 0) {
      current.features.forEach((f: any) => {
        if (f.id) draw.delete(f.id as string);
      });
    }

    if (aoiPolygons && aoiPolygons.length > 0) {
      aoiPolygons.forEach((polygon) => {
        try {
          draw.add(polygon.geom);
        } catch (err) {
          console.error("Error adding polygon to draw:", err);
        }
      });
    }
  }, [aoiPolygons, selectedProject?.processed]);

  // -------------------------------------------------------------------------
  // Load project data when projectId changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!projectId) return;

    // Always fetch polygons
    fetchProjectPolygons();

    // Load clipped layers if map exists
    if (map) {
      const loadClippedLayers = async () => {
        if (map.isStyleLoaded() && map.loaded()) {
          const features = await getClippedLayers();
          if (features) setClippedBufferFeatures(features);
        } else {
          map.once("idle", async () => {
            const features = await getClippedLayers();
            if (features) setClippedBufferFeatures(features);
          });
        }
      };

      loadClippedLayers();
    }

    // Cleanup clipped layers on project change/unmount
    return () => {
      try {
        if (map && map.getStyle()) {
          if (map.getLayer(CLIPPED_BUFFER125_LAYER_CONFIG.id)) {
            removeLayer(map as any, CLIPPED_BUFFER125_LAYER_CONFIG.id);
          }
          if (map.getLayer(CLIPPED_GREEN_LAYER_CONFIG.id)) {
            removeLayer(map as any, CLIPPED_GREEN_LAYER_CONFIG.id);
          }
          if (map.getLayer(PROJECT_LAYER_CONFIG.id)) {
            removeLayer(map as any, PROJECT_LAYER_CONFIG.id);
          }
        }
      } catch (error) {
        console.debug("Could not remove layers on cleanup:", error);
      }
      setClippedBufferFeatures([]);
    };
  }, [projectId, basemap, fetchProjectPolygons, getClippedLayers]);

  // -------------------------------------------------------------------------
  // Autofit map to AOIs / clipped features
  // -------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const bounds = new maplibregl.LngLatBounds();
      let hasCoordinates = false;

      // Processed project → use clipped buffer features
      if (selectedProject?.processed && clippedBufferFeatures.length > 0) {
        clippedBufferFeatures.forEach((feature) => {
          const geom = feature.geometry;

          if (geom.type === "Polygon") {
            geom.coordinates.forEach((ring) => {
              ring.forEach((coord) => {
                bounds.extend([coord[0], coord[1]]);
                hasCoordinates = true;
              });
            });
          } else if (geom.type === "MultiPolygon") {
            geom.coordinates.forEach((polygon) => {
              polygon.forEach((ring) => {
                ring.forEach((coord) => {
                  bounds.extend([coord[0], coord[1]]);
                  hasCoordinates = true;
                });
              });
            });
          }
        });
      } else if (aoiPolygons && aoiPolygons.length > 0) {
        // Unprocessed project → use AOI polygons
        aoiPolygons.forEach((polygon) => {
          const geom = polygon.geom.geometry;
          if (geom.type === "Polygon") {
            geom.coordinates[0].forEach(([lng, lat]) => {
              bounds.extend([lng, lat]);
              hasCoordinates = true;
            });
          }
        });
      }

      if (hasCoordinates && !bounds.isEmpty()) {
        map.fitBounds(bounds, {
          padding: 50,
          duration: 800,
        });
      }
    } catch (err) {
      console.error("Error fitting map bounds:", err);
    }
  }, [aoiPolygons, clippedBufferFeatures, selectedProject?.processed]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
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

      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        <Box
          ref={mapContainerRef}
          sx={{
            width: "100%",
            height: "100%",
            ...sx,
          }}
        />
        {projectId && mapReady && <Legend map={mapRef.current} />}
      </Box>
    </>
  );
};

export default Map;
