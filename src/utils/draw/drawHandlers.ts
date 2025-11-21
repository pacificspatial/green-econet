import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { AppDispatch } from "@/redux/store";
import { AlertColor } from "@mui/material";
import { TFunction } from "i18next";
import { validatePolygonGeometry } from "../geometery/validatePolygonGeometry";

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
  const { event, projectId, drawInstance, t, handleSetAlert } = params;

  const feature = event.features[0];
  const geometry = feature.geometry;
  const featureId = feature.id;

  const isValidPolygon = validatePolygonGeometry(feature);
  if (!isValidPolygon) {
    if (featureId) drawInstance.current?.delete(featureId as string);
    handleSetAlert(t("app.invalidPolygonMessage"), "error");
    return;
  }
  console.log("Polygon drawn", { geometry, featureId, projectId });
};

export const handleDrawUpdate = async (params: DrawUpdateHandlerParams) => {
  const { event, projectId, drawInstance } = params;
  const feature = event.features[0];
  const geometry = feature.geometry;
  const featureId = feature.id;

  // Create a deep copy of the geometry to work with
  let updatedGeometry = JSON.parse(JSON.stringify(geometry));

  const isValid = validatePolygonGeometry(feature);
  if (!isValid) {
    if (featureId) drawInstance.current?.delete(featureId as string);
    return;
  }
  console.log("Polygon updated", { updatedGeometry, featureId, projectId });
};

export const handleDrawDelete = async (params: DrawDeleteHandlerParams) => {
  const { event, drawInstance, t, handleSetAlert } = params;
  drawInstance.current?.delete(event?.features[0]?.id as string);
  handleSetAlert(t("app.shapeDeletionSuccessMessage"), "success");
};
