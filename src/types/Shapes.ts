import { Geometry } from "./Region";

export interface Shapes {
  geom: Geometry;
  rain_type: number;
  rain_count?: number;
  simulation_type?: number;
  shape_id?: string;
}
