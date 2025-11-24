import { layerColors } from "@/constants/layerColors";
import type { LayerConfig, LayerName } from "@/types/Layers";

export const greenLayerConfig: LayerConfig = {
  id: "green",
  style: {
    type: "fill",
    paint: {
      "fill-color": layerColors.green,
      "fill-opacity": 0.4,
    },
  },
};

export const bufferGreenLayerConfig: LayerConfig = {
  id: "bufferGreen",
  style: {
    type: "fill",
    paint: {
      "fill-color": layerColors.bufferGreen,
      "fill-opacity": 0.4,
    },
  },
};

// Collection of all layer configs
export const layerConfigs: Record<LayerName, LayerConfig> = {
  green: greenLayerConfig,
  bufferGreen: bufferGreenLayerConfig,
};
