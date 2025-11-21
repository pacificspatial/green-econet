import type { Geometry } from "geojson";
import mapboxgl from "mapbox-gl";
import bbox from "@turf/bbox";
import { feature, featureCollection } from "@turf/helpers";

export const fitBoundsToGeometry = (
  map: mapboxgl.Map,
  geometry: Geometry,
  options = { padding: 50, maxZoom: 18, duration: 1000 }
) => {
  try {
    if (!geometry) return;

    let turfFeature;
    if (geometry.type === "GeometryCollection") {
      // ✅ Convert all geometries into features and combine them
      const features = geometry.geometries.map((g) => feature(g));
      turfFeature = featureCollection(features);
    } else {
      // ✅ Single geometry
      turfFeature = feature(geometry);
    }

    const [minLng, minLat, maxLng, maxLat] = bbox(turfFeature);

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      options
    );
  } catch (error) {
    console.error("Error fitting bounds to geometry:", error);
  }
};
