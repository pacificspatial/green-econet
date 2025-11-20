import { createSlice } from "@reduxjs/toolkit";
import { Geometry } from "@/types/Region";
import { fetchSavedAoiThunk } from "@/api/project";

interface SavedAoiState {
  geom: Geometry | null;
  aoi_type: number | null;
  s_name?: string;
}

const initialState: {
  savedAoi: SavedAoiState | null;
  loading: boolean;
  error: string | null;
} = {
  savedAoi: null,
  loading: false,
  error: null,
};

const savedAoiSlice = createSlice({
  name: "savedAoi",
  initialState,
  reducers: {
    resetSavedAoi: () => {
      return { ...initialState };
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedAoiThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedAoiThunk.fulfilled, (state, action) => {
        state.savedAoi = action.payload;
        state.loading = false;
      })
      .addCase(fetchSavedAoiThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch saved AOI";
      });
  },
});

export const { resetSavedAoi, resetError } = savedAoiSlice.actions;

export default savedAoiSlice.reducer;

export type { SavedAoiState };
