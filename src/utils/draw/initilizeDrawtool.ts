// src/utils/draw/initilizeDrawtool.ts
import type mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

export const initializeDrawTool = (
  map: mapboxgl.Map,
  editable: boolean,
  handleDrawCreate: (e: MapboxDraw.DrawCreateEvent) => void,
  handleDrawUpdate: (e: MapboxDraw.DrawUpdateEvent) => void,
  handleDrawDelete: (e: MapboxDraw.DrawDeleteEvent) => void,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  theme: unknown // keep if you use theme for custom styles later
): MapboxDraw => {
  const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: editable
      ? {
          polygon: true,
          line_string: true,
          point: true,
          trash: true,
        }
      : {},
    defaultMode: "simple_select",
  });

  map.addControl(draw, "top-left");

  map.on("draw.create", handleDrawCreate);
  map.on("draw.update", handleDrawUpdate);
  map.on("draw.delete", handleDrawDelete);

  return draw;
};
