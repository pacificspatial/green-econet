import maplibregl from "maplibre-gl";
import type { MapOptions } from "maplibre-gl";

export interface MapInitOptions {
  container: HTMLElement;
  center: [number, number];
  zoom: number;
  basemap: string | string[];
  highResolution: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Initialize a MapLibre map.
 * Supports:
 *  - mapbox://styles/{user}/{style_id}  → raster tiles from Mapbox Styles API
 *  - http(s) style URLs                  → MapLibre style JSON URL
 *  - plain raster tile URLs (string | string[])
 */
export const initializeMap = (options: MapInitOptions): maplibregl.Map => {
  const { container, center, zoom, basemap, highResolution } = options;

  const mapConfig: MapOptions = {
    container,
    center,
    zoom,
  };

  const isString = typeof basemap === "string";

  const isMapboxStyle =
    isString && (basemap as string).startsWith("mapbox://styles/");

  const isHttpStyle =
    isString &&
    ((basemap as string).startsWith("http://") ||
      (basemap as string).startsWith("https://"));

  if (isHttpStyle && !isMapboxStyle) {
    // Direct style JSON URL (your own MapLibre style, etc.)
    mapConfig.style = basemap as string;
  } else {
    // Build raster tile URLs
    let tileUrls: string[] = [];

    if (isMapboxStyle) {
      // Convert mapbox://styles/user/style-id → raster tiles endpoint
      //
      // e.g. basemap = "mapbox://styles/mapbox/streets-v12"
      // stylePath = "mapbox/streets-v12"
      const stylePath = (basemap as string).replace("mapbox://styles/", "");

      if (!MAPBOX_TOKEN) {
        console.warn(
          "[mapUtils] MAPBOX style URL used, but VITE_MAPBOX_TOKEN is not set. Tiles may fail to load."
        );
      }

      const tileSize = highResolution ? 512 : 256;
      const pixelRatio = highResolution ? "@2x" : "";

      // See Mapbox Styles API docs for tiles URL format
      const tileUrl = `https://api.mapbox.com/styles/v1/${stylePath}/tiles/${tileSize}/{z}/{x}/{y}${pixelRatio}?access_token=${MAPBOX_TOKEN}`;

      tileUrls = [tileUrl];
    } else {
      // Plain raster tiles from your own server
      tileUrls = Array.isArray(basemap)
        ? (basemap as string[])
        : [basemap as string];
    }

    mapConfig.style = {
      version: 8,
      sources: {
        "custom-tiles": {
          type: "raster",
          tiles: tileUrls,
          tileSize: highResolution ? 512 : 256,
        },
      },
      layers: [
        {
          id: "custom-layer",
          type: "raster",
          source: "custom-tiles",
          minzoom: 0,
          maxzoom: 22,
        },
      ],
    };
  }

  const map = new maplibregl.Map(mapConfig);
  map.addControl(new maplibregl.NavigationControl(), "bottom-left");

  return map;
};
