// redux/slices/aoiSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Feature } from 'geojson';

interface AoiState {
  polygons: Feature[];
}

const initialState: AoiState = {
  polygons: [],
};

const aoiSlice = createSlice({
  name: 'aoi',
  initialState,
  reducers: {
  addAoiPolygon: (state, action: PayloadAction<Feature>) => {
    // Extract all numbers from existing shape names
    const existingNumbers = state.polygons
      .map(p => {
        const name = p.properties?.name;
        const parts = name?.split(" ");
        const num = Number(parts?.[1]);
        return isNaN(num) ? 0 : num;
      });

    // Find max number so far
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;

    // Next number
    const nextIndex = maxNumber + 1;

    // Build new polygon
    const polygonWithName = {
      ...action.payload,
      id: action.payload.id,
      properties: {
        ...(action.payload.properties || {}),
        name: `shape ${nextIndex}`,
      },
    };

    state.polygons.push(polygonWithName);
  },
    updateAoiPolygon: (state, action: PayloadAction<Feature>) => {
      const feature = action.payload;
      const id = feature.id;

      if (!id) return; // safety

      const index = state.polygons.findIndex(p => p.id === id);
      if (index !== -1) {
        state.polygons[index] = {
          ...feature,
          properties: {
            ...feature.properties,
            name: state.polygons[index].properties?.name, 
          }
        };
      }
    },
    deleteAoiPolygon: (state, action: PayloadAction<string | number>) => {
      state.polygons = state.polygons.filter(
        (polygon) => polygon.id !== action.payload
      );
    },
    clearAoiPolygons: (state) => {
      state.polygons = [];
    },
    setAoiPolygons: (state, action: PayloadAction<Feature[]>) => {
      state.polygons = action.payload;
    },
  },
});

export const {
  addAoiPolygon,
  updateAoiPolygon,
  deleteAoiPolygon,
  clearAoiPolygons,
  setAoiPolygons,
} = aoiSlice.actions;

export default aoiSlice.reducer;