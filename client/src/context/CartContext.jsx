import { createContext, useContext, useEffect, useMemo, useReducer } from "react";

const CartContext = createContext(null);

// Clave de almacenamiento temporal: sessionStorage se borra al cerrar la pestaña,
// por lo que el carrito "desaparece" cuando la persona deja de usar el catálogo.
const STORAGE_KEY = "mec_cart_v1";

function loadInitialState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { items: JSON.parse(raw) };
  } catch {
    /* ignorar */
  }
  return { items: [] };
}

function reducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const { product } = action;
      const existing = state.items.find((i) => i.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === product.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            qty: 1,
          },
        ],
      };
    }
    case "INCREMENT":
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, qty: i.qty + 1 } : i
        ),
      };
    case "DECREMENT":
      return {
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, qty: i.qty - 1 } : i))
          .filter((i) => i.qty > 0),
      };
    case "REMOVE":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* ignorar */
    }
  }, [state.items]);

  const value = useMemo(() => {
    const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0);
    const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return {
      items: state.items,
      totalItems,
      totalPrice,
      addItem: (product) => dispatch({ type: "ADD", product }),
      increment: (id) => dispatch({ type: "INCREMENT", id }),
      decrement: (id) => dispatch({ type: "DECREMENT", id }),
      removeItem: (id) => dispatch({ type: "REMOVE", id }),
      clear: () => dispatch({ type: "CLEAR" }),
    };
  }, [state.items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
