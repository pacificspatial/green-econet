// src/utils/draw/initilizeDrawtool.ts
import type { Theme } from "@mui/system";
import type { IControl } from "maplibre-gl";
import type maplibregl from "maplibre-gl";
import MaplibreDraw from "maplibre-gl-draw";
import "maplibre-gl-draw/dist/mapbox-gl-draw.css";

export type DrawInstance = MaplibreDraw;

export function initializeDrawTool(
  map: maplibregl.Map,
  isEditable: boolean,
  handleDrawCreate: (e: any) => void,
  handleDrawUpdate: (e: any) => void,
  handleDrawDelete: (e: any) => void,
  _theme: Theme
): DrawInstance {
  // Configure draw – you can tweak modes/controls here if needed
  const draw = new MaplibreDraw({
    displayControlsDefault: false,
    controls: isEditable
      ? {
          polygon: true,
          trash: true,
        }
      : {},
    defaultMode: "simple_select",
  });

  // Add control to the map
  map.addControl(draw as unknown as IControl, "top-left");

  // Wire events
  map.on("draw.create", handleDrawCreate);
  map.on("draw.update", handleDrawUpdate);
  map.on("draw.delete", handleDrawDelete);

  return draw;
}
