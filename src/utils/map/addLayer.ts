import {
  aoiLayerVisibility,
  resultLayerVisibility,
  simulationLayerVisibility,
} from "@/config/layers/initialLayerVisibility";
import { LandUseRegion, LandUseRegions } from "@/types/LandUseRegion";
import { Park, Parks } from "@/types/Park";
import { Geometry, FeatureCollection } from "geojson";

// Types for layer configuration
type LayerType =
  | "fill"
  | "line"
  | "symbol"
  | "circle"
  | "heatmap"
  | "fill-extrusion";

interface LayerStyle {
  type: LayerType;
  paint: mapboxgl.PaintSpecification;
  layout?: mapboxgl.LayoutSpecification;
  minzoom?: number;
  maxzoom?: number;
}

interface LayerConfig {
  id: string;
  style: LayerStyle;
  beforeId?: string;
}

// Interface for layer data
export interface LayerData {
  geom: Geometry;
  properties?: Record<string, string | number | boolean | null>;
  [key: string]: unknown;
}

const moveLocationPointsToTop = (map: mapboxgl.Map) => {
  if (map.getLayer("location-points")) {
    map.moveLayer("location-points");
  }
};

export const addStyledLayer = async (
  map: mapboxgl.Map | null,
  layerConfig: LayerConfig,
  data: LayerData[] | Parks | LandUseRegions,
  selectedTab?: string, // Explicit tab types
  selectedAoiType?: number
): Promise<void> => {
  if (!map) return;

  try {
    await removeStyledLayer(map, layerConfig.id);

    const sourceId = `source-${layerConfig.id}`;
    const layerId = `layer-${layerConfig.id}`;

    const geoJsonData: FeatureCollection = {
      type: "FeatureCollection",
      features: data?.map((feature: LayerData | Park | LandUseRegion) => ({
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

    const visibilityConfig =
      selectedTab === "aoi"
        ? aoiLayerVisibility
        : selectedTab === "simulation"
          ? simulationLayerVisibility
          : resultLayerVisibility;

    let isVisible = visibilityConfig[layerId] ?? true;
    if (["layer-parkLayer", "layer-landUseRegion"].includes(layerId)) {
      isVisible = selectedAoiType === 2 && selectedTab === "aoi" ? true : false;
    }

    // Add layer with proper visibility
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

    moveLocationPointsToTop(map);
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
