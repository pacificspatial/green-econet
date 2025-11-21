import MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { AppDispatch } from "@/redux/store";
import type { AlertColor } from "@mui/material";
import type { TFunction } from "i18next";
import { validatePolygonGeometry } from "../geometery/validatePolygonGeometry";
import { MAX_AOI_POLYGON_COUNT } from "@/constants/numberConstants";
import { addAoiPolygon, deleteAoiPolygon, updateAoiPolygon } from "@/redux/slices/aoiSlice";
import { store } from "@/redux/store"

export interface DrawCreateHandlerParams {
  event: MapboxDraw.DrawCreateEvent;
  projectId: string;
  drawInstance: React.RefObject<MapboxDraw | null>;
  dispatch: AppDispatch;
  t: TFunction;
  handleSetAlert: (message: string, severity: AlertColor) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
}

export interface DrawUpdateHandlerParams {
  event: MapboxDraw.DrawUpdateEvent;
  projectId: string;
  drawInstance: React.RefObject<MapboxDraw | null>;
  mapRef: React.RefObject<mapboxgl.Map | null>;
  dispatch: AppDispatch;
  t: TFunction;
  handleSetAlert: (message: string, severity: AlertColor) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
}

export interface DrawDeleteHandlerParams {
  event: MapboxDraw.DrawDeleteEvent;
  projectId: string;
  drawInstance: React.RefObject<MapboxDraw | null>;
  mapRef: React.RefObject<mapboxgl.Map | null>;
  dispatch: AppDispatch;
  t: TFunction;
  handleSetAlert: (message: string, severity: AlertColor) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
}

const detectEditedVertex = (
  oldCoords: number[][],
  newCoords: number[][]
): number | null => {
  for (let i = 0; i < oldCoords.length; i++) {
    if (JSON.stringify(oldCoords[i]) !== JSON.stringify(newCoords[i])) {
      return i;
    }
  }
  return null;
};

export const handleDrawCreate = async (params: DrawCreateHandlerParams) => {
  const {
    event,
    projectId,
    dispatch,
    drawInstance,
    t,
    handleSetAlert,
  } = params;
  const aoiPolygons = store.getState().aoi.polygons; 
  const feature = event.features[0];
  const featureId = feature.id;
  
  // If user exceeded max shapes, reject and delete drawn shape
  if (aoiPolygons.length >= MAX_AOI_POLYGON_COUNT) {
    handleSetAlert(
      t("app.maxPolygonLimitReached", { count: MAX_AOI_POLYGON_COUNT }),
      "error"
    );

    if (featureId) {
      drawInstance.current?.delete(featureId as string);
    }

    return; 
  } else {
    dispatch(addAoiPolygon(feature));
  }

  const isValidPolygon = validatePolygonGeometry(feature);
  if (!isValidPolygon) {
    if (featureId) drawInstance.current?.delete(featureId as string);
    handleSetAlert(t("app.invalidPolygonMessage"), "error");
    return;
  }
};

export const handleDrawUpdate = async (params: DrawUpdateHandlerParams) => {
  const { event, drawInstance, dispatch } = params;
  const feature = event.features[0];
  const featureId = feature.id;

  const isValid = validatePolygonGeometry(feature);
  if (!isValid) {
    if (featureId) drawInstance.current?.delete(featureId as string);
    return;
  }
  
  // Update polygon in Redux
  dispatch(updateAoiPolygon(feature));
};

export const handleDrawDelete = async (params: DrawDeleteHandlerParams) => {
  const { event, drawInstance, dispatch } = params;
  drawInstance.current?.delete(event?.features[0]?.id as string);
  if(event?.features[0]?.id){
    dispatch(deleteAoiPolygon(event?.features[0]?.id));
  }
};
