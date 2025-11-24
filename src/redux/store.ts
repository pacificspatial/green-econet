import { configureStore } from "@reduxjs/toolkit";
import aoiReducer from "./slices/aoiSlice";
import projectReducer from "./slices/projectSlice";

export const store = configureStore({
  reducer: {
    aoi: aoiReducer,
    project: projectReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
