import { Geometry } from "./Region";

export interface LandUseRegion {
  geom: Geometry;
  properties?: {
    id: number;
  };
}

export type LandUseRegions = LandUseRegion[];
