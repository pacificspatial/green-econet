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
