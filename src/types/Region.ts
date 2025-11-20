export type Geometry =
  | GeoJSON.Polygon
  | GeoJSON.Point
  | GeoJSON.LineString
  | GeoJSON.MultiPoint
  | GeoJSON.MultiLineString
  | GeoJSON.MultiPolygon
  | GeoJSON.Geometry;

export interface Region {
  city: number;
  city_name: string;
  geom: Geometry;
  key_code: string;
  pref_name: string;
  s_name: string;
}

export type Regions = Region[];
