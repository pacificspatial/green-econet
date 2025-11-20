import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FrozenProjectState {
  isProjectFrozen: boolean;
}

const initialState: FrozenProjectState = {
  isProjectFrozen: false,
};

const statsSlice = createSlice({
  name: "frozenProject",
  initialState,
  reducers: {
    setFrozenProjectState: (state, action: PayloadAction<boolean>) => {
      state.isProjectFrozen = action.payload;
    },
  },
});

export const { setFrozenProjectState } = statsSlice.actions;
export default statsSlice.reducer;
export type { FrozenProjectState };
