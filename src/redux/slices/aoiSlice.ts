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
      const nextIndex = state.polygons.length + 1;

      const newPolygon = {
        ...action.payload,
        properties: {
          ...(action.payload.properties || {}),
          name: `Shape ${nextIndex}`,
        },
      };

      state.polygons.push(newPolygon);
    },
    updateAoiPolygon: (state, action: PayloadAction<Feature>) => {
      const feature = action.payload;
      const id = feature.id;
      if (!id) return;

      const index = state.polygons.findIndex(p => p.id === id);
      if (index !== -1) {
        state.polygons[index] = {
          ...feature,
          properties: {
            ...feature.properties,
            name: state.polygons[index].properties?.name, 
          },
        };
      }
    },
    deleteAoiPolygon: (state, action: PayloadAction<string | number>) => {
      // Find the index of the polygon being deleted
      const deleteIndex = state.polygons.findIndex(
        polygon => polygon.id === action.payload
      );

      if (deleteIndex === -1) return;

      // Remove the polygon
      state.polygons.splice(deleteIndex, 1);

      // Only rename polygons AFTER the deleted index
      for (let i = deleteIndex; i < state.polygons.length; i++) {
        state.polygons[i] = {
          ...state.polygons[i],
          properties: {
            ...(state.polygons[i].properties || {}),
            name: `Shape ${i + 1}`,
          },
        };
      }
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