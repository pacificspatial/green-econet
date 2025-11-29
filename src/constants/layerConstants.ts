import type { LayerName } from "@/types/Layers";

// Define a set of colors for different layers
export const layerColors: Record<LayerName, string> = {
  green: "#006400",
  bufferGreen: "#85e085",
};

export const layerPMTileFileNames: Record<LayerName, string> = {
  green: "green.pmtiles",
  bufferGreen: "buff125_green.pmtiles"
}