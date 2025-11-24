import { layerVisibilityConfig } from "@/config/layers/initialLayerVisibility";
import type { LayerConfig, LayerData } from "@/types/Layers";
import type { FeatureCollection } from "geojson";

export const addStyledLayer = async (
  map: mapboxgl.Map | null,
  layerConfig: LayerConfig,
  data: LayerData[]
): Promise<void> => {
  if (!map) return;

  try {
    await removeStyledLayer(map, layerConfig.id);

    const sourceId = `source-${layerConfig.id}`;
    const layerId = `layer-${layerConfig.id}`;

    const geoJsonData: FeatureCollection = {
      type: "FeatureCollection",
      features: data?.map((feature: LayerData) => ({
        type: "Feature",
        geometry: feature.geom,
        properties: feature.properties || {},
      })),
    };

    // Add or update source
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: geoJsonData,
      });
    } else {
      const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
      source.setData(geoJsonData);
    }

    const isVisible = layerVisibilityConfig[layerId] ?? true;

    // Add layer
    const layerOptions: mapboxgl.LayerSpecification = {
      id: layerId,
      source: sourceId,
      type: layerConfig.style.type,
      paint: layerConfig.style.paint,
      layout: {
        ...layerConfig.style.layout,
        visibility: isVisible ? "visible" : "none",
      },
    };

    if (!map.getLayer(layerId)) {
      if (layerConfig.beforeId) {
        map.addLayer(layerOptions, layerConfig.beforeId);
      } else {
        map.addLayer(layerOptions);
      }
    } else {
      // Update visibility if layer already exists
      map.setLayoutProperty(
        layerId,
        "visibility",
        isVisible ? "visible" : "none"
      );
    }
    console.log(`layer ${layerId} has added`);
  } catch (error) {
    console.error(`Error adding layer ${layerConfig.id}:`, error);
    throw error;
  }
};

export const removeStyledLayer = async (
  map: mapboxgl.Map,
  layerId: string
): Promise<void> => {
  if (!map) return;

  try {
    const sourceId = `source-${layerId}`;
    const fullLayerId = `layer-${layerId}`;

    if (map.getLayer(fullLayerId)) {
      map.removeLayer(fullLayerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  } catch (error) {
    const typedError = error as Error;
    console.error(`Error removing layer ${layerId}:`, typedError.message);
    throw error;
  }
};
