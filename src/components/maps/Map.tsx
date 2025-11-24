import React, { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Box } from "@mui/material";
import type { AlertColor, SxProps, Theme } from "@mui/material";
import { useBasemap } from "@/hooks/useBasemap";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import { initializeMap } from "@/utils/map/mapUtils";
import { useAppDispatch } from "@/hooks/reduxHooks";
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
import { fetchBufferGreenLayer, fetchGreenLayer } from "@/api/layers";
import { layerConfigs } from "@/config/layers/layerStyleConfig";
import { addStyledLayer } from "@/utils/map/addLayer";
import Legend from "./Legend";

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
  const [mapReady, setMapReady] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    open: false,
    message: "",
    severity: "info",
  });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawInstance = useRef<MapboxDraw | null>(null);

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

  // Initialize map
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
        setMapReady(true);
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

  // fetch and add layers
  const fetchAllLayers = () => {
    // Create an array of promises with their identifiers and corresponding configs
    const promises = [
      {
        name: "Green Layers",
        promise: fetchGreenLayer(),
        config: layerConfigs.green,
      },
      {
        name: "BufferGreen Layers",
        promise: fetchBufferGreenLayer(),
        config: layerConfigs.bufferGreen,
      },
    ];

    promises.forEach(({ promise, config }) => {
      promise.then((data) => {
        // Add layer to map as soon as data is available
        if (
          mapRef.current &&
          data.success &&
          data?.data &&
          data.data.length > 0
        ) {
          addStyledLayer(mapRef.current, config, data?.data);
        }
        return data;
      });
    });
  };

  //set up draw tools
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Initialize draw tool and cleanup functions
    const setupDrawTools = () => {
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
      // Initialize the new draw tool instance
      drawInstance.current = initializeDrawTool(
        map,
        true,
        handleDrawCreateSync,
        handleDrawUpdateSync,
        handleDrawDeleteSync,
        theme
      );
    };

    // Handle initial setup and style changes
    if (projectId) {
      setupDrawTools();
    }
  }, [projectId, basemap]);

  // useEffect to fetch layers
  useEffect(() => {
    if (projectId && mapRef.current) {
      fetchAllLayers();
    }
  }, [projectId, basemap]);

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
        {projectId && mapReady && <Legend map={mapRef.current} />}
      </Box>
    </>
  );
};

export default Map;
