import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, CartState, Product } from "../types";

const STORAGE_KEY = "mec_cart_v1";

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CartItem[];
  } catch {
    /* ignorar */
  }
  return [];
}

function persistCart(items: CartItem[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignorar */
  }
}

function productToCartItem(product: Product): Omit<CartItem, "qty"> {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category,
  };
}

const initialState: CartState = {
  items: loadCartFromStorage(),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<Product>) {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (!existing) {
        state.items.push({ ...productToCartItem(action.payload), qty: 1 });
        persistCart(state.items);
        return;
      }

      existing.qty += 1;
      persistCart(state.items);
    },
    increment(state, action: PayloadAction<string>) {
      const item = state.items.find((i) => i.id === action.payload);
      if (!item) return;
      item.qty += 1;
      persistCart(state.items);
    },
    decrement(state, action: PayloadAction<string>) {
      state.items = state.items
        .map((item) =>
          item.id === action.payload ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0);
      persistCart(state.items);
    },
    removeItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
      persistCart(state.items);
    },
    clearCart(state) {
      state.items = [];
      persistCart(state.items);
    },
  },
});

export const { addItem, increment, decrement, removeItem, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;

export const selectCartItems = (state: { cart: CartState }) => state.cart.items;

export const selectCartTotals = (state: { cart: CartState }) => {
  const items = state.cart.items;
  return {
    totalItems: items.reduce((sum, item) => sum + item.qty, 0),
    totalPrice: items.reduce((sum, item) => sum + item.price * item.qty, 0),
  };
};
