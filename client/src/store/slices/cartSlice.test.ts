import { describe, expect, it } from "vitest";
import cartReducer, { addItem, clearCart, increment } from "./cartSlice";
import type { Product } from "../../types";

const sampleProduct: Product = {
  id: "p1",
  name: "Collar",
  price: 1000,
  image: "/img.png",
  category: "collares",
};

describe("cartSlice", () => {
  it("agrega un producto nuevo", () => {
    const state = cartReducer({ items: [] }, addItem(sampleProduct));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].qty).toBe(1);
  });

  it("incrementa cantidad si el producto ya existe", () => {
    const initial = cartReducer({ items: [] }, addItem(sampleProduct));
    const state = cartReducer(initial, addItem(sampleProduct));
    expect(state.items[0].qty).toBe(2);
  });

  it("incrementa por id", () => {
    const initial = cartReducer({ items: [] }, addItem(sampleProduct));
    const state = cartReducer(initial, increment("p1"));
    expect(state.items[0].qty).toBe(2);
  });

  it("vacía el carrito", () => {
    const initial = cartReducer({ items: [] }, addItem(sampleProduct));
    const state = cartReducer(initial, clearCart());
    expect(state.items).toEqual([]);
  });
});
