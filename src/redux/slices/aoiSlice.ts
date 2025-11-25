import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Feature } from 'geojson';

interface AoiPolygon {
  id: string;
  geom: Feature;
  area: number;
  perimeter: number;
}

interface AoiState {
  polygons: AoiPolygon[];
}

const initialState: AoiState = {
  polygons: [],
};

const aoiSlice = createSlice({
  name: 'aoi',
  initialState,
  reducers: {
    addAoiPolygon: (
      state,
      action: PayloadAction<{ id: string, geom: Feature; area: number; perimeter: number }>
    ) => {
      const nextIndex = state.polygons.length + 1;

      const geomWithName = {
        ...action.payload.geom,
        id: action.payload.id,
        properties: {
          ...(action.payload.geom.properties || {}),
          name: `Shape ${nextIndex}`,
          _id: action.payload.id,
        },
      };

      state.polygons.push({
        id: action.payload.id,
        geom: geomWithName,
        area: action.payload.area,
        perimeter: action.payload.perimeter,
      });
    },
    updateAoiPolygon: (
      state,
      action: PayloadAction<{ geom: Feature; area: number; perimeter: number }>
    ) => {
      const { geom, area, perimeter } = action.payload;
      const id = geom.id;
      if (!id) return;

      const index = state.polygons.findIndex(p => p.geom.id === id);
      if (index !== -1) {
        const oldName = state.polygons[index].geom.properties?.name;

        const updatedGeom = {
          ...geom,
          properties: {
            ...(geom.properties || {}),
            name: oldName, // preserve name
          },
        };

        state.polygons[index] = {
          id: id as string,
          geom: updatedGeom,
          area,
          perimeter,
        };
      }
    },

    deleteAoiPolygon: (state, action: PayloadAction<string | number>) => {
      const deleteIndex = state.polygons.findIndex(
        polygon => polygon.geom.id === action.payload
      );

      if (deleteIndex === -1) return;

      state.polygons.splice(deleteIndex, 1);

      // Rename remaining polygons
      for (let i = deleteIndex; i < state.polygons.length; i++) {
        state.polygons[i].geom = {
          ...state.polygons[i].geom,
          properties: {
            ...(state.polygons[i].geom.properties || {}),
            name: `Shape ${i + 1}`,
          },
        };
      }
    },

    clearAoiPolygons: (state) => {
      state.polygons = [];
    },
    setAoiPolygons: (state, action: PayloadAction<AoiPolygon[]>) => {
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