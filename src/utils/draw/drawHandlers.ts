import MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { AppDispatch } from "@/redux/store";
import type { AlertColor } from "@mui/material";
import { validatePolygonGeometry } from "../geometery/validatePolygonGeometry";
import { addAoiPolygon, deleteAoiPolygon, updateAoiPolygon } from "@/redux/slices/aoiSlice";
import i18n from "@/i18n/i18n";

export interface DrawCreateHandlerParams {
  event: MapboxDraw.DrawCreateEvent;
  projectId: string;
  drawInstance: React.RefObject<MapboxDraw | null>;
  dispatch: AppDispatch;
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
  handleSetAlert: (message: string, severity: AlertColor) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
}

export const handleDrawCreate = async (params: DrawCreateHandlerParams) => {
  const {
    event,
    dispatch,
    drawInstance,
    handleSetAlert,
  } = params;
  const feature = event.features[0];
  const featureId = feature.id;

  const isValidPolygon = validatePolygonGeometry(feature);
  if (!isValidPolygon) {
    if (featureId) drawInstance.current?.delete(featureId as string);
    handleSetAlert(i18n.t("app.invalidPolygonMessage"), "error");
    return;
  }
  // Add polygon to Redux
  dispatch(addAoiPolygon(feature));

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
    // Delete polygon in Redux
    dispatch(deleteAoiPolygon(event?.features[0]?.id));
  }
};
