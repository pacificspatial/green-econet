// visibility-manager.ts
import { aoiLayerVisibility, resultLayerVisibility, simulationLayerVisibility } from "@/config/layers/initialLayerVisibility";

export const TAB_VISIBILITY_CONFIGS = {
  aoi: aoiLayerVisibility,
  simulation: simulationLayerVisibility,
  result: resultLayerVisibility,
};

type TabKey = keyof typeof TAB_VISIBILITY_CONFIGS
export const getVisibilityConfig = (tab: TabKey): { [key: string]: boolean } => {
  return TAB_VISIBILITY_CONFIGS[tab];
};

export const setLayerVisibility = (
  map: mapboxgl.Map,
  tab: TabKey,
  layerOverrides?: { [key: string]: boolean }
) => {
  const visibilityConfig = { ...getVisibilityConfig(tab), ...layerOverrides };

  Object.entries(visibilityConfig).forEach(([layerId, isVisible]) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", isVisible ? "visible" : "none");
    }
  });
};