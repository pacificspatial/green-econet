import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// import MaplibreDraw from "maplibre-gl-draw";
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
import { addStyledLayer } from "@/utils/map/addLayer";
import Legend from "./Legend";
import { getPolygonsByProject } from "@/api/project";
import { setAoiPolygons } from "@/redux/slices/aoiSlice";
import type { ProjectPolygon } from "@/types/ProjectData";
import type { Feature } from "geojson";
import { mapCenter, mapZoom } from "@/constants/mapConstants";

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
  zoom = mapZoom,
  center = mapCenter,
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
  const mapIsAlive = useRef(true);

  const aoiPolygons = useAppSelector((state) => state.aoi.polygons);
  const { selectedProject } = useAppSelector((state) => state.project);

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
        handleSetAlert(t("app.errorFetchingPolygons"), "error");
      }
    } catch (error) {
      console.error("Error in fetching polygons", error);
      handleSetAlert(t("app.errorFetchingPolygons"), "error");
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  }, [projectId, dispatch, t, handleSetAlert, selectedProject?.processed]);

  // -------------------------------------------------------------------------
  // Add pmtiles layers (green + bufferGreen)
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
        mapIsAlive.current = true;
        mapRef.current.once("idle", () => {
          if (mapIsAlive.current) {
            addLayers();
            setMapReady(true);
          }
        });
      }
    });

    return () => {
      if (mapRef.current) {
        if (drawInstance.current) drawInstance.current = null;
        mapIsAlive.current = false;
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, [basemap, highResolution, collapsed, center, zoom]);

  // -------------------------------------------------------------------------
  // Draw tool: create ONE instance per project
  // -------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!projectId) return;
    if(!mapReady) return;

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
  }, [
    projectId,
    selectedProject?.processed,
    theme,
    handleDrawCreateSync,
    handleDrawUpdateSync,
    handleDrawDeleteSync,
    mapReady
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
    if(projectId && mapReady) {
      fetchProjectPolygons()
    }
  }, [projectId, fetchProjectPolygons, mapReady]);

  // -------------------------------------------------------------------------
  // Autofit map to AOIs / clipped features
  // -------------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const bounds = new maplibregl.LngLatBounds();
      let hasCoordinates = false;

       if (aoiPolygons && aoiPolygons.length > 0) {
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
  }, [aoiPolygons]);

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
        {mapReady && <Legend map={mapRef.current} theme={theme} />}
      </Box>
    </>
  );
};

export default Map;
