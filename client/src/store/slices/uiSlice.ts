import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ActiveGroupPayload, UiState } from "../types";

const initialState: UiState = {
  cartOpen: false,
  query: "",
  activeGroupKey: null,
  activeSubId: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setCartOpen(state, action: PayloadAction<boolean>) {
      state.cartOpen = action.payload;
    },
    openCart(state) {
      state.cartOpen = true;
    },
    closeCart(state) {
      state.cartOpen = false;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    setActiveGroup(state, action: PayloadAction<ActiveGroupPayload>) {
      state.activeGroupKey = action.payload.groupKey;
      state.activeSubId = action.payload.subId;
    },
    setActiveSubId(state, action: PayloadAction<string | null>) {
      state.activeSubId = action.payload;
    },
  },
});

export const {
  setCartOpen,
  openCart,
  closeCart,
  setQuery,
  setActiveGroup,
  setActiveSubId,
} = uiSlice.actions;

export default uiSlice.reducer;

export const selectUi = (state: { ui: UiState }) => state.ui;
