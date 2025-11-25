import { initializeMap } from "../map/mapUtils";
import type { MapInitOptions } from "../map/mapUtils";
import type { FeatureCollection } from "geojson";

interface ShapeImagesOptions {
  // Array of 4 GeoJSON FeatureCollections
  shapes: FeatureCollection[]; 
  // container will be created internally
  mapOptions: Omit<MapInitOptions, "container">; 
  width?: number;
  height?: number;
}

export const downloadImagesToPdf = async ({
  shapes,
  mapOptions,
  width = 800,
  height = 600,
}: ShapeImagesOptions): Promise<string[]> => {
  const imageUrls: string[] = [];

  const renderShapeToImage = (shape: FeatureCollection): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Create a hidden container
      const container = document.createElement("div");
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.position = "absolute";
      container.style.top = "-9999px";
      document.body.appendChild(container);

      try {
        // Initialize map using your helper
        const map = initializeMap({ container, ...mapOptions });

        map.on("load", () => {
          // Flatten coordinates to [lng, lat][]
          const coordinates: [number, number][] = shape.features.flatMap((f) => {
            if (f.geometry.type === "Polygon") {
              // Type assertion: outer ring coordinates are [lng, lat][]
              return f.geometry.coordinates[0] as [number, number][];
            } else if (f.geometry.type === "MultiPolygon") {
              // Flatten all outer rings, assert type
              return f.geometry.coordinates.flatMap(
                (poly) => poly[0] as [number, number][]
              );
            }
            return [];
          });

          if (coordinates.length > 0) {
            const lats = coordinates.map((c) => c[1]);
            const lngs = coordinates.map((c) => c[0]);
            const bounds = [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ] as mapboxgl.LngLatBoundsLike;

            map.fitBounds(bounds, { padding: 20, maxZoom: 17 });
          }

          // Add shape layer
          map.addSource("shape", {
            type: "geojson",
            data: shape,
          });

          map.addLayer({
            id: "shape-fill",
            type: "fill",
            source: "shape",
            paint: {
              "fill-color": "#FF0000",
              "fill-opacity": 0.4,
            },
          });

          map.addLayer({
            id: "shape-line",
            type: "line",
            source: "shape",
            paint: {
              "line-color": "#FF0000",
              "line-width": 2,
            },
          });

          // Wait for map to be completely idle (all tiles loaded, rendering complete)
          map.once("idle", () => {
            const img = map.getCanvas().toDataURL("image/png");
            map.remove();
            container.remove();
            resolve(img);
          });
        });

        // Handle map errors
        map.on("error", (e) => {
          console.error("Map error:", e);
          map.remove();
          container.remove();
          reject(e);
        });
      } catch (error) {
        container.remove();
        reject(error);
      }
    });
  };

  // Sequentially render all shapes
  for (const shape of shapes) {
    const img = await renderShapeToImage(shape);
    imageUrls.push(img);
  }

  return imageUrls;
};