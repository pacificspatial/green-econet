import React, { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Box } from "@mui/material";
import type { AlertColor, SxProps, Theme } from "@mui/material";
import { useBasemap } from "@/hooks/useBasemap";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
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
import { getPolygonsByProject } from "@/api/project";
import { setAoiPolygons } from "@/redux/slices/aoiSlice";
import type { ProjectPolygon } from "@/types/ProjectData";
import { getClippedBuffer125GreenResult } from "@/api/result";
import { addLayer, removeLayer } from "@/utils/map/addLayer";
import { CLIPPED_BUFFER125_LAYER_CONFIG } from "@/constants/layerConfig";
import type { ClippedBuffer125Green } from "@/types/ClippedData";
import type { Feature, Geometry } from "geojson";

// Declare mapbox-gl module augmentation for the accessToken
declare global {
  interface Window {
    mapboxgl: typeof mapboxgl;
  }
}

// Type for the Map component props
interface MapProps {
  center?: [number, number];
  zoom?: number;
  highResolution?: boolean;
  collapsed?: boolean;
  sx?: SxProps<Theme>;
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

const Map: React.FC<MapProps> = ({
  highResolution = false,
  collapsed = false,
  sx = {},
  zoom = 12,
  center = [139.652424, 35.652423],
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "info",
  });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawInstance = useRef<MapboxDraw | null>(null);
  const aoiPolygons = useAppSelector((state) => state.aoi.polygons);
  const { selectedProject } = useAppSelector((state) => state.project)
  const [clippedBufferFeatures, setClippedBufferFeatures] = useState<Feature<Geometry>[]>([])

  const { basemap } = useBasemap();
  const theme = useTheme();
  const { projectId } = useParams();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const handleSetAlert = useCallback(
    (message: string, severity: AlertColor) => {
      setAlert({ open: true, message, severity });
    },
    []
  );

  const handleDrawCreateSync = useCallback(
    (e: MapboxDraw.DrawCreateEvent) => {
      const params: DrawCreateHandlerParams = {
        event: e,
        projectId: projectId || "",
        drawInstance,
        dispatch,
        handleSetAlert,
        setLoading,
        setLoadingText,
      };
      // Fire and forget the async operation
      handleDrawCreate(params).catch(console.error);
    },
    [projectId, dispatch, t, handleSetAlert]
  );

  const handleDrawUpdateSync = useCallback(
    (e: MapboxDraw.DrawUpdateEvent) => {
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
    [projectId, dispatch, t, handleSetAlert]
  );

  const handleDrawDeleteSync = useCallback(
    (e: MapboxDraw.DrawDeleteEvent) => {
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
    [projectId, dispatch, t, handleSetAlert]
  ); 

/**
   * Load project polygons from API
   */
  const fetchProjectPolygons = useCallback(async () => {
    // Only show loader for unprocessed projects
    if (selectedProject?.processed === false) {
      setLoading(true);
      setLoadingText(t("app.loadingProjectPolygons"));
    }
    
    try {
      const response = await getPolygonsByProject(projectId as string);
      if (response.success && response.data.polygons) {    
        const polygonData = response.data.polygons.map((polygon: ProjectPolygon, index: number) => {
          return {
            id: polygon.id,
            geom: {
              type: "Feature",
              id: polygon.id,
              geometry: polygon.geom,
              properties: {
                name: `Shape ${index + 1}`,
                _id: polygon.id,
              }
            } as Feature,
            area: polygon.area_m2,
            perimeter: polygon.perimeter_m,
          };
        });
          
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

  /**
   * Load and add clipped buffer 125 green layer to map
   */
  const getClippedBuffer125Green = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !projectId) return null;

    // Show loader for processed projects
    if (selectedProject?.processed === true) {
      setLoading(true);
      setLoadingText(t("app.loadingResult") || "Loading results...");
    }

    try {
      const response = await getClippedBuffer125GreenResult(projectId as string);
      
      if (response.success && response.data) {
        // Handle both single object and array of records
        const records = Array.isArray(response.data) ? response.data : [response.data];        
        
        // Filter records that have valid geometry
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
          // Create GeoJSON FeatureCollection from all records
          const geojsonData = {
            type: "FeatureCollection" as const,
            features,
          };

          // Add the layer using the utility function
          addLayer(
            map,
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
          
          return features; // Return features for bounds calculation
        }
      }
    } catch (error) {
      console.error("Error in fetching clipped buffer 125 layer", error);
    } finally {
      if (selectedProject?.processed === true) {
        setLoading(false);
        setLoadingText("");
      }
    }
    
    return null;
  }, [projectId, selectedProject?.processed, t]);

  /**
   * Setup map (runs only once)
   */
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    // initializeMap is an app utility that configures the map object
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
      }
    });

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [basemap, highResolution, collapsed]);

  /** * Setup draw tool & load polygons into it */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const setupDrawTools = () => {
      // Cleanup old instance if it exists
      if (drawInstance.current) {
        cleanupDrawTool({
          mapRef: mapRef.current,
          drawInstance: drawInstance.current,
          handleDrawCreate: handleDrawCreateSync,
          handleDrawUpdate: handleDrawUpdateSync,
          handleDrawDelete: handleDrawDeleteSync,
        });
        drawInstance.current = null;
      }

      // If project IS processed, do NOT create a draw tool
      if (selectedProject?.processed) return;

      // Initialize draw tool for editable AOI
      drawInstance.current = initializeDrawTool(
        map,
        true,
        handleDrawCreateSync,
        handleDrawUpdateSync,
        handleDrawDeleteSync,
        theme
      );

      // Load AOI polygons into Draw only if not processed      
      if (aoiPolygons?.length) {
        aoiPolygons.forEach((polygon) => {
          try {
            drawInstance.current?.add(polygon.geom);
          } catch (err) {
            console.error("Error adding polygon to draw:", err);
          }
        });
      }
    };

    if (projectId) setupDrawTools();
  }, [projectId, basemap, aoiPolygons, selectedProject?.processed]);

  /**
   * Load project data when projectId changes
   * - Fetch polygons (for unprocessed projects)
   * - Load clipped buffer layer (for processed projects)
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!projectId) return;

    // Always fetch polygons
    fetchProjectPolygons();

    // Load clipped buffer layer if map exists
    if (map) {
      const loadClippedBufferLayer = async () => {
        if (map.isStyleLoaded() && map.loaded()) {
          const features = await getClippedBuffer125Green();
          if (features) setClippedBufferFeatures(features);
        } else {
          map.once("idle", async () => {
            const features = await getClippedBuffer125Green();
            if (features) setClippedBufferFeatures(features);
          });
        }
      };

      loadClippedBufferLayer();
    }

    // Cleanup
    return () => {
      try {
        if (map && map.getStyle() && map.getLayer(CLIPPED_BUFFER125_LAYER_CONFIG.id)) {
          removeLayer(map, CLIPPED_BUFFER125_LAYER_CONFIG.id);
        }
      } catch (error) {
        console.debug("Could not remove layer on cleanup:", error);
      }
      setClippedBufferFeatures([]); // Clear features on cleanup
    };
  }, [projectId, basemap, fetchProjectPolygons, getClippedBuffer125Green]);

  /**
   * Auto-fit map to polygons
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const bounds = new mapboxgl.LngLatBounds();
      let hasCoordinates = false;

      // If project is processed, use clipped buffer features
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
      }
      // Otherwise use AOI polygons
      else if (aoiPolygons && aoiPolygons.length > 0) {
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

      {/* Wrapper div to contain both map and legend */}
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        {/* Map container */}
        <Box
          ref={mapContainerRef}
          sx={{
            width: "100%",
            height: "100%",
            ...sx,
          }}
        />
      </Box>
    </>
  );
};

export default Map;
