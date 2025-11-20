import { Geometry } from "./Region";

export interface Park {
  geom: Geometry;
  properties?: {
    id: number;
  };
}

export type Parks = Park[];
