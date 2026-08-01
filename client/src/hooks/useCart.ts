import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  addItem,
  clearCart,
  decrement,
  increment,
  removeItem,
  selectCartItems,
  selectCartTotals,
} from "../store/slices/cartSlice";
import type { Product } from "../types";

/** Composable: carrito leyendo de la store Redux (single source of truth). */
export function useCart() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const { totalItems, totalPrice } = useAppSelector(selectCartTotals);

  return useMemo(
    () => ({
      items,
      totalItems,
      totalPrice,
      addItem: (product: Product) => dispatch(addItem(product)),
      increment: (id: string) => dispatch(increment(id)),
      decrement: (id: string) => dispatch(decrement(id)),
      removeItem: (id: string) => dispatch(removeItem(id)),
      clear: () => dispatch(clearCart()),
    }),
    [dispatch, items, totalItems, totalPrice]
  );
}
