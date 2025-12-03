import type { Geometry } from "geojson";

export interface ProjectParam {
  name: string;
  description?: string;
};

export interface ProjectPolygonParam {
  projectId: string;
  geom: Geometry
}
export interface S3PresignedUrlParam {
  fileName: string;
  bucketName: "tile" | "download";
}