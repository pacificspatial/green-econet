import type {
  Map as MapboxMap,
  AnySourceData,
  AnyLayer,
} from "mapbox-gl";

/**
 * Safely adds a layer with its source.
 * Removes existing layer/source with the same ID before adding.
 */
export function addLayer(
  map: MapboxMap,
  layerId: string,
  source: AnySourceData,
  layer: Omit<AnyLayer, "id" | "source"> 
): void {
  if (!map || !map.isStyleLoaded()) {
    console.warn("Map style not loaded yet");
    return;
  }

  // Remove if exists
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(layerId)) {
    map.removeSource(layerId);
  }

  // Add source
  map.addSource(layerId, source);

  // Add layer
  map.addLayer({
    id: layerId,
    source: layerId,
    ...layer,
  });
}

/**
 * Safely removes a layer + its source.
 */
export function removeLayer(map: MapboxMap, layerId: string): void {
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(layerId)) {
    map.removeSource(layerId);
  }

  console.log(`Layer "${layerId}" removed`);
}
