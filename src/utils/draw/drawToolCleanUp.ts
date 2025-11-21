import MapboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxgl from "mapbox-gl";
// Types
type MapInstance = mapboxgl.Map | null;
type DrawInstance = MapboxDraw | null;

interface CleanupDrawToolParams {
  mapRef: MapInstance;
  drawInstance: DrawInstance;
  handleDrawCreate: (e: MapboxDraw.DrawCreateEvent) => void;
  handleDrawUpdate: (e: MapboxDraw.DrawUpdateEvent) => void;
  handleDrawDelete: (e: MapboxDraw.DrawDeleteEvent) => void;
}

// Clean up draw tool and event listeners
export const cleanupDrawTool = ({
  mapRef,
  drawInstance,
  handleDrawCreate,
  handleDrawUpdate,
  handleDrawDelete,
}: CleanupDrawToolParams) => {
  try {
    // Ensure mapRef is valid
    if (!mapRef || !(mapRef instanceof mapboxgl.Map)) {
      return;
    }

    // Ensure drawInstance is valid before removing
    if (drawInstance && mapRef.hasControl(drawInstance)) {
      mapRef.removeControl(drawInstance);
    }

    // Remove event listeners safely
    if (typeof mapRef.off === "function") {
      mapRef.off("draw.create", handleDrawCreate);
      mapRef.off("draw.update", handleDrawUpdate);
      mapRef.off("draw.delete", handleDrawDelete);
    }
  } catch (error) {
    console.error("Draw tool cleanup error:", error);
  }
};
