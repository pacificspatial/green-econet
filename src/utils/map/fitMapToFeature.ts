import type { Geometry, Feature } from "geojson";
import mapboxgl from "mapbox-gl";

/**
 * Calculate bounds from features and fit map
 */
export const fitMapToFeatures = (
  map: mapboxgl.Map,
  features: Feature<Geometry>[]
) => {
  if (!features || features.length === 0) return;

  const bounds = new mapboxgl.LngLatBounds();

  features.forEach((feature) => {
    const geometry = feature.geometry;

    if (geometry.type === "Point") {
      bounds.extend(geometry.coordinates as [number, number]);
    } else if (geometry.type === "LineString") {
      geometry.coordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
    } else if (geometry.type === "Polygon") {
      geometry.coordinates.forEach((ring) => {
        ring.forEach((coord) => {
          bounds.extend(coord as [number, number]);
        });
      });
    } else if (geometry.type === "MultiPoint") {
      geometry.coordinates.forEach((coord) => {
        bounds.extend(coord as [number, number]);
      });
    } else if (geometry.type === "MultiLineString") {
      geometry.coordinates.forEach((line) => {
        line.forEach((coord) => {
          bounds.extend(coord as [number, number]);
        });
      });
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          ring.forEach((coord) => {
            bounds.extend(coord as [number, number]);
          });
        });
      });
    }
  });

  // Check if bounds are valid before fitting
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 16,
      duration: 1000,
    });
  }
};
