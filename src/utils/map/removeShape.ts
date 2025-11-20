export const removeShapeFromMap = (
  mapInstance: React.MutableRefObject<mapboxgl.Map | null>,
  drawInstance: React.MutableRefObject<MapboxDraw | null>,
  geom: GeoJSON.Geometry
) => {
  if (!mapInstance.current || !drawInstance.current) return;

  const draw = drawInstance.current;
  const features = draw.getAll().features;

  // Find the feature with the same geometry and remove it
  const featureToRemove = features.find(
    (feature) => JSON.stringify(feature.geometry) === JSON.stringify(geom)
  );

  if (featureToRemove) {
    draw.delete(featureToRemove.id as string);
  }
};
