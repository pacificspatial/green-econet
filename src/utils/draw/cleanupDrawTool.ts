// src/utils/draw/drawToolCleanUp.ts
import type mapboxgl from "mapbox-gl";
import type MapboxDraw from "@mapbox/mapbox-gl-draw";

interface CleanupParams {
  mapRef: mapboxgl.Map | null;
  drawInstance: MapboxDraw | null;
  handleDrawCreate: (e: any) => void;
  handleDrawUpdate: (e: any) => void;
  handleDrawDelete: (e: any) => void;
}

export const cleanupDrawTool = ({
  mapRef,
  drawInstance,
  handleDrawCreate,
  handleDrawUpdate,
  handleDrawDelete,
}: CleanupParams) => {
  if (!mapRef || !drawInstance) return;

  // Remove event listeners
  mapRef.off("draw.create", handleDrawCreate);
  mapRef.off("draw.update", handleDrawUpdate);
  mapRef.off("draw.delete", handleDrawDelete);

  // 🔴 Critical: remove the control from the map
  try {
    mapRef.removeControl(drawInstance);
  } catch (err) {
    console.warn("Error removing draw control:", err);
  }
};
