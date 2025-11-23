import * as turf from "@turf/turf";

export const calculateArea = (feature: GeoJSON.Feature) => {
  try {
    const area = turf.area(feature);

    return area
  } catch (err) {
    return 0;
  }
};
