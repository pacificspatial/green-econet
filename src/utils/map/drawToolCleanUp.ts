import MapboxDraw from "@mapbox/mapbox-gl-draw";
import mapboxgl from "mapbox-gl";
// Types
type MapInstance = mapboxgl.Map | null;
type DrawInstance = MapboxDraw | null;

interface CleanupDrawToolParams {
  mapInstance: MapInstance;
  drawInstance: DrawInstance;
  handleDrawCreate: (e: MapboxDraw.DrawCreateEvent) => void;
  handleDrawUpdate: (e: MapboxDraw.DrawUpdateEvent) => void;
  handleDrawDelete: (e: MapboxDraw.DrawDeleteEvent) => void;
}

// Clean up draw tool and event listeners
export const cleanupDrawTool = ({
  mapInstance,
  drawInstance,
  handleDrawCreate,
  handleDrawUpdate,
  handleDrawDelete,
}: CleanupDrawToolParams) => {
  try {

    // Ensure mapInstance is valid
    if (!mapInstance || !(mapInstance instanceof mapboxgl.Map)) {
      return;
    }

    // Ensure drawInstance is valid before removing
     if (drawInstance && mapInstance.hasControl(drawInstance)) {
      mapInstance.removeControl(drawInstance);
    }

    // Remove event listeners safely
    if (typeof mapInstance.off === "function") {
      mapInstance.off("draw.create", handleDrawCreate);
      mapInstance.off("draw.update", handleDrawUpdate);
      mapInstance.off("draw.delete", handleDrawDelete);
    }
    
  } catch (error) {
    console.error("Draw tool cleanup error:", error);
  }
};
