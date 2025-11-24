import type { Geometry } from "geojson";

// PROJECT TYPES
export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  config?: Object;
  aoi_centroid?: Geometry;
  geom?: Geometry;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectPolygon {
  id: string;
  geom: Geometry;
  area_m2: number;
  perimeter_m: number;
}