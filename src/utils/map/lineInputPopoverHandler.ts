// utils/map/lineDrawingPopup.ts
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

interface LineDrawingState {
  isDrawing: boolean;
  coordinates: [number, number][];
  popup: mapboxgl.Popup | null;
}

// Create a popup instance for line length display
export const createLinePopup = (): mapboxgl.Popup => {
  return new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'line-length-popup',
    maxWidth: 'none'
  });
};

// Calculate line length using Turf.js
export const calculateLineLength = (coordinates: [number, number][]): number => {
  if (coordinates.length < 2) return 0;
  const lineString = turf.lineString(coordinates);
  return turf.length(lineString, { units: 'meters' });
};

// Update popup content with length information
export const updatePopupContent = (
  popup: mapboxgl.Popup,
  lngLat: mapboxgl.LngLat,
  length: number
): void => {
  popup
    .setLngLat(lngLat)
    .setHTML(`<div class="line-length-display">${length.toFixed(2)} m</div>`);
};

// Handle map click for line drawing
export const handleLineDrawingClick = (
  e: mapboxgl.MapMouseEvent,
  currentMode: string,
  state: React.MutableRefObject<LineDrawingState>,
  map: mapboxgl.Map,
  onMouseMoveSetup: (handler: (e: mapboxgl.MapMouseEvent) => void) => void
): void => {
  if (currentMode !== 'draw_line_string') return;

  if (!state.current.isDrawing) {
    // First click - start drawing and initialize popup
    state.current.isDrawing = true;
    state.current.coordinates = [];
    
    // Create popup that follows cursor
    state.current.popup = createLinePopup();
    
    // Set up mousemove handler
    const mouseMoveHandler = (moveEvent: mapboxgl.MapMouseEvent) => {
      if (state.current.isDrawing && state.current.popup && state.current.coordinates.length > 0) {
        const tempCoords: [number, number][] = [...state.current.coordinates, [moveEvent.lngLat.lng, moveEvent.lngLat.lat]];
        const length = calculateLineLength(tempCoords);
        updatePopupContent(state.current.popup, moveEvent.lngLat, length);
      }
    };
    
    onMouseMoveSetup(mouseMoveHandler);
  }
  
  // Add current click position to coordinates
  state.current.coordinates.push([e.lngLat.lng, e.lngLat.lat]);

  if (state.current.coordinates.length === 1) {
    // For the first click, show the popup at the click location with 0 distance
    if (state.current.popup) {
      updatePopupContent(state.current.popup, e.lngLat, 0);
      state.current.popup.addTo(map);
    }
  } else if (state.current.coordinates.length > 1) {
    // For subsequent clicks, calculate the actual line length
    const length = calculateLineLength(state.current.coordinates);
    if (state.current.popup) {
      updatePopupContent(state.current.popup, e.lngLat, length);
      state.current.popup.addTo(map);
    }
  }
};

// Create mousemove handler for line drawing
export const createLineDrawingMouseMoveHandler = (
  state: React.MutableRefObject<LineDrawingState>
) => {
  return (e: mapboxgl.MapMouseEvent) => {
    if (state.current.isDrawing && state.current.popup && state.current.coordinates.length > 0) {
      const tempCoords: [number, number][] = [...state.current.coordinates, [e.lngLat.lng, e.lngLat.lat]];
      const length = calculateLineLength(tempCoords);
      updatePopupContent(state.current.popup, e.lngLat, length);
    }
  };
};

// Handle mode changes
export const handleLineDrawingModeChange = (
  e: { mode: string },
  state: React.MutableRefObject<LineDrawingState>,
  onCleanup: () => void
): void => {
  if (e.mode !== 'draw_line_string') {
    onCleanup();
  }
};

// Handle draw render events
export const handleLineDrawingRender = (
  drawInstance: MapboxDraw | null,
  state: React.MutableRefObject<LineDrawingState>,
  onCleanup: () => void
): void => {
  if (!drawInstance) return;

  const currentMode = drawInstance.getMode();
  
  // Check for double click (end of line drawing)
  if (currentMode === 'simple_select' && state.current.isDrawing) {
    onCleanup();
  }
};

// Handle draw cancel events
export const handleLineDrawingCancel = (
  state: React.MutableRefObject<LineDrawingState>,
  onCleanup: () => void
): void => {
  if (state.current.isDrawing) {
    onCleanup();
  }
};

// Cleanup function for line drawing
export const cleanupLineDrawing = (
  state: React.MutableRefObject<LineDrawingState>,
  map: mapboxgl.Map,
  mouseMoveHandler: ((e: mapboxgl.MapMouseEvent) => void) | null
): void => {
  state.current.isDrawing = false;
  state.current.coordinates = [];
  
  if (state.current.popup) {
    state.current.popup.remove();
    state.current.popup = null;
  }
  
  if (mouseMoveHandler) {
    map.off('mousemove', mouseMoveHandler);
  }
};

// Initialize line drawing state
export const createLineDrawingState = (): LineDrawingState => {
  return {
    isDrawing: false,
    coordinates: [],
    popup: null
  };
};

// Handle map click for line updating (direct_select mode)
export const handleLineUpdatingClick = (
  e: mapboxgl.MapMouseEvent,
  currentMode: string,
  state: React.MutableRefObject<LineDrawingState>,
  map: mapboxgl.Map,
  draw: MapboxDraw,
  onMouseMoveSetup: (handler: (e: mapboxgl.MapMouseEvent) => void) => void
): void => {
  if (currentMode !== "direct_select") return;

  const selected = draw.getSelected().features[0];
  if (!selected || selected.geometry.type !== "LineString") return;

  const coordinates = selected.geometry.coordinates as [number, number][];

  // Find nearest vertex to click (within tolerance)
  let vertexIndex = -1;
  let minDist = Infinity;
  coordinates.forEach((coord, idx) => {
    const dist = turf.distance(turf.point(coord), turf.point([e.lngLat.lng, e.lngLat.lat]), {
      units: "meters",
    });
    if (dist < minDist) {
      minDist = dist;
      vertexIndex = idx;
    }
  });

  if (vertexIndex === -1) return;

  // Create popup if not already
  if (!state.current.popup) {
    state.current.popup = createLinePopup();
  }

  const length = calculateLineLength(coordinates);
  state.current.popup
    .setLngLat(coordinates[vertexIndex] as [number, number])
    .setHTML(`<div class="line-length-display">${length.toFixed(2)} m</div>`)
    .addTo(map);

  // Mousemove handler to update popup as user drags the vertex
  const mouseMoveHandler = (moveEvent: mapboxgl.MapMouseEvent) => {
    const updated = draw.getSelected().features[0];
    if (!updated || updated.geometry.type !== "LineString") return;

    const updatedCoords = updated.geometry.coordinates as [number, number][];
    const updatedLength = calculateLineLength(updatedCoords);

    if (state.current.popup) {
      state.current.popup
        .setLngLat([moveEvent.lngLat.lng, moveEvent.lngLat.lat])
        .setHTML(`<div class="line-length-display">${updatedLength.toFixed(2)} m</div>`);
    }
  };

  onMouseMoveSetup(mouseMoveHandler);
};
