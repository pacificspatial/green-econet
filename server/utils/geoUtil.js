import { sequelize } from "../config/dbConfig.ts";

/**
 * Convert GeoJSON to PostGIS geometry type (Polygon, 4326)
 */
export const toGeometry = (geojson) => {
  const geomString = JSON.stringify(geojson);
  return sequelize.literal(
    `ST_SetSRID(ST_GeomFromGeoJSON('${geomString}'), 4326)`
  );
};

/**
 * Calculate area of geometry 
 * For EPSG:4326, ST_Area returns degrees², so we cast to geography for meters.
 */
export const calcArea = (geojson) => {
  const geomString = JSON.stringify(geojson);
  return sequelize.literal(`
    ST_Area(
      ST_SetSRID(ST_GeomFromGeoJSON('${geomString}'), 4326)::geography
    )
  `);
};

/**
 * Calculate perimeter in meters (requires geography cast)
 */
export const calcPerimeter = (geojson) => {
  const geomString = JSON.stringify(geojson);
  return sequelize.literal(`
    ST_Perimeter(
      ST_SetSRID(ST_GeomFromGeoJSON('${geomString}'), 4326)::geography
    )
  `);
};
