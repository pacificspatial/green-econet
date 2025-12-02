import maplibregl from "maplibre-gl";
import { PMTiles, Protocol } from "pmtiles";
import { getS3PreSignedUrl } from "@/api/s3";
import { layerVisibilityConfig } from "@/config/layers/initialLayerVisibility";
import type { LayerConfig } from "@/types/Layers";
import { appEnvs } from "@/constants/appEnvWhitelist";

export interface Metadata {
  vector_layers: { id: string }[];
}
const APP_ENV = import.meta.env.VITE_APP_ENV;
const ENV = appEnvs.includes(APP_ENV) ? APP_ENV : "development";
const DOMAIN = import.meta.env.VITE_DOMAIN || "";

// Global pmtiles protocol instance (register once per app)
let pmtilesProtocol: Protocol | null = null;

function ensurePmTilesProtocol() {
  if (!pmtilesProtocol) {
    pmtilesProtocol = new Protocol();
    try {
      // register "pmtiles://" scheme with MapLibre
      maplibregl.addProtocol(
        "pmtiles",
        pmtilesProtocol.tile.bind(pmtilesProtocol)
      );
    } catch (err) {
      // if already registered, ignore
      console.debug("pmtiles protocol already registered (or failed):", err);
    }
  }
}

async function waitForStyle(map: maplibregl.Map) {
  if (map.isStyleLoaded()) return;
  await new Promise<void>((resolve) => {
    const on = () => {
      if (map.isStyleLoaded()) {
        map.off("styledata", on);
        resolve();
      }
    };
    map.on("styledata", on);
  });
}

/**
 * Add a styled vector layer backed by a PMTiles file from S3.
 */
export const addStyledLayer = async (
  map: maplibregl.Map | null,
  layerConfig: LayerConfig,
  fileName: string
): Promise<void> => {
  if (!map) return;

  try {
    await waitForStyle(map);
    await removeStyledLayer(map, layerConfig.id);

    let tileUrl = "";
    //if env is development then get the presigned url otherwise call directly
    if (ENV === "development") {
      const res = await getS3PreSignedUrl({ fileName: `tiles/${fileName}`, bucketName: "tile" });

      if (res.success) {
        tileUrl = res.data;
      }
    } else {
      tileUrl = `${DOMAIN}/tiles/${fileName}`;
    }

    // Ensure pmtiles protocol is registered with MapLibre
    ensurePmTilesProtocol();

    // Read metadata to grab vector_layers[0].id for source-layer
    const pmtiles = new PMTiles(tileUrl);
    const metadata = (await pmtiles.getMetadata()) as Metadata;
    const sourceLayer = metadata?.vector_layers?.[0]?.id;

    const sourceId = `source-${layerConfig.id}`;
    const layerId = `layer-${layerConfig.id}`;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "vector",
        // use pmtiles protocol
        url: `pmtiles://${tileUrl}`,
      } as any);
    }

    const isVisible = layerVisibilityConfig[layerId] ?? true;

    const layerOptions: any = {
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
  map: maplibregl.Map,
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

/**
 * Generic GeoJSON layer helpers (used for clipped_* & project layers)
 */
export async function addLayer(
  map: maplibregl.Map,
  layerId: string,
  source: any,
  layer: any
) {
  await waitForStyle(map);

  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(layerId)) {
    map.removeSource(layerId);
  }

  map.addSource(layerId, source);

  map.addLayer({
    id: layerId,
    source: layerId,
    ...layer,
  } as any);
}

export function removeLayer(map: maplibregl.Map, layerId: string): void {
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(layerId)) {
    map.removeSource(layerId);
  }
}
