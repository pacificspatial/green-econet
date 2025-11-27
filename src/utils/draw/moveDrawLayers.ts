export const moveDrawLayersToTop = (map: maplibregl.Map) => {
  const layers = map.getStyle()?.layers;

  if (!layers) return;

  // Move all layers containing 'gl-draw' to the top
  layers.forEach((layer) => {
    if (layer.id.includes("gl-draw")) {
      map.moveLayer(layer.id);
    }
  });
};