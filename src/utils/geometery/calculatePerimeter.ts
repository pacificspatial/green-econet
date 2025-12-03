import * as turf from "@turf/turf";

export const calculatePerimeter = (feature: GeoJSON.Feature) => {
  try {
    const perimeter = turf.length(feature, { units: "meters" });

    return perimeter
  } catch (err) {
    return 0;
  }
};
