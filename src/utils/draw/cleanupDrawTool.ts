// src/utils/draw/drawToolCleanUp.ts
import maplibregl from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

interface CleanupParams {
  mapRef: React.RefObject<maplibregl.Map | null>;
  drawInstance: MapboxDraw | null;
  handleDrawCreate: (e: MapboxDraw.DrawCreateEvent) => void;
  handleDrawUpdate: (e: MapboxDraw.DrawUpdateEvent) => void;
  handleDrawDelete: (e: MapboxDraw.DrawDeleteEvent) => void;
}

export const cleanupDrawTool = ({
  mapRef,
  drawInstance,
  handleDrawCreate,
  handleDrawUpdate,
  handleDrawDelete,
}: CleanupParams) => {
  const map = mapRef.current;
  if (!map || !drawInstance) return;

  map.off("draw.create", handleDrawCreate);
  map.off("draw.update", handleDrawUpdate);
  map.off("draw.delete", handleDrawDelete);

  // Remove the control from MapLibre
  map.removeControl(drawInstance as any);
};
