import { configureStore } from "@reduxjs/toolkit";

const dummyReducer = (state = {}, action: any) => state;
export const store = configureStore({
  reducer: {
    dummy: dummyReducer,
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
