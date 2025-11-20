import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "./slices/projectSlice";
import shapeReducer from "./slices/shapeSlice";
import selectedRegionReducer from "./slices/selectedRegionSlice";
import selectedAoiReducer from "./slices/selectedAoiSlice";
import frozenProject from "./slices/frozenProjectSlice";
import authReducer from './slices/authSlice';
import aoiStatistics from "./slices/aoiStatistics";
import savedAoi from "./slices/savedAoi";
import { persistStore } from 'redux-persist';



export const store = configureStore({
    reducer: {
        projects: projectReducer,
        selectedRegion: selectedRegionReducer, 
        selectedAoi: selectedAoiReducer,
        savedAoi: savedAoi,
        shapes:shapeReducer,
        frozenProject: frozenProject,
        auth: authReducer,
        aoiStatistics: aoiStatistics,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

export const persistor = persistStore(store);


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
