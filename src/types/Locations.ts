export interface Geometry {
  type: "Point";
  coordinates: [number, number]; // Ensures correct format for Mapbox
}

export interface LocationFeature {
  geom: Geometry;
}
