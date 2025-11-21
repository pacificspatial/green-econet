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
      const polygonWithName = {
        ...action.payload,
        id: action.payload.id, 
        properties: {
          ...(action.payload.properties || {}),
          name: `Shape ${nextIndex}`,
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