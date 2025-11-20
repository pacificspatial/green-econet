import { Geometry } from "@/types/Region";
import { fitBoundsToGeometry } from "./fitBoundsToGeometry";

export const handleAOIVisualization = async (
  map: mapboxgl.Map,
  geom: Geometry,
  options = {
    fillColor: "#356CB6",
    fillOpacity: 0.1,
    lineColor: "#356CB6",
    lineWidth: 2,
  }
) => {
  if (!geom) return;

  // Cleanup function to remove existing layers and sources
  const cleanup = () => {
    ["savedAOILayer", "savedAOILayer-outline"].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });
    if (map.getSource("savedAOI")) {
      map.removeSource("savedAOI");
    }
  };

  // Function to add visualization
  const addVisualization = () => {
    cleanup();

    // Add source
    map.addSource("savedAOI", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: geom,
        properties: {},
      },
    });

    // Add fill layer
    map.addLayer({
      id: "savedAOILayer",
      type: "fill",
      source: "savedAOI",
      paint: {
        "fill-color": options.fillColor,
        "fill-opacity": options.fillOpacity,
      },
    });

    // Add outline layer
    map.addLayer({
      id: "savedAOILayer-outline",
      type: "line",
      source: "savedAOI",
      paint: {
        "line-color": options.lineColor,
        "line-width": options.lineWidth,
      },
    });

    // Fit the map to the geometry bounds
    fitBoundsToGeometry(map, geom);
  };

  try {
    // Check if map is ready by waiting for idle event
    if (map.loaded()) {
      addVisualization();
      return cleanup;
    } else {
      return new Promise((resolve) => {
        const onIdle = () => {
          map.off("idle", onIdle);
          addVisualization();
          resolve(cleanup);
        };
        map.on("idle", onIdle);
      });
    }
  } catch (error) {
    console.error("Error in handleAOIVisualization:", error);
    cleanup(); // Clean up on error
    throw error;
  }
};
