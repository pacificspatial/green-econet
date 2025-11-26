// src/utils/draw/drawHandlers.ts

import type mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import type { RefObject } from "react";

import type { AppDispatch } from "@/redux/store";
import type { AlertColor } from "@mui/material";

import { validatePolygonGeometry } from "../geometery/validatePolygonGeometry";
import {
  addAoiPolygon,
  deleteAoiPolygon,
  updateAoiPolygon,
} from "@/redux/slices/aoiSlice";
import i18n from "@/i18n/i18n";
import {
  createProjectPolygon,
  deleteProjectPolygon,
  updateProjectPolygon,
} from "@/api/project";

export interface DrawCreateHandlerParams {
  event: MapboxDraw.DrawCreateEvent;
  projectId: string;
  drawInstance: RefObject<MapboxDraw | null>;
  dispatch: AppDispatch;
  handleSetAlert: (message: string, severity: AlertColor) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
}

export interface DrawUpdateHandlerParams {
  event: MapboxDraw.DrawUpdateEvent;
  projectId: string;
  drawInstance: RefObject<MapboxDraw | null>;
  mapRef: RefObject<mapboxgl.Map | null>;
  dispatch: AppDispatch;
  handleSetAlert: (message: string, severity: AlertColor) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
}

export interface DrawDeleteHandlerParams {
  event: MapboxDraw.DrawDeleteEvent;
  projectId: string;
  drawInstance: RefObject<MapboxDraw | null>;
  mapRef: RefObject<mapboxgl.Map | null>;
  dispatch: AppDispatch;
  handleSetAlert: (message: string, severity: AlertColor) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
}

export const handleDrawCreate = async (
  params: DrawCreateHandlerParams
): Promise<void> => {
  const {
    event,
    projectId,
    dispatch,
    drawInstance,
    handleSetAlert,
    setLoading,
    setLoadingText,
  } = params;

  const feature = event.features[0];
  const tempFeatureId = feature.id;

  const isValidPolygon = validatePolygonGeometry(feature);
  if (!isValidPolygon) {
    if (tempFeatureId) {
      drawInstance.current?.delete(tempFeatureId as string);
    }
    handleSetAlert(i18n.t("app.invalidPolygonMessage"), "error");
    return;
  }

  setLoading(true);
  setLoadingText(i18n.t("app.creatingPolygon"));

  try {
    const response = await createProjectPolygon({
      projectId,
      geom: feature.geometry,
    });

    if (response.success && response.data) {
      // Build final feature with correct ID + metadata
      const updatedFeature = {
        ...feature,
        id: response.data.id,
        properties: {
          ...(feature.properties || {}),
          _id: response.data.id,
        },
      };

      if (tempFeatureId) {
        drawInstance.current?.delete(tempFeatureId as string);
      }

      // Add new feature with real ID
      drawInstance.current?.add(updatedFeature);

      // Add to Redux
      dispatch(
        addAoiPolygon({
          id: response.data.id,
          geom: updatedFeature,
          area: response.data.area_m2,
          perimeter: response.data.perimeter_m,
        })
      );

      handleSetAlert(i18n.t("app.polygonCreatedSuccessfully"), "success");
    } else {
      if (tempFeatureId) {
        drawInstance.current?.delete(tempFeatureId as string);
      }
      handleSetAlert(i18n.t("app.errorCreatingPolygon"), "error");
    }
  } catch (error) {
    console.error("Error creating polygon:", error);
    if (tempFeatureId) {
      drawInstance.current?.delete(tempFeatureId as string);
    }
    handleSetAlert(i18n.t("app.errorCreatingPolygon"), "error");
  } finally {
    setLoading(false);
    setLoadingText("");
  }
};

export const handleDrawUpdate = async (
  params: DrawUpdateHandlerParams
): Promise<void> => {
  const {
    event,
    drawInstance,
    dispatch,
    handleSetAlert,
    setLoading,
    setLoadingText,
  } = params;

  const feature = event.features[0];
  const featureId = feature?.id;

  // Validate polygon geometry
  const isValid = validatePolygonGeometry(feature);
  if (!isValid) {
    if (featureId) {
      drawInstance.current?.delete(featureId as string);
    }
    handleSetAlert(i18n.t("app.invalidPolygonMessage"), "error");
    return;
  }

  if (!featureId) {
    handleSetAlert(i18n.t("app.errorUpdatingPolygon"), "error");
    return;
  }

  setLoading(true);
  setLoadingText(i18n.t("app.updatingPolygon"));

  try {
    // API to update polygon
    const response = await updateProjectPolygon(
      feature.id as string,
      feature.geometry
    );

    if (response.success) {
      // Update polygon in Redux
      dispatch(
        updateAoiPolygon({
          geom: feature,
          area: response.data.area_m2,
          perimeter: response.data.perimeter_m,
        })
      );
      handleSetAlert(i18n.t("app.polygonUpdatedSuccessfully"), "success");
    } else {
      handleSetAlert(i18n.t("app.errorUpdatingPolygon"), "error");
    }
  } catch (error) {
    console.error("Error updating polygon:", error);
    handleSetAlert(i18n.t("app.errorUpdatingPolygon"), "error");
  } finally {
    setLoading(false);
    setLoadingText("");
  }
};

export const handleDrawDelete = async (
  params: DrawDeleteHandlerParams
): Promise<void> => {
  const {
    event,
    drawInstance,
    dispatch,
    handleSetAlert,
    setLoading,
    setLoadingText,
  } = params;

  const feature = event.features[0];
  const featureId = feature?.id;

  if (!featureId) {
    handleSetAlert(i18n.t("app.errorDeletingPolygon"), "error");
    return;
  }

  setLoading(true);
  setLoadingText(i18n.t("app.deletingPolygon"));

  try {
    // API to delete polygon
    const response = await deleteProjectPolygon(featureId as string);

    if (response.success) {
      // Delete from draw instance
      drawInstance.current?.delete(featureId as string);

      // Delete polygon from Redux
      dispatch(deleteAoiPolygon(featureId));

      handleSetAlert(i18n.t("app.polygonDeletedSuccessfully"), "success");
    } else {
      handleSetAlert(i18n.t("app.errorDeletingPolygon"), "error");
    }
  } catch (error) {
    console.error("Error deleting polygon:", error);
    handleSetAlert(i18n.t("app.errorDeletingPolygon"), "error");
  } finally {
    setLoading(false);
    setLoadingText("");
  }
};
