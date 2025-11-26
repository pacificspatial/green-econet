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
import type { Feature } from "geojson";

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
    setLoading(true);
    setLoadingText(t("app.loadingProjectPolygons"));
    
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
      setLoading(false);
      setLoadingText("");
    }
  }, [projectId, dispatch, t, handleSetAlert]);

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
  }, [projectId, basemap, aoiPolygons]);

  /** * Trigger fetch project polygon */
  useEffect(() => {
    if(projectId) {
      fetchProjectPolygons()
    }
  }, [projectId])

  /**
   * Auto-fit map to polygons
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const bounds = new mapboxgl.LngLatBounds();
      let hasCoordinates = false;

      if (aoiPolygons && aoiPolygons.length > 0) {
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
  }, [aoiPolygons]);

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
