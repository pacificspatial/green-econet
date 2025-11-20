import { LandUseRegions } from "@/types/LandUseRegion";
import { fitBoundsToGeometry } from "./fitBoundsToGeometry";
import { Parks } from "@/types/Park";
import { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
export const handleRegionVisualization = async (
  map: mapboxgl.Map,
  region: { geom: Geometry } | null,
  options = { fillColor: "#0080ff", fillOpacity: 0.5 }
) => {
  try {
    // Helper function to remove existing layers and sources
    const removeLayerFromMap = () => {
      ["selectedRegionLayer", "selectedRegionBorderLayer"].forEach((layer) => {
        if (map.getLayer(layer)) map.removeLayer(layer);
      });
      if (map.getSource("selectedRegion")) map.removeSource("selectedRegion");
    };

    if (!region?.geom) {
      removeLayerFromMap();
      return;
    }

    // Function to actually add the visualization
    const addVisualization = () => {
      removeLayerFromMap();

      map.addSource("selectedRegion", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: region.geom,
          properties: {},
        },
      });

      map.addLayer({
        id: "selectedRegionLayer",
        type: "fill",
        source: "selectedRegion",
        paint: {
          "fill-color": options.fillColor,
          "fill-opacity": options.fillOpacity,
        },
      });

      map.addLayer({
        id: "selectedRegionBorderLayer",
        type: "line",
        source: "selectedRegion",
        paint: {
          "line-color": options.fillColor,
          "line-width": 2,
        },
      });

      fitBoundsToGeometry(map, region.geom);
    };

    // Check if map is ready using idle state
    if (map.loaded()) {
      addVisualization();
    } else {
      const onIdle = () => {
        map.off("idle", onIdle);
        addVisualization();
      };
      map.on("idle", onIdle);
    }
  } catch (error) {
    console.error("Error in handleRegionVisualization:", error);
    throw error;
  }
};

export const handleMultipleRegionVisualization = async (
  map: mapboxgl.Map,
  regions: Parks | LandUseRegions | null,
  options = { fillColor: "#0080ff", fillOpacity: 0.5 }
) => {
  try {
    // Helper function to remove existing layers and sources
    const removeLayerFromMap = () => {
      ["selectedMultiRegionLayer", "selectedMultiRegionBorderLayer"].forEach(
        (layer) => {
          if (map.getLayer(layer)) map.removeLayer(layer);
        }
      );
      if (map.getSource("selectedMultiRegion"))
        map.removeSource("selectedMultiRegion");
    };

    if (!regions || regions.length === 0) {
      removeLayerFromMap();
      return;
    }

    // Function to actually add the visualization
    const addVisualization = (regions: Parks) => {
      removeLayerFromMap();

      const featureCollection: FeatureCollection<Geometry, GeoJsonProperties> =
        {
          type: "FeatureCollection",
          features: regions.map((region) => ({
            type: "Feature",
            geometry: region.geom,
            properties: {
              id: region.properties?.id ?? null,
            },
          })),
        };

      map.addSource("selectedMultiRegion", {
        type: "geojson",
        data: featureCollection,
      });

      map.addLayer({
        id: "selectedMultiRegionLayer",
        type: "fill",
        source: "selectedMultiRegion",
        paint: {
          "fill-color": options.fillColor,
          "fill-opacity": options.fillOpacity,
        },
      });

      map.addLayer({
        id: "selectedMultiRegionBorderLayer",
        type: "line",
        source: "selectedMultiRegion",
        paint: {
          "line-color": options.fillColor,
          "line-width": 2,
        },
      });

      // Optionally fit to all geometries
      const geometryCollection: Geometry = {
        type: "GeometryCollection",
        geometries: regions.map((r) => r.geom),
      };

      fitBoundsToGeometry(map, geometryCollection);
    };

    // Check if map is ready using idle state
    if (map.loaded()) {
      addVisualization(regions);
    } else {
      const onIdle = () => {
        map.off("idle", onIdle);
        addVisualization(regions);
      };
      map.on("idle", onIdle);
    }
  } catch (error) {
    console.error("Error in handleRegionVisualization:", error);
    throw error;
  }
};
