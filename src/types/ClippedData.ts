import type { MultiPolygon } from "geojson";

export interface ClippedBuffer125Green {
  id: string;
  project_id: string;
  src_id: number;
  uid?: string | null;
  geom: MultiPolygon | null;
  properties?: Record<string, any> | null;
}
