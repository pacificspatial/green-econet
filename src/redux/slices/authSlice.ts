import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  password: string | null;
}

const initialState: AuthState = {
  password: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setPassword(state, action: PayloadAction<string | null>) {
      state.password = action.payload;
    },
  },
});

export const { setPassword } = authSlice.actions;
export default authSlice.reducer;
