export const CLIPPED_BUFFER125_LAYER_CONFIG = {
  id: 'clipped-buffer-125-green',
  type: 'fill' as const,
  paint: {
    'fill-color': '#4CAF50',
    'fill-opacity': 0.6,
    'fill-outline-color': '#2E7D32'
  }
};

export const CLIPPED_GREEN_LAYER_CONFIG = {
  id: 'clipped-green',
  type: 'fill' as const,
  paint: {
    'fill-color': '#1565C0',
    'fill-opacity': 0.6,
    'fill-outline-color': '#1565C0'
  }
};

export const PROJECT_LAYER_CONFIG = {
  id: "project-boundary",
  type: "line" as const,
  paint: {
    "line-color": "#000",
    "line-width": 3,
    "line-opacity": 0.8,
  },
};

export const PROJECT_POLYGONS_LAYER_CONFIG = {
  id: 'project-polygons',
  type: "line" as const,
  paint: {
    "line-color": "#000",
    "line-width": 1,
    "line-opacity": 0.8,
  },
};