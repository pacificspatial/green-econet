import mapboxgl, { LayerSpecification } from "mapbox-gl";
import { Feature, Geometry, FeatureCollection } from "geojson";

// Basic layer types supported by Mapbox GL
export type LayerType =
  | "fill"
  | "line"
  | "symbol"
  | "circle"
  | "heatmap"
  | "fill-extrusion";

// Style configuration for a layer
export interface LayerStyle {
  // The type of layer to render
  type: LayerType;

  // Paint properties define the layer's appearance
  paint: mapboxgl.PaintSpecification;

  // Optional layout properties define the layer's behavior
  layout?: mapboxgl.LayoutSpecification;

  // Optional minimum zoom level at which the layer becomes visible
  minzoom?: number;

  // Optional maximum zoom level at which the layer becomes invisible
  maxzoom?: number;

  beforeId?: string;
}

// Main layer configuration interface
export interface LayerConfig {
  // Unique identifier for the layer
  id: string;

  // Style configuration for the layer
  style: LayerStyle;

  // Optional ID of the layer before which this layer should be inserted
  beforeId?: string;
  zIndex?: number;
}

// Interface for the data to be added to a layer
export interface LayerData {
  geom: Geometry;
  properties?: Record<string, LayerSpecification>;
}

// Feature collection for GeoJSON data
export interface GeoJsonData extends FeatureCollection {
  features: Array<
    Feature & {
      properties: {
        // Optional hazard level property used in hazard layers
        a31a_205?: number;
        // Unique identifier for the feature
        uid?: string;
        // Allow for additional properties
        [key: string]: string | number | boolean | null | undefined;
      };
    }
  >;
}

export type LayerName =
  | "dragonflyHabitat"
  | "lizardHabitat"
  | "locations"
  | "whiteyeHabitat"
  | "hazard";

export interface LayerFeature {
  geom: Geometry;
  a31a_205?: number;
  uid?: string;
}

export interface FeatureProperties {
  a31a_205?: number;
  uid?: string;
  [key: string]: unknown;
}

export type PointResult = {
  id: string | number;
  geom: GeoJSON.Point;
  raingarden_type: number;
};

export type PolygonResult = {
  id: string | number;
  geom: GeoJSON.Polygon;
  habitat_type: number;
};
