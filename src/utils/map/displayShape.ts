import { Geometry } from "@/types/Region";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

export const displayShapeOnMap = (
  mapInstance: React.MutableRefObject<mapboxgl.Map | null>,
  drawInstance: React.MutableRefObject<MapboxDraw | null>,
  shape_id: string,
  geom: Geometry,
  clearExisting: boolean = true
) => {
  if (!mapInstance.current) return;

  const map = mapInstance.current;

  // Ensure MapboxDraw is initialized
  if (!drawInstance.current) {
    drawInstance.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    });
    map.addControl(drawInstance.current);
  }

  // Convert shape to GeoJSON Feature
  const geoJsonFeature: GeoJSON.Feature = {
    type: "Feature",
    id: shape_id,
    geometry: geom,
    properties: {},
  };

  // If clearExisting is true, delete all shapes first
  if (clearExisting) {
    drawInstance.current.deleteAll();
  }

  // Get existing features
  const existingFeatures = drawInstance.current.getAll().features;

  // Add new feature to existing features
  const updatedFeatures: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: clearExisting
      ? [geoJsonFeature]
      : [...existingFeatures, geoJsonFeature],
  };

  // Set all features at once
  drawInstance.current.set(updatedFeatures);

  moveDrawLayersToTop(map);
};

export const moveDrawLayersToTop = (map: mapboxgl.Map) => {
  const layers = map.getStyle()?.layers;

  if (!layers) return;

  // Move all layers containing 'gl-draw' to the top
  layers.forEach((layer) => {
    if (layer.id.includes("gl-draw")) {
      map.moveLayer(layer.id);
    }
  });
};
