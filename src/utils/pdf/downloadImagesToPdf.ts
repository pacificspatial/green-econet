import { initializeMap } from "../map/mapUtils";
import type { MapInitOptions } from "../map/mapUtils";
import type { FeatureCollection } from "geojson";

interface LayerStyle {
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
  lineWidth?: number;
}

interface RenderGeoJsonOptions {
  geojson: FeatureCollection;
  mapOptions: Omit<MapInitOptions, "container">;
  layerStyle?: LayerStyle;
  width?: number;
  height?: number;
}

export const snapMapImage = async ({
  geojson,
  mapOptions,
  layerStyle = {},
  width = 800,
  height = 600,
}: RenderGeoJsonOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create off-screen container
    const container = document.createElement("div");
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.position = "absolute";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    try {
      const map = initializeMap({ container, ...mapOptions });

      map.on("load", () => {
        try {
          // Detect if empty GeoJSON
          const isEmpty =
            !geojson ||
            !Array.isArray((geojson as any).features) ||
            (geojson as any).features.length === 0;

          if (!isEmpty) {
            const features = (geojson as FeatureCollection).features;

            // Extract coordinates
            const coords = features.flatMap((f) => {
              if (f.geometry.type === "Point") {
                return [f.geometry.coordinates as [number, number]];
              }
              if (f.geometry.type === "LineString") {
                return f.geometry.coordinates as [number, number][];
              }
              if (f.geometry.type === "Polygon") {
                return f.geometry.coordinates[0] as [number, number][];
              }
              if (f.geometry.type === "MultiPolygon") {
                return f.geometry.coordinates.flatMap(
                  (poly) => poly[0] as [number, number][]
                );
              }
              return [];
            });

            if (coords.length > 0) {
              const lats = coords.map((c) => c[1]);
              const lngs = coords.map((c) => c[0]);

              const bounds = [
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)],
              ] as mapboxgl.LngLatBoundsLike;

              map.fitBounds(bounds, { padding: 20, maxZoom: 17 });
            }

            // Add GeoJSON source
            map.addSource("geojson-data", {
              type: "geojson",
              data: geojson,
            });

            // Add fill layer
            map.addLayer({
              id: "geojson-fill",
              type: "fill",
              source: "geojson-data",
              paint: {
                "fill-color": layerStyle?.fillColor || "#000",
                "fill-opacity": layerStyle?.fillOpacity ?? 0.4,
              },
            });

            // Add line layer
            map.addLayer({
              id: "geojson-line",
              type: "line",
              source: "geojson-data",
              paint: {
                "line-color": layerStyle?.lineColor || "#000",
                "line-width": layerStyle?.lineWidth ?? 2,
              },
            });
          }

          // Wait for map to be completely rendered
          map.once("idle", () => {
            const imageDataUrl = map.getCanvas().toDataURL("image/png");
            map.remove();
            container.remove();
            resolve(imageDataUrl);
          });
        } catch (err) {
          console.error("snapMapImage inner error:", err);
          map.remove();
          container.remove();
          reject(err);
        }
      });

      // On map error
      map.on("error", (e) => {
        console.error("Mapbox error:", e);
        map.remove();
        container.remove();
        reject(e);
      });
    } catch (err) {
      console.error("snapMapImage outer error:", err);
      container.remove();
      reject(err);
    }
  });
};
