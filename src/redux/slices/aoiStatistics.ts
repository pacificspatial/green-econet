import { fetchAOIStatistics } from "@/api/lookup";
import { AOIStatsDataI } from "@/types/AOIStatsData";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the state structure
type AOIStatisticsState = {
  [key: number]: {
    data: AOIStatsDataI | "no_stats" | null;
    loading: boolean;
    error: string | null;
  };
};

// Define initial state
const initialState: AOIStatisticsState = {
  1: { data: null, loading: false, error: null },
  2: { data: null, loading: false, error: null },
  3: { data: null, loading: false, error: null },
};

// Create the slice
const aoiStatisticsSlice = createSlice({
  name: "aoiStatistics",
  initialState,
  reducers: {
    // Keep existing reducers
    setAOIStatistics: (
      state,
      action: PayloadAction<{
        key: number;
        data: AOIStatsDataI | "no_stats" | null;
      }>
    ) => {
      if (state[action.payload.key]) {
        state[action.payload.key].data = action.payload.data;
      }
    },
    resetAOIStatistics: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Handle pending state
      .addCase(fetchAOIStatistics.pending, (state, action) => {
        const aoiType = action.meta.arg.aoiType;
        if (state[Number(aoiType)]) {
          state[Number(aoiType)].loading = true;
          state[Number(aoiType)].error = null;
        }
      })
      // Handle fulfilled state
      .addCase(fetchAOIStatistics.fulfilled, (state, action) => {
        const { key, data } = action.payload;
        if (state[key]) {
          state[key].data = data;
          state[key].loading = false;
          state[key].error = null;
        }
      })
      // Handle rejected state
      .addCase(fetchAOIStatistics.rejected, (state, action) => {
        const aoiType = action.meta.arg.aoiType;
        if (state[Number(aoiType)]) {
          state[Number(aoiType)].loading = false;
          state[Number(aoiType)].error = action.payload as string;
        }
      });
  },
});

export const { setAOIStatistics, resetAOIStatistics } =
  aoiStatisticsSlice.actions;
export default aoiStatisticsSlice.reducer;
export type { AOIStatisticsState };
