import { AttributeType } from "@/types/User";
import { createSlice } from "@reduxjs/toolkit";

interface AuthSliceState {
  isVerified: boolean;
  isAdmin: boolean;
  userId: string | null;
  userData: AttributeType[] | null;
  token: string | null;
}

const initialState: AuthSliceState = {
  isVerified: false,
  isAdmin: false,
  userId: null,
  userData: null,
  token: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {
    setVerificationStatus: (state, action) => {
      state.isVerified = action.payload;
    },
    setAdminStatus: (state, action) => {
      state.isAdmin = action.payload;
    },
    setUserData: (state, action) => {
      // Add a reducer to set userData
      state.userData = action.payload;
    },
    setUserId: (state, action) => {
      // Add a reducer to set userId
      state.userId = action.payload;
    },
    setToken: (state, action) => {
      // Add a reducer to set userId
      state.token = action.payload;
    },
    clearUserData: () => {
      return initialState;
    },
  },
});

export const {
  setVerificationStatus,
  setAdminStatus,
  setUserData,
  setUserId,
  setToken,
  clearUserData,
} = authSlice.actions;

export default authSlice.reducer;
export type { AuthSliceState };
