import * as turf from '@turf/turf';

export const validateGeometryOverlap = (
  geometry: GeoJSON.Geometry,
  featureId: string | number | undefined,
  existingFeatures: GeoJSON.Feature<GeoJSON.Geometry>[],
  t: (key: string) => string
): { isValid: boolean; message?: string } => {
  const isGeomValid =
    geometry.type === 'Polygon' ||
    geometry.type === 'Point' ||
    geometry.type === 'LineString';
  if (!isGeomValid) {
    return { isValid: false, message: t("app.invalidGeometryType") };
  }

  const hasOverlap = existingFeatures.some(existingFeature => {
    if (existingFeature.id === featureId) return false;
    const geomType = geometry.type;
    const existingType = existingFeature.geometry.type;

    // Polygon ↔ Polygon
    if (geomType === 'Polygon' && existingType === 'Polygon') {
      const newPolygon = turf.polygon(geometry.coordinates);
      const existingPolygon = turf.polygon(existingFeature.geometry.coordinates);
      return (
        turf.booleanOverlap(newPolygon, existingPolygon) ||
        turf.booleanContains(newPolygon, existingPolygon) ||
        turf.booleanContains(existingPolygon, newPolygon)
      );
    }

    // Point ↔ Point
    if (geomType === 'Point' && existingType === 'Point') {
      return turf.booleanEqual(
        turf.point(geometry.coordinates),
        turf.point(existingFeature.geometry.coordinates)
      );
    }

    // Point ↔ Polygon
    if (geomType === 'Point' && existingType === 'Polygon') {
      return turf.booleanPointInPolygon(
        turf.point(geometry.coordinates),
        turf.polygon(existingFeature.geometry.coordinates)
      );
    }

    // Polygon ↔ Point
    if (geomType === 'Polygon' && existingType === 'Point') {
      return turf.booleanPointInPolygon(
        turf.point(existingFeature.geometry.coordinates),
        turf.polygon(geometry.coordinates)
      );
    }

    // LineString ↔ LineString
    if (geomType === 'LineString' && existingType === 'LineString') {
      const newLine = turf.lineString(geometry.coordinates);
      const existingLine = turf.lineString(existingFeature.geometry.coordinates);
      return (
        turf.booleanEqual(newLine, existingLine) ||
        turf.booleanIntersects(newLine, existingLine)
      );
    }

    // LineString ↔ Polygon
    if (geomType === 'LineString' && existingType === 'Polygon') {
      return turf.booleanIntersects(
        turf.lineString(geometry.coordinates),
        turf.polygon(existingFeature.geometry.coordinates)
      );
    }

    // Polygon ↔ LineString
    if (geomType === 'Polygon' && existingType === 'LineString') {
      return turf.booleanIntersects(
        turf.polygon(geometry.coordinates),
        turf.lineString(existingFeature.geometry.coordinates)
      );
    }

    // LineString ↔ Point
    if (geomType === 'LineString' && existingType === 'Point') {
      return turf.booleanPointOnLine(
        turf.point(existingFeature.geometry.coordinates),
        turf.lineString(geometry.coordinates)
      );
    }

    // Point ↔ LineString
    if (geomType === 'Point' && existingType === 'LineString') {
      return turf.booleanPointOnLine(
        turf.point(geometry.coordinates),
        turf.lineString(existingFeature.geometry.coordinates)
      );
    }

    return false;
  });

  if (hasOverlap) {
    return { isValid: false, message: t("app.shapeOverlapError") };
  }

  return { isValid: true };
};