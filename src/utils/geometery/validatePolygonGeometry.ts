import { kinks } from "@turf/turf";
import type { Feature, Geometry, MultiPolygon, Polygon } from "geojson";

export function validatePolygonGeometry(
  feature: Feature<Geometry> | null | undefined
): boolean {
  try {
    if (
      !feature ||
      !feature.geometry ||
      (feature.geometry.type !== "Polygon" &&
        feature.geometry.type !== "MultiPolygon")
    )
      return false;

    const kinkResult = kinks(feature as Feature<Polygon | MultiPolygon>);
    return kinkResult.features.length === 0;
  } catch (err) {
    console.error("Polygon validation error:", err);
    return false;
  }
}
