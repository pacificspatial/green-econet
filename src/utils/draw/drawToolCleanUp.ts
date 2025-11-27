// src/utils/draw/drawToolCleanUp.ts
import type React from "react";
import type maplibregl from "maplibre-gl";
import type MaplibreDraw from "maplibre-gl-draw";
import type { IControl } from "maplibre-gl";

interface CleanupParams {
  mapRef: React.RefObject<maplibregl.Map | null>;
  drawInstance: MaplibreDraw | null;
  handleDrawCreate: (e: any) => void;
  handleDrawUpdate: (e: any) => void;
  handleDrawDelete: (e: any) => void;
}

export function cleanupDrawTool({
  mapRef,
  drawInstance,
  handleDrawCreate,
  handleDrawUpdate,
  handleDrawDelete,
}: CleanupParams): void {
  const map = mapRef.current;
  if (!map || !drawInstance) return;
console.log(map);

  // Remove listeners
  map.off("draw.create", handleDrawCreate);
  map.off("draw.update", handleDrawUpdate);
  map.off("draw.delete", handleDrawDelete);

  // Remove control
  map.removeControl(drawInstance as unknown as IControl);
}
