import { configureStore } from "@reduxjs/toolkit";
import catalogReducer from "./slices/catalogSlice";
import uiReducer from "./slices/uiSlice";
import cartReducer from "./slices/cartSlice";
import type { RootState } from "../types";

export const store = configureStore({
  reducer: {
    catalog: catalogReducer,
    ui: uiReducer,
    cart: cartReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
export type { RootState };
