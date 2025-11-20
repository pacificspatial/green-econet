// Define a set of colors for different layers
export const layerColors: Record<string, string> = {
  dragonflyHabitat: "#5FB9DF",
  lizardHabitat: "#3333FF",
  locations: "#9ACB48",
  whiteyeHabitat: "#0A2F15",
  watershed: "#000",
  parkLayer: "#4CAF50",
  roads: "#000000",
  landUseRegion: "#4CAF50",
};

// Define hazard colors based on a31a_205 value
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const hazardColors: any = {
  1: "#F6F599",
  2: "#FFCEB3",
  3: "#FDA6A9",
  4: "#FC7A7F",
};
