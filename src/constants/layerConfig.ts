export const CLIPPED_BUFFER125_LAYER_CONFIG = {
  id: 'clipped-buffer-125-green',
  type: 'fill' as const,
  paint: {
    'fill-color': '#c2e2fe',
    'fill-opacity': 0.6,
    'fill-outline-color': '#c2e2fe'
  }
};

export const CLIPPED_GREEN_LAYER_CONFIG = {
  id: 'clipped-green',
  type: 'fill' as const,
  paint: {
    'fill-color': '#386b24',
    'fill-opacity': 0.6,
    'fill-outline-color': '#386b24'
  },
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

export const MERGED_BUFFER125_LAYER_CONFIG = {
  id: 'merged-buffer125-green',
  type: 'fill' as const,
  paint: {
    'fill-color': '#c2e2fe',
    'fill-opacity': 0.6,
    'fill-outline-color': '#c2e2fe'
  }
};

export const MERGED_GREEN_LAYER_CONFIG = {
  id: 'merged-green',
  type: 'fill' as const,
  paint: {
    'fill-color': '#386b24',
    'fill-opacity': 0.6,
    'fill-outline-color': '#386b24'
  }
};