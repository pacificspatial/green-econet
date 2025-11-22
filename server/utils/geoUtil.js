import sequelize from "../config/dbConfig.js";

/**
 * Convert a GeoJSON object to a PostGIS geography type for database storage.
 *
 * @param {Object} geojson - The GeoJSON geometry
 * @returns {sequelize.literal} - Sequelize literal for geography insertion
 */
export const toGeography = (geojson) => {
  const geomString = JSON.stringify(geojson);
  return sequelize.literal(
    `ST_SetSRID(ST_GeomFromGeoJSON('${geomString}'), 4326)::geography`
  );
};

/**
 * Calculate the area of a GeoJSON geometry in square meters.
 *
 * @param {Object} geojson - The GeoJSON geometry
 * @returns {sequelize.literal} - Sequelize literal for area calculation
 */
export const calcArea = (geojson) => {
  const geomString = JSON.stringify(geojson);
  return sequelize.literal(
    `ST_Area(ST_SetSRID(ST_GeomFromGeoJSON('${geomString}'), 4326)::geography)`
  );
};

/**
 * Calculate the perimeter of a GeoJSON geometry in meters.
 *
 * @param {Object} geojson - The GeoJSON geometry
 * @returns {sequelize.literal} - Sequelize literal for perimeter calculation
 */
export const calcPerimeter = (geojson) => {
  const geomString = JSON.stringify(geojson);
  return sequelize.literal(
    `ST_Perimeter(ST_SetSRID(ST_GeomFromGeoJSON('${geomString}'), 4326)::geography)`
  );
};
