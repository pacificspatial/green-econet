import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { Theme } from "@mui/system";

export const initializeDrawTool = (
  map: mapboxgl.Map,
  isPolygonEnabled: boolean,
  handleDrawCreate: (e: MapboxDraw.DrawCreateEvent) => void,
  handleDrawUpdate: (e: MapboxDraw.DrawUpdateEvent) => void,
  handleDrawDelete: (e: MapboxDraw.DrawDeleteEvent) => void,
  theme: Theme
): MapboxDraw => {
  // Define colors
  const selectedColor = "#1E88E5";
  const editColor = theme.palette.primary.main;

  const polygonStyle = [
    // Default fill style (unselected)
    {
      id: "gl-draw-polygon-fill-inactive",
      type: "fill",
      filter: [
        "all",
        ["==", "active", "false"],
        ["==", "$type", "Polygon"],
        ["!=", "mode", "static"],
      ],
      paint: {
        "fill-color": theme.palette.primary.main,
        "fill-opacity": 0.05,
      },
    },
    // Selected fill style
    {
      id: "gl-draw-polygon-fill-active",
      type: "fill",
      filter: ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
      paint: {
        "fill-color": theme.palette.primary.main,
        "fill-opacity": 0.1,
      },
    },
    // Edit mode fill style
    {
      id: "gl-draw-polygon-fill-edit",
      type: "fill",
      filter: [
        "all",
        ["==", "active", "true"],
        ["==", "$type", "Polygon"],
        ["==", "mode", "direct_select"],
      ],
      paint: {
        "fill-color": editColor,
        "fill-opacity": 0.02,
      },
    },
    // Default border style (unselected)
    {
      id: "gl-draw-polygon-stroke-inactive",
      type: "line",
      filter: [
        "all",
        ["==", "active", "false"],
        ["==", "$type", "Polygon"],
        ["!=", "mode", "static"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": theme.palette.primary.main,
        "line-width": 2,
      },
    },
    // Selected border style (solid line)
    {
      id: "gl-draw-polygon-stroke-active",
      type: "line",
      filter: [
        "all",
        ["==", "active", "true"],
        ["==", "$type", "Polygon"],
        ["!=", "mode", "direct_select"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": selectedColor,
        "line-width": 2,
      },
    },
    // Edit mode border style (dashed line)
    {
      id: "gl-draw-polygon-stroke-edit",
      type: "line",
      filter: [
        "all",
        ["==", "active", "true"],
        ["==", "$type", "Polygon"],
        ["==", "mode", "direct_select"],
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": editColor,
        "line-width": 2,
        "line-dasharray": [2, 2],
      },
    },
    // Vertex points - visible during drawing and editing
    {
      id: "gl-draw-polygon-vertex",
      type: "circle",
      filter: [
        "all",
        ["==", "meta", "vertex"],
        ["==", "$type", "Point"],
        [
          "any",
          ["==", "mode", "draw_polygon"],
          ["==", "mode", "direct_select"],
        ],
      ],
      paint: {
        "circle-radius": 5,
        "circle-color": editColor,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    },
    // Active vertex points - visible during drawing and editing
    {
      id: "gl-draw-polygon-vertex-active",
      type: "circle",
      filter: [
        "all",
        ["==", "meta", "vertex"],
        ["==", "$type", "Point"],
        [
          "any",
          ["==", "mode", "draw_polygon"],
          ["all", ["==", "mode", "direct_select"], ["==", "active", "true"]],
        ],
      ],
      paint: {
        "circle-radius": 5,
        "circle-color": theme.palette.primary.main,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    },
  ];

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    controls: {
      polygon: isPolygonEnabled,
      trash: true,
    },
    styles: [...polygonStyle],
    userProperties: true,
  });

  map.addControl(draw, "top-left");
  map.on("draw.create", handleDrawCreate);
  map.on("draw.update", handleDrawUpdate);
  map.on("draw.delete", handleDrawDelete);

  return draw;
};
