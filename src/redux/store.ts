import { configureStore, combineReducers } from "@reduxjs/toolkit";
import aoiReducer from "./slices/aoiSlice";
import projectReducer from "./slices/projectSlice";

import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";

const projectPersistConfig = {
  key: "project",
  storage,
  whitelist: ["projects", "selectedProject"], 
};

const rootReducer = combineReducers({
  aoi: aoiReducer,
  project: persistReducer(projectPersistConfig, projectReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
