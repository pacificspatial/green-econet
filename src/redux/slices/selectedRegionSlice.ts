import { LandUseRegions } from "@/types/LandUseRegion";
import { Parks } from "@/types/Park";
import { Region } from "@/types/Region";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SelectedRegionState {
  regionData: Region | null;
  parkData: Parks | null;
  landUseRegionData: LandUseRegions | null;
}

const initialState: SelectedRegionState = {
  regionData: null,
  parkData: null,
  landUseRegionData: null,
};

const selectedRegionSlice = createSlice({
  name: "selectedRegion",
  initialState,
  reducers: {
    setSelectedRegion: (state, action: PayloadAction<Region | null>) => {
      state.regionData = action.payload;
    },
    clearSelectedRegion: (state) => {
      state.regionData = null;
    },
    setSelectedPark: (state, action: PayloadAction<Parks | null>) => {
      state.parkData = action.payload;
    },
    clearSelectedPark: (state) => {
      state.parkData = null;
    },
    setSelectedLandUseRegion: (state, action: PayloadAction<Parks | null>) => {
      state.landUseRegionData = action.payload;
    },
    clearSelectedLandUseRegion: (state) => {
      state.landUseRegionData = null;
    },
  },
});

export default selectedRegionSlice.reducer;
export const {
  setSelectedRegion,
  clearSelectedRegion,
  setSelectedPark,
  clearSelectedPark,
  setSelectedLandUseRegion,
  clearSelectedLandUseRegion,
} = selectedRegionSlice.actions;
export type { SelectedRegionState };
