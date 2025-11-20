import { MAX_AREA_SQ_M } from "@/constants/numberConstants";
import * as turf from "@turf/turf";
import { Geometry } from "geojson";

export const validatePolygonArea = (polygon: Geometry) => {
  // Area is calculated in square meters by turf
  const area = turf.area(polygon);
  return {
    isValid: area <= MAX_AREA_SQ_M,
    area,
  };
};
