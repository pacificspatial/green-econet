import mapboxgl from "mapbox-gl";

export interface MapInitOptions {
  container: HTMLElement;
  center: [number, number];
  zoom: number;
  basemap: string | string[];
  highResolution: boolean;
}

export const initializeMap = (options: MapInitOptions): mapboxgl.Map => {
  const { container, center, zoom, basemap, highResolution } = options;

  const isMapboxStyle =
    typeof basemap === "string" && basemap.startsWith("mapbox://styles/");

  const mapConfig: mapboxgl.MapOptions = {
    container: container,
    center: center,
    zoom: zoom,
  };

  if (isMapboxStyle) {
    mapConfig.style = basemap;
  } else {
    const tileUrl = Array.isArray(basemap) ? basemap : [basemap];
    mapConfig.style = {
      version: 8,
      sources: {
        "custom-tiles": {
          type: "raster",
          tiles: tileUrl,
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

  // Initialize the Mapbox map
  const map = new mapboxgl.Map(mapConfig);

  // Add navigation controls
  map.addControl(new mapboxgl.NavigationControl(), "bottom-left");

  return map;
};
