import { getS3PreSignedUrl } from "@/api/s3PreSignedUrl";
import { layerVisibilityConfig } from "@/config/layers/initialLayerVisibility";
import type { LayerConfig } from "@/types/Layers";
import PmTilesSource from "mapbox-pmtiles";
import { PMTiles } from "pmtiles";

export interface Metadata {
  vector_layers: { id: string }[];
}
export const addStyledLayer = async (
  map: mapboxgl.Map | null,
  layerConfig: LayerConfig,
  fileName: string
): Promise<void> => {
  if (!map) return;

  try {
    await removeStyledLayer(map, layerConfig.id);

    let tileUrl = "";
    //step 1: fetch presigned url from server
    const res = await getS3PreSignedUrl({ fileName });

    if (res.success) {
      tileUrl = res.data;
    }
    const header = await PmTilesSource.getHeader(tileUrl);
    const bounds = [header.minLon, header.minLat, header.maxLon, header.maxLat];
    const sourceId = `source-${layerConfig.id}`;
    const layerId = `layer-${layerConfig.id}`;

    const pmtiles = new PMTiles(tileUrl);
    const metadata = (await pmtiles.getMetadata()) as Metadata;
    const sourceLayer = metadata?.vector_layers[0]?.id;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: PmTilesSource.SOURCE_TYPE as any,
        url: tileUrl,
        minzoom: header.minZoom,
        maxzoom: header.maxZoom,
        bounds: bounds as [number, number, number, number],
      });
    }

    const isVisible = layerVisibilityConfig[layerId] ?? true;

    // Add layer
    const layerOptions: mapboxgl.LayerSpecification = {
      id: layerId,
      type: layerConfig.style.type,
      source: sourceId,
      "source-layer": sourceLayer,
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
