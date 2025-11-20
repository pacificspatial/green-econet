// shapeSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { addShape, deleteShape, getShapes, updateShape } from "@/api/project";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { Shapes } from "@/types/Shapes";

interface shapeState {
  shapes: Shapes[];
  loading: boolean;
  error: string | null;
}

const initialState: shapeState = {
  shapes: [],
  loading: false,
  error: null,
};

const shapeSlice = createSlice({
  name: "shapes",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch shapes
    builder.addCase(getShapes.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      getShapes.fulfilled,
      (state, action: PayloadAction<Shapes[]>) => {
        state.loading = false;
        state.shapes = action.payload;
      }
    );
    builder.addCase(getShapes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add Shape
    builder.addCase(addShape.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      addShape.fulfilled,
      (state, action: PayloadAction<Shapes>) => {
        state.loading = false;
        if (action.payload.shape_id) {
          // Create a new array instead of mutating
          state.shapes = [...state.shapes, action.payload];
        } else {
          state.error = "shapeIdIsMissing";
        }
      }
    );
    builder.addCase(addShape.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Shape
    builder.addCase(updateShape.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      updateShape.fulfilled,
      (state, action: PayloadAction<Shapes>) => {
        state.loading = false;
        if (action.payload.shape_id) {
          state.shapes = state.shapes.map((shape) =>
            shape.shape_id === action.payload.shape_id ? action.payload : shape
          );
        } else {
          state.error = "shapeIdIsMissing";
        }
      }
    );
    builder.addCase(updateShape.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete Shape
    builder.addCase(deleteShape.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      deleteShape.fulfilled,
      (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.shapes = state.shapes.filter(
          (shape) => shape.shape_id !== action.payload
        );
      }
    );
    builder.addCase(deleteShape.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

const persistConfig = {
  key: "shapes",
  storage,
  whitelist: ["shapes"], // Only persist the shape array
};

// Create persisted reducer
const persistedProjectReducer = persistReducer(
  persistConfig,
  shapeSlice.reducer
);

export const { clearError } = shapeSlice.actions;
export default persistedProjectReducer;
export type { shapeState };
