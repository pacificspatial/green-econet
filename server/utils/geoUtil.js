import sequelize from "../config/dbConfig.js";

export const toGeography = (geojson) => {
  const geomString = JSON.stringify(geojson);
  return sequelize.literal(
    `ST_SetSRID(ST_GeomFromGeoJSON('${geomString}'), 4326)::geography`
  );
};

export const calcArea = (geojson) => {
  const geomString = JSON.stringify(geojson);
  return sequelize.literal(
    `ST_Area(ST_SetSRID(ST_GeomFromGeoJSON('${geomString}'), 4326)::geography)`
  );
};

export const calcPerimeter = (geojson) => {
  const geomString = JSON.stringify(geojson);
  return sequelize.literal(
    `ST_Perimeter(ST_SetSRID(ST_GeomFromGeoJSON('${geomString}'), 4326)::geography)`
  );
};
