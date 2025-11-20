// Get the topmost layer
export const getTopmostLayer = (map: mapboxgl.Map | undefined) => {
  const layers = map?.getStyle()?.layers;
  if (layers) {
    return layers[layers.length - 1].id;
  }
};
