import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "./slices/projectSlice";
import { persistStore } from 'redux-persist';

export const store = configureStore({
    reducer: {
        projects: projectReducer,
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
