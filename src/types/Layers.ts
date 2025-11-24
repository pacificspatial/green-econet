import type { Geometry } from "geojson";

// Basic layer types supported by Mapbox GL
export type LayerType =
  | "fill"
  | "line"
  | "symbol"
  | "circle"
  | "heatmap"
  | "fill-extrusion";

export interface LayerStyle {
  type: LayerType;
  paint: mapboxgl.PaintSpecification;
  layout?: mapboxgl.LayoutSpecification;
  minzoom?: number;
  maxzoom?: number;
  beforeId?: string;
}

export interface LayerConfig {
  id: string;
  style: LayerStyle;
  beforeId?: string;
  zIndex?: number;
}

export type LayerName = "green" | "bufferGreen";

// Interface for layer data
export interface LayerData {
  geom: Geometry;
  properties?: Record<string, string | number | boolean | null>;
  [key: string]: unknown;
}

export type LayerVisibility = {
  "layer-green": boolean;
  "layer-bufferGreen": boolean;
  [key: string]: boolean;
};
