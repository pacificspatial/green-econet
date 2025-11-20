import { Geometry } from "@/types/Region";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SelectedAoiState {
  aoiSelected: number;
  value?: string;
  geom: Geometry | null;
}

const initialState: SelectedAoiState = {
  aoiSelected: 1,
  value: "polygon",
  geom: null,
};

const selectedAoiSlice = createSlice({
  name: "selectedAoi",
  initialState,
  reducers: {
    setSelectedAoi: (state, action: PayloadAction<{ aoiSelected: number }>) => {
      state.aoiSelected = action.payload.aoiSelected;

      // Set the value based on aoiSelected
      switch (state.aoiSelected) {
        case 1:
          state.value = "polygon";
          break;
        case 2:
          state.value = "region";
          break;
      }
    },
    setSelectedAoiPolygonGeom: (
      state,
      action: PayloadAction<Geometry | null>
    ) => {
      state.geom = action.payload;
    },
    clearSelectedAoi: (state) => {
      state.aoiSelected = 1;
      state.value = "polygon";
      state.geom = null;
    },
  },
});

export default selectedAoiSlice.reducer;
export const { setSelectedAoi, setSelectedAoiPolygonGeom, clearSelectedAoi } =
  selectedAoiSlice.actions;
export type { SelectedAoiState };
