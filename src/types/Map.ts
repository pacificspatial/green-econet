import type { Geometry } from 'geojson'

export interface PolygonFeatureProperties {
  id: string;
  name?: string;
  [key: string]: any;
}

export interface PolygonFeature {
  type: 'Feature';
  geometry: Geometry;
  properties: PolygonFeatureProperties;
}

export interface PolygonGeoJSON {
  type: 'FeatureCollection';
  features: PolygonFeature[];
}

export interface AddLayerOptions {
  type: string;
  paint: Record<string, any>;
}

export interface ClippedItemsMapProp {
  center: [number, number];
  zoom: number;
}

export interface MergedItemsMapProp {
  center: [number, number];
  zoom: number;
}
