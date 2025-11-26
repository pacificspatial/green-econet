import type { Map as MapboxMap } from "mapbox-gl";
import type { FeatureCollection } from "geojson";

export interface LayerData {
  geom: GeoJSON.Geometry;
  properties?: Record<string, any>;
}

export interface GenericLayerConfig {
  id: string; // e.g., "parks" → becomes layer-parks & source-parks
  type: "fill" | "line" | "symbol" | "circle" | "heatmap" | "fill-extrusion";
  paint?: mapboxgl.PaintSpecification;
  layout?: mapboxgl.LayoutSpecification;
}

export interface LayerOptions {
  visible?: boolean;
  beforeId?: string;
  sourceId?: string;
  layerId?: string;
}

/* ---------------------- REMOVE LAYER GENERIC ---------------------- */
export const removeLayer = (
  map: MapboxMap,
  layerId: string,
  sourceId: string
) => {
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
};

/* ---------------------- ADD LAYER GENERIC ---------------------- */
export const addLayer = async (
  map: MapboxMap,
  config: GenericLayerConfig,
  data: LayerData[],
  options: LayerOptions = {}
) => {
  if (!map) return;

  const sourceId = options.sourceId ?? `source-${config.id}`;
  const layerId = options.layerId ?? `layer-${config.id}`;
  const visible = options.visible ?? true;

  // Cleanup old layer/source
  removeLayer(map, layerId, sourceId);

  // Convert to GeoJSON
  const geoJson: FeatureCollection = {
    type: "FeatureCollection",
    features: data.map((f) => ({
      type: "Feature",
      geometry: f.geom,
      properties: f.properties ?? {},
    })),
  };

  // Add or update source
  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "geojson",
      data: geoJson,
    });
  } else {
    (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geoJson);
  }

  // Build layer spec
  const layerSpec: mapboxgl.LayerSpecification = {
    id: layerId,
    type: config.type,
    source: sourceId,
    paint: config.paint ?? {},
    layout: {
      ...config.layout,
      visibility: visible ? "visible" : "none",
    },
  };

  // Add layer
  map.addLayer(layerSpec, options.beforeId);
};
